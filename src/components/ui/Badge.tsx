import React from 'react';

export type BadgeTone = 'ok' | 'warn' | 'err' | 'neutral' | 'accent';

const TONES: Record<BadgeTone, React.CSSProperties> = {
  ok: { background: 'var(--ok-bg)', color: 'var(--ok-fg)' },
  warn: { background: 'var(--warn-bg)', color: 'var(--warn-fg)' },
  err: { background: 'var(--err-bg)', color: 'var(--err-fg)' },
  neutral: { background: 'var(--surface-3)', color: 'var(--text-tertiary)' },
  accent: { background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)' },
};

export interface BadgeProps {
  tone?: BadgeTone;
  /** mostra o ponto colorido à esquerda (pill de status) */
  dot?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/** Pill de status do Design System Venice. */
export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', dot = false, children, style }) => (
  <span
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      font: "700 11px 'Inter', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase',
      padding: '5px 11px', borderRadius: 999, whiteSpace: 'nowrap',
      ...TONES[tone], ...style,
    }}
  >
    {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
    {children}
  </span>
);

export default Badge;
