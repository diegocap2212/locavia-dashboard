// Endpoint autenticado que serve o dataset do Jira.
// Nível 3: o dataset (~5MB) vive no Vercel Blob (privado) — gravado pelo sync. Este endpoint
// lê o blob server-side e entrega só com sessão. Mantém um fallback para o src/data.json
// congelado (último commitado) caso o blob falhe/ainda não exista.
import crypto from 'crypto';
import { get } from '@vercel/blob';
import fallbackData from '../src/data.json' with { type: 'json' };
import fallbackMeta from '../src/data-meta.json' with { type: 'json' };

const BLOB_PATHNAME = 'jira-data.json';

// ── Sessão (inline; a Vercel não empacota imports relativos entre functions) ──
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
// ─────────────────────────────────────────────────────────────────────────────

interface Dataset { items: unknown[]; syncedAt: string | null }

async function loadFromBlob(): Promise<Dataset | null> {
  try {
    const res = await get(BLOB_PATHNAME, { access: 'private' });
    if (!res || res.statusCode !== 200) return null;
    const text = await new Response(res.stream).text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed?.items)) return { items: parsed.items, syncedAt: parsed.syncedAt ?? null };
    if (Array.isArray(parsed)) return { items: parsed, syncedAt: null };
    return null;
  } catch (e) {
    console.error('Blob read falhou, usando fallback:', e);
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isAuthed(req)) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const blob = await loadFromBlob();
  const dataset: Dataset = blob ?? {
    items: fallbackData as unknown[],
    syncedAt: (fallbackMeta as { syncedAt?: string }).syncedAt ?? null,
  };

  const etag = `W/"data-${dataset.syncedAt || 'fallback'}-${dataset.items.length}"`;
  res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
  res.setHeader('ETag', etag);
  if (req.headers?.['if-none-match'] === etag) {
    return res.status(304).end();
  }

  return res.status(200).json(dataset);
}
