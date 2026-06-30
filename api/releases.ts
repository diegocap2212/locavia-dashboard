import { Redis } from '@upstash/redis';
import crypto from 'crypto';

// Tipos mínimos do handler serverless (evita `any` e não exige @vercel/node).
interface ApiRequest {
  method?: string;
  headers?: Record<string, string | undefined>;
  body?: Record<string, unknown>;
}
interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
  end(): void;
}

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
function isAuthed(req: ApiRequest): boolean {
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

// Hash de releases criadas pela LM (sobre o release-config.json estático).
// Campo = id da release · Valor = registro completo da release.
// Escrita atômica por campo (HSET) — múltiplos editores não se sobrescrevem.
const HASH = 'locavia_releases_v1';

type Cone = 'locavia' | 'bf-cem';
type Generation = 'gen1' | 'gen2';

interface ReleaseRecord {
  id: string;
  displayName: string;
  deadline: string;            // ISO — data-alvo/meta da release
  cone: Cone;
  generation: Generation;
  percentileWindow: number;
  active: boolean;
  createdAt: string;           // ISO, gerado no servidor
  createdBy?: string;
}

// Aceita "YYYY-MM-DD" ou ISO; devolve ISO. null se inválido/vazio.
function normDeadline(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00.000Z` : s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';
  const origin = req.headers?.origin || '';
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
      const out: Record<string, ReleaseRecord> = {};
      if (hash) {
        for (const [id, value] of Object.entries(hash as Record<string, unknown>)) {
          out[id] = typeof value === 'string' ? JSON.parse(value) : (value as ReleaseRecord);
        }
      }
      return res.status(200).json(out);
    }

    if (req.method === 'POST') {
      const { id, displayName, deadline, cone, generation, percentileWindow, createdBy } = req.body || {};

      const cleanId = typeof id === 'string' ? id.trim().toUpperCase() : '';
      if (!/^[A-Z0-9][A-Z0-9-]{1,30}$/.test(cleanId)) {
        return res.status(400).json({ error: 'id inválido. Use o label da release no Jira (ex.: O4R4), só letras/números/hífen.' });
      }

      const dl = normDeadline(deadline);
      if (!dl) {
        return res.status(400).json({ error: 'deadline (data-alvo) inválida.' });
      }

      const coneVal: Cone = cone === 'bf-cem' ? 'bf-cem' : 'locavia';
      const genVal: Generation = generation === 'gen2' ? 'gen2' : 'gen1';
      const pw = Number(percentileWindow);
      const pwVal = Number.isFinite(pw) && pw >= 1 && pw <= 52 ? Math.round(pw) : 8;

      // Não sobrescrever uma release já criada (idempotência amigável).
      const exists = await redis.hexists(HASH, cleanId);
      if (exists) {
        return res.status(409).json({ error: `A release "${cleanId}" já existe.` });
      }

      const record: ReleaseRecord = {
        id: cleanId,
        displayName: typeof displayName === 'string' && displayName.trim() ? displayName.trim().slice(0, 120) : cleanId,
        deadline: dl,
        cone: coneVal,
        generation: genVal,
        percentileWindow: pwVal,
        active: true,
        createdAt: new Date().toISOString(),
        createdBy: typeof createdBy === 'string' && createdBy.trim() ? createdBy.trim().slice(0, 120) : undefined,
      };
      await redis.hset(HASH, { [cleanId]: record });
      return res.status(200).json({ success: true, record });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Releases API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) });
  }
}
