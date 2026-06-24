import React from 'react';

export interface VeniceBadgeProps {
  /** tamanho do lockup */
  size?: 'sm' | 'md';
  /** exibe a linha 'by blite' abaixo do wordmark */
  showSuffix?: boolean;
  style?: React.CSSProperties;
}

const SPECS = {
  sm: { mark: 28, radius: 8, markFont: '0.95rem', word: '0.92rem', suffix: '0.55rem', gap: 9 },
  md: { mark: 36, radius: 10, markFont: '1.15rem', word: '1.08rem', suffix: '0.62rem', gap: 11 },
} as const;

/**
 * Badge de marca Venice (lockup) — DS Blite/Venice.
 * Mark "V" em gradiente verde→violet + wordmark "Venice / by blite".
 * Identidade compacta para o topo de apps. Verde = marca Venice.
 */
export const VeniceBadge: React.FC<VeniceBadgeProps> = ({ size = 'md', showSuffix = true, style }) => {
  const s = SPECS[size];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: s.gap, fontFamily: 'Inter, system-ui, sans-serif', ...style }}>
      <span
        aria-hidden
        style={{
          width: s.mark, height: s.mark, borderRadius: s.radius, flexShrink: 0,
          background: 'linear-gradient(135deg, #2BBB92, #8B0CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: s.markFont, letterSpacing: '-0.03em',
          boxShadow: '0 2px 10px 0 rgba(43,187,146,0.35)',
        }}
      >
        V
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontSize: s.word, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
          Venice
        </span>
        {showSuffix && (
          <span style={{ fontSize: s.suffix, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', marginTop: 3 }}>
            by blite
          </span>
        )}
      </span>
    </span>
  );
};

export default VeniceBadge;
