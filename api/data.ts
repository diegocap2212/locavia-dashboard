// Endpoint autenticado que serve o dataset do Jira. Antes o data.json era importado no client
// (ia no bundle público → qualquer um baixava tudo sem login). Agora ele vive SÓ no bundle
// server-side desta function e só é entregue com sessão válida.
import crypto from 'crypto';
import data from '../src/data.json';
import meta from '../src/data-meta.json';

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
// Sem gate configurado (dev) → libera, pra não travar o fluxo local.
function isAuthed(req: any): boolean {
  const secret = process.env.SESSION_SECRET || '';
  if (!secret || !process.env.DASHBOARD_PASSWORD) return true;
  const token = parseCookie(req?.headers?.cookie, SESSION_COOKIE);
  return !!token && verifyToken(token, secret);
}
// ─────────────────────────────────────────────────────────────────────────────

const syncedAt = (meta as { syncedAt?: string }).syncedAt || null;
// ETag estável por sync — permite 304 e evita reenviar ~5MB sem mudança.
const etag = `W/"data-${syncedAt || 'na'}"`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isAuthed(req)) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
  res.setHeader('ETag', etag);
  if (req.headers?.['if-none-match'] === etag) {
    return res.status(304).end();
  }

  return res.status(200).json({ items: data, syncedAt });
}
