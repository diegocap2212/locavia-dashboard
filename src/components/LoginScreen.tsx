import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { login } from '../services/authService';
import ThemeToggle from './ui/ThemeToggle';
import Button from './ui/Button';
import { Input } from './ui/Input';

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
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--page)', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 10 }}>
        <ThemeToggle />
      </div>

      {/* ── Lado do formulário ── */}
      <div style={{ flex: '0 1 480px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem' }}>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 340 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #5FE389, #15803A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#072011', boxShadow: 'var(--shadow-brand)',
          }}>
            <Lock size={20} />
          </div>

          <h1 style={{ margin: '0 0 0.4rem', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Bem-vindo(a)
          </h1>
          <p style={{ margin: '0 0 1.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Dashboard de Métricas LM · acesso restrito
          </p>

          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
            error={error || undefined}
          />

          <Button
            type="submit"
            variant="accent"
            loading={busy}
            disabled={!password}
            style={{ marginTop: '1.25rem', width: '100%' }}
          >
            {busy ? 'Entrando...' : 'Entrar'}
          </Button>

          <p style={{ margin: '1.5rem 0 0', fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            Acesso protegido. Em caso de dúvida, fale com o time Venice.
          </p>
        </form>
      </div>

      {/* ── Lado hero (marca Venice) — painel verde de acento ── */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderLeft: '1px solid var(--border-subtle)',
        background: 'linear-gradient(160deg, #5FE389 0%, #2BE86B 55%, #15B14C 100%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 60% 42%, rgba(255,255,255,0.30) 0%, transparent 60%)',
        }} />
        <img
          src="/venice-by-blite.svg"
          alt="Venice by blite"
          style={{ position: 'relative', width: 'min(58%, 380px)', filter: 'brightness(0)' }}
        />
      </div>
    </div>
  );
};
