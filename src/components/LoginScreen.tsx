import React, { useState } from 'react';
import { login } from '../services/authService';
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
    // data-theme="dark" força o tema escuro só na tela de entrada (fiel ao DS),
    // independente do tema global — os tokens cascateiam para Input/Button.
    <div
      data-theme="dark"
      style={{
        // Fundo único #000 nos dois lados: o hard-light do "V" leva o backdrop
        // do render exatamente a #000, então os painéis batem sem emenda.
        minHeight: '100vh', display: 'flex', background: '#000',
        color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* ── Lado do formulário ── */}
      <div style={{ flex: '0 1 520px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem clamp(2rem, 5vw, 4.5rem)' }}>
        <img
          src="/venice-by-blite.svg"
          alt="Venice by blite"
          style={{ width: 150, marginBottom: '2.75rem', filter: 'brightness(0) invert(1)' }}
        />

        <h1 style={{ margin: '0 0 0.4rem', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff' }}>
          Bem-vindo(a)
        </h1>
        <p style={{ margin: '0 0 2rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Digite sua senha para acessar o dashboard
        </p>

        <form onSubmit={submit}>
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
            style={{ marginTop: '1.25rem', width: '100%', boxShadow: '0 8px 28px rgba(43,232,107,0.35)' }}
          >
            {busy ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p style={{ margin: '1.5rem 0 0', fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          Acesso protegido. Em caso de dúvida, fale com o time Venice.
        </p>
      </div>

      {/* ── Lado hero (marca Venice) — "V" de vidro sobre PRETO ──
         Fiel ao Figma (frame "Venice By Blite_Darck Bg" 2:137, fill #000):
         o render do "V" (1183x1126 em x=548,y=-149) é composto com blend
         HARD_LIGHT, o que apaga o backdrop cinza do render e mantém só o
         vidro brilhando sobre o preto. Enquadramento em % relativas ao painel. */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden', background: '#000',
        isolation: 'isolate',
      }}>
        <img
          src="/venice-v-glass.png"
          alt="Venice"
          style={{
            position: 'absolute', top: '-20%', left: '-6.2%',
            width: '140.8%', height: '151.1%', objectFit: 'fill',
            mixBlendMode: 'hard-light',
            pointerEvents: 'none', userSelect: 'none',
          }}
        />
      </div>
    </div>
  );
};
