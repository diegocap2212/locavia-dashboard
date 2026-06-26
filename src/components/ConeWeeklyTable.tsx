import React from 'react';
import type { WeeklyConeMetrics } from '../hooks/useSMDashboardData';

interface Props {
  data: WeeklyConeMetrics[];
}

const th: React.CSSProperties = { padding: '12px', textAlign: 'center', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' };
const td: React.CSSProperties = { padding: '8px 12px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' };

export const ConeWeeklyTable: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
            <th style={{ ...th, textAlign: 'left' }}>Semana</th>
            <th style={th} title="Escopo Acumulado">Features Totais</th>
            <th style={th} title="Carregado da semana anterior">Transbordo</th>
            <th style={{ ...th, color: 'var(--accent-strong)' }} title="Com Data de Compromisso">Planejados</th>
            <th style={{ ...th, color: 'var(--warn-fg)' }} title="Sem Data de Compromisso">Não Planejados</th>
            <th style={{ ...th, color: 'var(--err-fg)' }} title="Bugs e Urgências">Fura-fila / Bugs</th>
            <th style={{ ...th, color: 'var(--ok-fg)' }} title="Entregas DONE">Realizado</th>
            <th style={th}>Desc.</th>
            <th style={th}>A Fazer</th>
            <th style={th} title="Lead Time Médio">LT Méd</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
            >
              <td style={{ ...td, textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>{row.weekLabel}</td>
              <td style={{ ...td, color: 'var(--text-tertiary)' }}>{row.featuresTotal}</td>
              <td style={{ ...td, color: 'var(--text-tertiary)' }}>{row.transbordo}</td>
              <td style={{ ...td, fontWeight: 600, color: 'var(--accent-strong)' }}>{row.planejados > 0 ? row.planejados : '-'}</td>
              <td style={{ ...td, fontWeight: 600, color: 'var(--warn-fg)' }}>{row.naoPlanejados > 0 ? row.naoPlanejados : '-'}</td>
              <td style={{ ...td, fontWeight: 600, color: 'var(--err-fg)' }}>{row.furaFila > 0 ? row.furaFila : '-'}</td>
              <td style={{ ...td, fontWeight: 700, color: 'var(--ok-fg)' }}>{row.realizado > 0 ? row.realizado : '-'}</td>
              <td style={{ ...td, color: 'var(--text-tertiary)' }}>{row.descartados > 0 ? row.descartados : '-'}</td>
              <td style={{ ...td, fontWeight: 600, color: 'var(--text-primary)' }}>{row.aFazer}</td>
              <td style={td}>{row.leadTimeMed !== null ? `${row.leadTimeMed}d` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
