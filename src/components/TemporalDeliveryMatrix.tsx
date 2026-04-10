import React, { useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface Cell {
  weekKey: string;
  meta: number;
  execucao: number | null;
  isPast: boolean;
}

interface MatrixProps {
  data: {
    weeks: { key: string; label: string; date: Date }[];
    rows: {
      groupName: string;
      releaseName: string;
      totalItems: number;
      cells: Cell[];
      deadline: Date;
    }[];
  };
}

const TemporalDeliveryMatrix: React.FC<MatrixProps> = ({ data }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current week
  useEffect(() => {
    if (scrollContainerRef.current) {
      const pastCells = data.weeks.filter(w => w.date <= new Date()).length;
      // scroll to roughly where the past ends
      const targetScroll = Math.max(0, pastCells * 45 - 200); 
      scrollContainerRef.current.scrollLeft = targetScroll;
    }
  }, [data.weeks]);

  if (!data.weeks || data.weeks.length === 0) return null;

  return (
    <div className="premium-card chart-section" style={{ marginTop: '1.5rem' }}>
      <div className="chart-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="icon-wrapper icon-blue"><Calendar size={18} /></div>
          <div>
            <h3 className="chart-title" style={{ margin: 0 }}>Matriz de Acompanhamento (CONE)</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Comparativo Real (A Fazer) vs Meta Planejada por Semana
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)' }}>
              <div style={{ width: 12, height: 12, background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22c55e', borderRadius: 3 }}></div> No Prazo
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger)' }}>
              <div style={{ width: 12, height: 12, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: 3 }}></div> Atrasado
           </div>
        </div>
      </div>

      <div style={{ display: 'flex', overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
        
        {/* Fixed Left Column: Teams */}
        <div style={{ width: '220px', minWidth: '220px', background: '#fafafa', borderRight: '1px solid var(--border-color)', zIndex: 2 }}>
          <div style={{ height: '45px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            TIME / PROJETO
          </div>
          {data.rows.map((row, i) => (
            <div key={i} style={{ height: '45px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 1rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {row.groupName}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {row.releaseName} ({row.totalItems} itens)
              </span>
            </div>
          ))}
        </div>

        {/* Scrollable Right Area: Weeks */}
        <div ref={scrollContainerRef} style={{ flex: 1, overflowX: 'auto', display: 'flex' }}>
          {data.weeks.map((week, wIndex) => (
            <div key={wIndex} style={{ minWidth: '45px', display: 'flex', flexDirection: 'column' }}>
              {/* Header Cell */}
              <div style={{ 
                height: '45px', 
                borderBottom: '1px solid var(--border-color)', 
                borderRight: '1px solid var(--border-color)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: week.date <= new Date() ? 'var(--text-main)' : 'var(--text-muted)',
                background: week.date <= new Date() ? '#fff' : '#f9fafb'
              }}>
                {week.label}
              </div>

              {/* Data Cells */}
              {data.rows.map((row, rIndex) => {
                const cell = row.cells[wIndex];
                
                let bgColor = '#fff';
                let borderColor = 'var(--border-color)';
                let textColor = 'var(--text-main)';
                let fontWeight = 500;

                if (cell.isPast && cell.execucao !== null) {
                  fontWeight = 700;
                  if (cell.execucao <= cell.meta || cell.execucao === 0) {
                    bgColor = 'rgba(34, 197, 94, 0.1)'; // green
                    borderColor = '#22c55e';
                    textColor = '#16a34a';
                  } else {
                    bgColor = 'rgba(239, 68, 68, 0.1)'; // red
                    borderColor = '#ef4444';
                    textColor = '#dc2626';
                  }
                } else if (!cell.isPast) {
                  bgColor = '#f9fafb';
                  textColor = '#d1d5db';
                }

                return (
                  <div key={rIndex} 
                    style={{ 
                      height: '45px', 
                      borderBottom: '1px solid var(--border-color)',
                      borderRight: `1px solid ${borderColor}`,
                      borderTop: cell.isPast && cell.execucao !== null ? `1px solid ${borderColor}` : 'none',
                      borderLeft: cell.isPast && cell.execucao !== null ? `1px solid ${borderColor}` : 'none',
                      background: bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                    title={`Real: ${cell.execucao !== null ? cell.execucao : '-'} | Meta: ${cell.meta}`}
                  >
                    <span style={{ fontSize: '0.8rem', color: textColor, fontWeight }}>
                      {cell.execucao !== null ? cell.execucao : '-'}
                    </span>
                    {/* Small Meta indicator */}
                    {cell.isPast && cell.execucao !== null && cell.execucao > cell.meta && (
                      <span style={{ position: 'absolute', top: 2, right: 3, fontSize: '0.5rem', color: '#ef4444', fontWeight: 800 }}>
                        {cell.meta}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemporalDeliveryMatrix;
