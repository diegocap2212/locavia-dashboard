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
      const today = new Date();
      const currentWeekIndex = data.weeks.findIndex(w => {
        const d = new Date(w.date);
        return today >= d && today < new Date(d.getTime() + 7 * 86400000);
      });
      
      if (currentWeekIndex !== -1) {
        // Scroll vertically to current week
        const targetScroll = Math.max(0, currentWeekIndex * 40 - 150); 
        scrollContainerRef.current.scrollTop = targetScroll;
      }
    }
  }, [data.weeks]);

  if (!data.weeks || data.weeks.length === 0) return null;

  return (
    <div className="premium-card" style={{ marginTop: '1.5rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '600px' }}>
      <div className="chart-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="icon-wrapper icon-blue" style={{ width: 32, height: 32 }}><Calendar size={16} /></div>
          <div>
            <h3 className="chart-title" style={{ fontSize: '1rem', margin: 0 }}>Matriz de Acompanhamento (CONE)</h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
              Comparativo Real (A Fazer) vs Meta Planejada por Semana
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--success)' }}>
              <div style={{ width: 10, height: 10, background: 'var(--success)', borderRadius: 2 }}></div> No Prazo
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--danger)' }}>
              <div style={{ width: 10, height: 10, background: 'var(--danger)', borderRadius: 2 }}></div> Atrasado
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--warning)' }}>
              <div style={{ width: 10, height: 10, background: 'var(--warning)', borderRadius: 2 }}></div> Semana Atual
           </div>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        style={{ 
          flex: 1, 
          overflow: 'auto', 
          position: 'relative',
          background: '#f1f5f9' 
        }}
      >
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ 
                position: 'sticky', top: 0, left: 0, zIndex: 30,
                background: '#f8fafc', padding: '12px 15px',
                borderRight: '2px solid var(--border-color)',
                borderBottom: '2px solid var(--border-color)',
                fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)',
                textAlign: 'left', minWidth: '100px'
              }}>
                DATA / SQUAD
              </th>
              {data.rows.map((row, i) => (
                <th key={i} style={{ 
                  position: 'sticky', top: 0, zIndex: 20,
                  background: '#f8fafc', padding: '10px',
                  borderRight: '1px solid var(--border-color)',
                  borderBottom: '2px solid var(--border-color)',
                  minWidth: '110px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                    {row.groupName}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {row.releaseName}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.weeks.map((week, wIndex) => {
              const today = new Date();
              const isCurrentWeek = today >= week.date && today < new Date(week.date.getTime() + 7 * 86400000);
              
              return (
                <tr key={wIndex}>
                  <td style={{ 
                    position: 'sticky', left: 0, zIndex: 10,
                    background: isCurrentWeek ? 'var(--warning-light)' : '#fff',
                    padding: '8px 15px',
                    borderRight: '2px solid var(--border-color)',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '0.7rem', fontWeight: 700,
                    color: isCurrentWeek ? 'var(--warning)' : 'var(--text-secondary)',
                    outline: isCurrentWeek ? '2px solid var(--warning)' : 'none',
                    outlineOffset: '-2px'
                  }}>
                    {week.label}
                  </td>
                  {data.rows.map((row, rIndex) => {
                    const cell = row.cells[wIndex];
                    const isDelayed = cell.isPast && cell.execucao !== null && cell.execucao > cell.meta;
                    const isOk = cell.isPast && cell.execucao !== null && cell.execucao <= cell.meta;
                    
                    let bg = '#fff';
                    let color = 'var(--text-muted)';
                    let weight = 500;

                    if (isDelayed) {
                      bg = 'var(--danger)';
                      color = '#fff';
                      weight = 700;
                    } else if (isOk) {
                      bg = 'var(--success)';
                      color = '#fff';
                      weight = 700;
                    } else if (!cell.isPast) {
                      bg = '#f8fafc';
                    }

                    return (
                      <td key={rIndex} style={{ 
                        padding: '0',
                        borderRight: '1px solid var(--border-color)',
                        borderBottom: '1px solid var(--border-color)',
                        background: bg,
                        height: '40px',
                        transition: 'all 0.1s'
                      }}
                      title={`Time: ${row.groupName}\nSemana: ${week.label}\nReal: ${cell.execucao ?? '-'}\nMeta: ${cell.meta}`}
                      >
                        <div style={{ 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          height: '100%', fontSize: '0.8rem', fontWeight: weight, color: color,
                          opacity: cell.isPast ? 1 : 0.4
                        }}>
                          {cell.execucao !== null ? cell.execucao : '-'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TemporalDeliveryMatrix;
