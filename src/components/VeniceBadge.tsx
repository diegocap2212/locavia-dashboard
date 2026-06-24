import React from 'react';

export interface VeniceBadgeProps {
  /** altura do logo em px */
  height?: number;
  /** moldura sutil (chip) verde ao redor do logo */
  framed?: boolean;
  style?: React.CSSProperties;
}

/**
 * Badge de marca Venice — DS Blite/Venice.
 * Usa o logo OFICIAL `venice-by-blite.svg` (renderizado em branco).
 * Identidade da marca para o topo de apps. Requer o asset em /public.
 */
export const VeniceBadge: React.FC<VeniceBadgeProps> = ({ height = 24, framed = false, style }) => (
  <span
    style={{
      display: 'inline-flex', alignItems: 'center',
      ...(framed
        ? {
            padding: '0.32rem 0.7rem', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(43,187,146,0.30)',
          }
        : {}),
      ...style,
    }}
  >
    <img
      src="/venice-by-blite.svg"
      alt="Venice by blite"
      style={{ height, width: 'auto', display: 'block', filter: 'brightness(0) invert(1)' }}
    />
  </span>
);

export default VeniceBadge;
