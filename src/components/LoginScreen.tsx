import React, { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { login } from '../services/authService';
import ThemeToggle from './ui/ThemeToggle';

interface Props {
  onSuccess: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError('');
    const r = await login(password);
    setBusy(false);
    if (r.ok) {
      onSuccess();
    } else {
      setError(r.error || 'Não foi possível entrar.');
      setPassword('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--shell-bg)', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 10 }}>
        <ThemeToggle onShell />
      </div>
      {/* ── Lado do formulário ── */}
      <div style={{ flex: '0 1 480px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem' }}>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 340 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #1FD75F, #15803A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#072011', boxShadow: '0 4px 16px 0 rgba(31,215,95,0.35)',
          }}>
            <Lock size={20} />
          </div>

          <h1 style={{ margin: '0 0 0.4rem', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
            Bem-vindo(a)
          </h1>
          <p style={{ margin: '0 0 1.75rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
            Dashboard de Métricas LM · acesso restrito
          </p>

          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '0.75rem 0.9rem', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#fff', fontSize: '0.9rem', outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#1FD75F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31,215,95,0.18)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.boxShadow = 'none'; }}
          />

          {error && (
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.82rem', color: '#fca5a5' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={busy || !password}
            style={{
              marginTop: '1.25rem', width: '100%',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '0.75rem 1rem', borderRadius: 10, border: 'none',
              fontSize: '0.9rem', fontWeight: 700, fontFamily: 'inherit',
              cursor: busy || !password ? 'not-allowed' : 'pointer',
              color: busy || !password ? 'rgba(255,255,255,0.5)' : '#062a20',
              background: busy || !password ? 'rgba(255,255,255,0.08)' : 'var(--primary)',
              boxShadow: busy || !password ? 'none' : 'var(--shadow-brand)',
              transition: 'all 0.15s',
            }}
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {busy ? 'Entrando...' : 'Entrar'}
          </button>

          <p style={{ margin: '1.5rem 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
            Acesso protegido. Em caso de dúvida, fale com o time Venice.
          </p>
        </form>
      </div>

      {/* ── Lado hero (marca Venice) ── */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        background: 'linear-gradient(180deg, #0F2A16 0%, #090A09 100%)',
      }}>
        {/* glow radial verde neon */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 60% 45%, rgba(31,215,95,0.24) 0%, rgba(31,215,95,0.08) 55%, transparent 100%)',
        }} />
        <img
          src="/venice-by-blite.svg"
          alt="Venice by blite"
          style={{ position: 'relative', width: 'min(58%, 380px)', filter: 'brightness(0) invert(1)' }}
        />
      </div>
    </div>
  );
};
