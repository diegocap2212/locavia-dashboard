import { Redis } from '@upstash/redis';
import crypto from 'crypto';

// ── Sessão (inline) ────────────────────────────────────────────────────────
// Inline de propósito: a Vercel não empacota imports relativos entre functions.
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

// Hash do andamento dos projetos. Campo: `projectId:phaseId`  ·  Valor: PhaseProgress.
// HSET atômico por fase → editores simultâneos não se sobrescrevem.
const HASH = 'locavia_project_status_v1';
const SEP = ':';

const STATUSES = ['nao_iniciada', 'em_andamento', 'em_risco', 'concluida'] as const;
type PhaseStatus = (typeof STATUSES)[number];

interface PhaseProgress {
  status: PhaseStatus;
  progress: number;       // 0..100
  note: string;
  updatedAt: string;      // ISO (servidor)
  updatedBy?: string;
}

function encodeField(projectId: string, phaseId: string): string {
  return [projectId, phaseId].map(encodeURIComponent).join(SEP);
}

// Reconstrói { [projectId]: { [phaseId]: PhaseProgress } } a partir dos campos planos.
function hashToTree(hash: Record<string, any>): Record<string, Record<string, PhaseProgress>> {
  const tree: Record<string, Record<string, PhaseProgress>> = {};
  for (const [field, value] of Object.entries(hash)) {
    const parts = field.split(SEP).map(decodeURIComponent);
    if (parts.length !== 2) continue;
    const [projectId, phaseId] = parts;
    if (!tree[projectId]) tree[projectId] = {};
    tree[projectId][phaseId] = typeof value === 'string' ? JSON.parse(value) : value;
  }
  return tree;
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
      return res.status(200).json(hash ? hashToTree(hash as Record<string, any>) : {});
    }

    if (req.method === 'POST') {
      const { projectId, phaseId, status, progress, note, updatedBy } = req.body || {};
      if (!projectId || !phaseId) {
        return res.status(400).json({ error: 'Missing required fields: projectId, phaseId' });
      }
      const safeStatus: PhaseStatus = STATUSES.includes(status) ? status : 'nao_iniciada';
      const safeProgress = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
      const record: PhaseProgress = {
        status: safeStatus,
        progress: safeProgress,
        note: typeof note === 'string' ? note.slice(0, 500) : '',
        updatedAt: new Date().toISOString(),
        updatedBy: typeof updatedBy === 'string' && updatedBy.trim() ? updatedBy.trim().slice(0, 120) : undefined,
      };
      await redis.hset(HASH, { [encodeField(projectId, phaseId)]: record });
      return res.status(200).json({ success: true, record });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Project-status API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
