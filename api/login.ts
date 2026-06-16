import crypto from 'crypto';
import { sessionConfigured, makeToken, cookieHeader, isAuthed } from './_session';

/**
 * Gate de login por senha única.
 *   GET    /api/login → { authenticated, configured }
 *   POST   /api/login { password } → seta cookie de sessão (HttpOnly) se a senha bate
 *   DELETE /api/login → logout (limpa o cookie)
 *
 * A senha vive só no servidor (env DASHBOARD_PASSWORD); a comparação é timing-safe.
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    return res.status(200).json({ authenticated: isAuthed(req), configured: sessionConfigured() });
  }

  if (req.method === 'POST') {
    if (!sessionConfigured()) {
      return res.status(503).json({ error: 'Login não configurado (faltam SESSION_SECRET/DASHBOARD_PASSWORD).' });
    }
    const secret = process.env.SESSION_SECRET as string;
    const expected = process.env.DASHBOARD_PASSWORD as string;
    const body = req.body || {};
    const provided = typeof body.password === 'string' ? body.password : '';

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!valid) return res.status(401).json({ error: 'Senha incorreta.' });

    res.setHeader('Set-Cookie', cookieHeader(makeToken(secret)));
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', cookieHeader('', 0));
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
