import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDisplay = () => {
    if (!startDate && !endDate) return "Todo o período";
    const startStr = startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Início';
    const endStr = endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Fim';
    return `${startDate ? startStr : ''} - ${endDate ? endStr : ''}`.replace(/^- |- $/g, '').trim() || "Todo o período";
  };

  return (
    <div style={{ position: 'relative', minWidth: '220px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="filter-dropdown"
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', fontWeight: 600 }}>Período</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', fontSize: '0.9rem', fontWeight: 500 }}>
            {formatDisplay()}
          </span>
        </div>
        <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
      </button>

      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="premium-card" style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50,
            padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                style={{
                  padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)',
                  background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.9rem',
                  outline: 'none', fontFamily: 'inherit'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                style={{
                  padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)',
                  background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.9rem',
                  outline: 'none', fontFamily: 'inherit'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                onClick={() => { onStartDateChange(''); onEndDateChange(''); }}
                style={{
                  padding: '6px 12px', fontSize: '0.8rem', background: 'transparent',
                  border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600
                }}
              >
                Limpar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};
