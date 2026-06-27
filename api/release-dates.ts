import { Redis } from '@upstash/redis';
import crypto from 'crypto';

// ── Sessão (inline) ────────────────────────────────────────────────────────
// Inline de propósito: a Vercel não empacota imports relativos entre functions.
// isAuthed retorna true quando o gate não está configurado (dev), então não quebra o local.
const SESSION_COOKIE = 'dash_session';
function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}
function verifyToken(token: string, secret: string): boolean {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload, secret));
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}
function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}
function isAuthed(req: any): boolean {
  const secret = process.env.SESSION_SECRET || '';
  if (!secret || !process.env.DASHBOARD_PASSWORD) return true;
  const token = parseCookie(req?.headers?.cookie, SESSION_COOKIE);
  return !!token && verifyToken(token, secret);
}
// ────────────────────────────────────────────────────────────────────────────

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

// Hash onde cada campo é o id da release e o valor é o registro de datas editável pela LM.
// Campo: releaseId  ·  Valor: { startDate, targetDate, note, updatedAt, updatedBy }
// Escrita atômica por campo (HSET) — múltiplos editores não se sobrescrevem entre releases.
const HASH = 'locavia_release_dates_v1';

interface ReleaseDateRecord {
  startDate: string | null;   // YYYY-MM-DD (início/kickoff da release) — opcional
  targetDate: string | null;  // YYYY-MM-DD (data-alvo/meta) — opcional
  note: string;               // observação livre
  updatedAt: string;          // ISO, gerado no servidor
  updatedBy?: string;         // nome/responsável informado (opcional)
}

// Normaliza "YYYY-MM-DD" (ou vazio → null). Rejeita formatos inesperados.
function normDate(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

export default async function handler(req: any, res: any) {
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';
  const origin = (req.headers?.origin as string) || '';
  if (ALLOWED_ORIGIN && origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    if (ALLOWED_ORIGIN && origin && origin !== ALLOWED_ORIGIN) {
      res.status(403).end();
      return;
    }
    res.status(200).end();
    return;
  }

  if (!isAuthed(req)) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  try {
    if (req.method === 'GET') {
      const hash = await redis.hgetall(HASH);
      const out: Record<string, ReleaseDateRecord> = {};
      if (hash) {
        for (const [releaseId, value] of Object.entries(hash as Record<string, any>)) {
          out[releaseId] = typeof value === 'string' ? JSON.parse(value) : value;
        }
      }
      return res.status(200).json(out);
    }

    if (req.method === 'POST') {
      const { releaseId, startDate, targetDate, note, updatedBy } = req.body || {};
      if (!releaseId || typeof releaseId !== 'string') {
        return res.status(400).json({ error: 'Missing required field: releaseId' });
      }
      const record: ReleaseDateRecord = {
        startDate: normDate(startDate),
        targetDate: normDate(targetDate),
        note: typeof note === 'string' ? note.slice(0, 500) : '',
        updatedAt: new Date().toISOString(),
        updatedBy: typeof updatedBy === 'string' && updatedBy.trim() ? updatedBy.trim().slice(0, 120) : undefined,
      };
      await redis.hset(HASH, { [releaseId]: record });
      return res.status(200).json({ success: true, record });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Release-dates API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
