import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface MatrixProps {
  data: {
    deadline: Date;
    itemsPerWeek: string;
    statusGroups: { status: string; count: number }[];
  };
  totalItems: number;
}

const DeliveryMatrix: React.FC<MatrixProps> = ({ data, totalItems }) => {
  const delivered = data.statusGroups.find(g => g.status === 'DONE')?.count || 0;
  const inProgress = data.statusGroups.find(g => g.status === 'IN_PROGRESS')?.count || 0;
  const todo = data.statusGroups.find(g => g.status === 'TODO')?.count || 0;

  // Calculate weeks from a reference start (e.g. Dec 2024 or Start of the release)
  // For simplicity and "wow" factor, let's visualize the "Backlog health"
  
  // Logic: 
  // 1. Total items = total squares
  // 2. We compare current progress vs expected progress
  const now = new Date();
  const start = new Date(2025, 0, 1); // Mock start of year
  const end = data.deadline;
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const expectedProgressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  const actualProgressPercent = (delivered / totalItems) * 100;

  const isDelayed = actualProgressPercent < expectedProgressPercent;

  return (
    <div className="premium-card chart-section" style={{ marginTop: '1.5rem' }}>
      <div className="chart-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="icon-wrapper icon-blue"><Calendar size={18} /></div>
          <div>
            <h3 className="chart-title" style={{ margin: 0 }}>Matriz de Entregas vs Capacidade</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Meta: {data.itemsPerWeek} itens/semana até {data.deadline.toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div className={`status-badge ${isDelayed ? 'status-delayed' : 'status-ahead'}`}>
              {isDelayed ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
              {isDelayed ? 'Abaixo da Meta' : 'Dentro do Plano'}
           </div>
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
           <div style={{ display: 'flex', gap: '2rem' }}>
              <div>
                 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Progresso Real</span>
                 <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{actualProgressPercent.toFixed(1)}%</div>
              </div>
              <div>
                 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Consumo do Prazo</span>
                 <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{expectedProgressPercent.toFixed(1)}%</div>
              </div>
           </div>
           <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS DA RELEASE</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isDelayed ? 'var(--danger)' : 'var(--success)' }}>
                 {isDelayed ? 'Ação Necessária' : 'Saudável'}
              </div>
           </div>
        </div>

        {/* The Matrix Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(14px, 1fr))', 
          gap: '4px',
          padding: '12px',
          background: 'rgba(0,0,0,0.02)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          {Array.from({ length: totalItems }).map((_, i) => {
            let color = 'var(--border-color)';
            let opacity = 0.3;
            
            if (i < delivered) {
              color = 'var(--success)';
              opacity = 1;
            } else if (i < (expectedProgressPercent / 100) * totalItems) {
              color = 'var(--danger)'; // Should have been done but isn't
              opacity = 0.8;
            } else if (i < (expectedProgressPercent / 100) * totalItems + inProgress) {
              color = 'var(--warning)';
              opacity = 0.6;
            }

            return (
              <motion.div 
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.001 }}
                style={{ 
                  aspectRatio: '1/1', 
                  backgroundColor: color, 
                  borderRadius: '3px',
                  opacity
                }}
              />
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '12px', height: '12px', background: 'var(--success)', borderRadius: '2px' }}></div> Entregue
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '12px', height: '12px', background: 'var(--danger)', borderRadius: '2px' }}></div> Atraso vs Cronograma
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '12px', height: '12px', background: 'var(--warning)', borderRadius: '2px' }}></div> Em Desenvolvimento
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '12px', height: '12px', background: 'var(--border-color)', borderRadius: '2px', opacity: 0.3 }}></div> Backlog Futuro
           </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMatrix;
