import crypto from 'crypto';

/**
 * Sessão do gate de login (senha única). Token assinado por HMAC, guardado em cookie HttpOnly.
 *
 * Filosofia "não-quebra-dev": se SESSION_SECRET/DASHBOARD_PASSWORD NÃO estão setados (local/testes),
 * `sessionConfigured()` é false e `isAuthed()` retorna true — tudo aberto, como antes.
 * Em produção, basta setar as duas envs para ativar o gate em todos os endpoints que checam.
 *
 * Limite honesto: isto protege a UI e as APIs. O `data.json` ainda é embarcado no bundle público
 * (baixável por quem inspecionar o JS). Proteção real do dataset = servir dados por API autenticada
 * (P1, fora deste escopo).
 */

export const SESSION_COOKIE = 'dash_session';
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12h

export function sessionConfigured(): boolean {
  return !!process.env.SESSION_SECRET && !!process.env.DASHBOARD_PASSWORD;
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function makeToken(secret: string): string {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

function verifyToken(token: string, secret: string): boolean {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = sign(payload, secret);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

export function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

export function cookieHeader(token: string, maxAge: number = MAX_AGE_SECONDS): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

/** true se a requisição está autenticada — ou se o gate não está configurado (dev). */
export function isAuthed(req: any): boolean {
  const secret = process.env.SESSION_SECRET || '';
  if (!secret || !process.env.DASHBOARD_PASSWORD) return true; // gate desativado
  const token = parseCookie(req?.headers?.cookie, SESSION_COOKIE);
  return !!token && verifyToken(token, secret);
}
