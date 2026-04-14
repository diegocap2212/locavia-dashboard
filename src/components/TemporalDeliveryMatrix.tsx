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
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              <div style={{ width: 12, height: 12, border: '1px solid var(--border-color)', borderRadius: 3 }}></div> <span style={{ opacity: 0.8 }}>Real / Meta</span>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
              <div style={{ width: 12, height: 12, background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 3 }}></div> Semana Atual
           </div>
        </div>
      </div>

      <div style={{ display: 'flex', overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        {/* Fixed Left Column: Teams */}
        <div style={{ width: '260px', minWidth: '260px', background: '#f8fafc', borderRight: '2px solid var(--border-color)', zIndex: 10 }}>
          <div style={{ height: '50px', borderBottom: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            SQUAD / STATUS
          </div>
          {data.rows.map((row, i) => {
            const lastCell = row.cells.filter(c => c.isPast && c.execucao !== null).pop();
            const isDelayed = (lastCell && lastCell.execucao !== null) ? lastCell.execucao > lastCell.meta : false;
            const completion = row.totalItems > 0 ? Math.round(((row.totalItems - (lastCell?.execucao || 0)) / row.totalItems) * 100) : 0;

            return (
              <div key={i} style={{ height: '55px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 0.75rem', gap: '0.75rem', background: i % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.groupName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>{row.releaseName}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isDelayed ? 'var(--danger)' : 'var(--success)' }}>
                      • {completion}%
                    </span>
                  </div>
                </div>
                <div style={{ 
                  padding: '3px 8px', borderRadius: '12px', fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase',
                  background: isDelayed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  color: isDelayed ? 'var(--danger)' : 'var(--success)',
                  border: `1px solid ${isDelayed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                }}>
                  {isDelayed ? 'Risco' : 'Ok'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable Right Area: Weeks */}
        <div ref={scrollContainerRef} style={{ flex: 1, overflowX: 'auto', display: 'flex', scrollBehavior: 'smooth' }}>
          {data.weeks.map((week, wIndex) => {
            const today = new Date();
            const isCurrentWeek = today >= week.date && today < new Date(week.date.getTime() + 7 * 86400000);
            
            // Detect if this is the deadline week for any major release
            const isDeadlineWeek = data.rows.some(r => {
                const d = new Date(r.deadline);
                return d >= week.date && d < new Date(week.date.getTime() + 7 * 86400000);
            });

            return (
              <div key={wIndex} style={{ 
                minWidth: '55px', display: 'flex', flexDirection: 'column', 
                position: 'relative',
                background: isDeadlineWeek ? 'rgba(245, 158, 11, 0.03)' : 'transparent'
              }}>
                {/* Header Cell */}
                <div style={{ 
                  height: '50px', 
                  borderBottom: '2px solid var(--border-color)', 
                  borderRight: '1px solid var(--border-color)',
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: isDeadlineWeek ? '#d97706' : (isCurrentWeek ? 'var(--primary)' : (week.date <= today ? 'var(--text-main)' : 'var(--text-muted)')),
                  background: isDeadlineWeek ? 'rgba(245, 158, 11, 0.1)' : (isCurrentWeek ? 'var(--primary-light)' : (week.date <= today ? '#fff' : '#f9fafb')),
                  borderTop: isDeadlineWeek ? '4px solid #f59e0b' : (isCurrentWeek ? '4px solid var(--primary)' : 'none'),
                  gap: '2px'
                }}>
                  <span>{week.label}</span>
                  {isDeadlineWeek && <span style={{ fontSize: '0.5rem', opacity: 0.8 }}>META</span>}
                  {isCurrentWeek && !isDeadlineWeek && <span style={{ fontSize: '0.5rem', opacity: 0.8 }}>HOJE</span>}
                </div>

                {/* Data Cells */}
                {data.rows.map((row, rIndex) => {
                  const cell = row.cells[wIndex];
                  const isTeamDeadline = row.deadline >= week.date && row.deadline < new Date(week.date.getTime() + 7 * 86400000);
                  
                  let bgColor = '#fff';
                  let textColor = 'var(--text-main)';
                  let statusText = '';
                  let indicatorSize = 0;

                  if (cell.isPast && cell.execucao !== null) {
                    if (cell.execucao <= cell.meta || cell.execucao === 0) {
                      bgColor = 'rgba(34, 197, 94, 0.05)';
                      textColor = '#16a34a';
                      statusText = 'No Prazo';
                    } else {
                      bgColor = 'rgba(239, 68, 68, 0.05)';
                      textColor = '#dc2626';
                      statusText = 'Atrasado';
                      indicatorSize = Math.min(10, (cell.execucao - cell.meta) * 2);
                    }
                  } else if (!cell.isPast) {
                    bgColor = '#fcfcfc';
                    textColor = '#94a3b8';
                  }

                  if (isCurrentWeek) {
                    bgColor = cell.isPast && cell.execucao !== null ? bgColor : 'rgba(79, 70, 229, 0.03)';
                  }

                  return (
                    <div key={rIndex} 
                      style={{ 
                        height: '55px', 
                        borderBottom: '1px solid var(--border-color)',
                        borderRight: isTeamDeadline ? '3px solid #f59e0b' : `1px solid var(--border-color)`,
                        background: bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxShadow: isTeamDeadline ? 'inset -4px 0 8px rgba(245, 158, 11, 0.1)' : 'none'
                      }}
                      title={cell.execucao !== null ? `${statusText}\nReal (A Fazer): ${cell.execucao}\nMeta Planejada: ${cell.meta}` : `Meta: ${cell.meta}`}
                    >
                      {isTeamDeadline && (
                        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 3, background: '#f59e0b' }} />
                      )}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
                        <span style={{ fontSize: '0.9rem', color: textColor, fontWeight: 700 }}>
                          {cell.execucao !== null ? cell.execucao : '-'}
                        </span>
                        {cell.meta !== undefined && (
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, opacity: 0.7 }}>
                            {cell.meta}
                          </span>
                        )}
                      </div>
                      
                      {indicatorSize > 0 && (
                        <div style={{ 
                          position: 'absolute', top: 4, right: 4, width: 6, height: 6, 
                          borderRadius: '50%', background: 'var(--danger)', 
                          boxShadow: '0 0 4px var(--danger)' 
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TemporalDeliveryMatrix;
