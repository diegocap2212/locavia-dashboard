import React from 'react';

export interface HeroStatus {
  label: string;
  /** cores no fundo escuro do hero */
  bg: string;
  text: string;
  border: string;
}

interface Props {
  /** breadcrumb mono em caixa alta, ex.: "RELEASE · LM" (texto ou nó, p/ logo) */
  eyebrow: React.ReactNode;
  title: string;
  /** linha de subtítulo abaixo do título (opcional) */
  subtitle?: React.ReactNode;
  /** elemento à esquerda do título (ex.: avatar) */
  leading?: React.ReactNode;
  /** badge de status à direita do título */
  status?: HeroStatus;
  /** conteúdo abaixo do cabeçalho (controles, seletor de release, etc.) */
  children?: React.ReactNode;
}

/**
 * Hero escuro branded — compartilhado por Home, /release/:id e /sm/:id.
 * navy + glow radial Magenta→Violet. Garante coerência visual entre as visões.
 */
const PageHero: React.FC<Props> = ({ eyebrow, title, subtitle, leading, status, children }) => (
  <div style={{ background: 'var(--hero-bg)', position: 'relative', padding: '2.25rem 2.5rem 1.75rem' }}>
    {/* glow radial (confinado ao próprio div via inset:0 — não precisa de overflow:hidden no pai,
        que cortaria os menus de dropdown abertos sobre o hero) */}
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'var(--hero-glow)',
    }} />

    <div style={{ maxWidth: 1500, margin: '0 auto', position: 'relative' }}>
      <p style={{ margin: '0 0 0.5rem', fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
        {eyebrow}
      </p>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: children ? '1.5rem' : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {leading}
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--hero-fg)', lineHeight: 1.15 }}>
              {title}
            </h1>
            {subtitle && (
              <div style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {status && (
          <span style={{
            padding: '6px 16px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
            background: status.bg, color: status.text, border: `1px solid ${status.border}`,
          }}>
            {status.label}
          </span>
        )}
      </div>

      {children}
    </div>
  </div>
);

/** Deriva o status branded a partir das datas de projeção (mesma regra da home). */
export function deriveStatus(remaining: number, entregaMelhor: Date | null, entregaPior: Date | null, now = new Date()): HeroStatus {
  const isDelivered = remaining === 0;
  const isLate = !isDelivered && !!entregaPior && entregaPior < now;
  const isAtRisk = !isDelivered && !isLate && !!entregaMelhor && entregaMelhor > new Date(now.getTime() + 60 * 86400000);

  if (isDelivered) return { label: 'Entregue', bg: 'rgba(43,232,107,0.18)', text: '#2BE86B', border: 'rgba(43,232,107,0.35)' };
  if (isLate) return { label: 'Atrasado', bg: 'rgba(229,72,77,0.18)', text: '#FF9B9E', border: 'rgba(229,72,77,0.35)' };
  if (isAtRisk) return { label: 'Em Risco', bg: 'rgba(232,163,23,0.18)', text: '#F0C66B', border: 'rgba(232,163,23,0.35)' };
  return { label: 'No Prazo', bg: 'rgba(43,232,107,0.18)', text: '#2BE86B', border: 'rgba(43,232,107,0.35)' };
}

export default PageHero;
