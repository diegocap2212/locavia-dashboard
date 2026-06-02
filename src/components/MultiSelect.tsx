import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  allLabel: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange, allLabel }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (val: string) => {
    if (val === allLabel) {
      onChange([allLabel]);
      return;
    }
    let next = selected.includes(allLabel) ? [] : [...selected];
    if (next.includes(val)) next = next.filter(v => v !== val);
    else next.push(val);
    if (next.length === 0) next = [allLabel];
    onChange(next);
  };

  return (
    <div style={{ position: 'relative', minWidth: '220px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="filter-dropdown"
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', fontWeight: 600 }}>{label}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', fontSize: '0.9rem', fontWeight: 500 }}>
            {selected.includes(allLabel) ? `Todas (${options.length})` :
             (selected.length === 1 ? selected[0] : `${selected.length} selecionados`)}
          </span>
        </div>
        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-muted)' }} />
      </button>

      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="premium-card" style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50,
            maxHeight: '280px', overflowY: 'auto', padding: '0.5rem'
          }}>
            <div
              onClick={() => { toggle(allLabel); setIsOpen(false); }}
              style={{
                padding: '0.6rem 0.8rem', cursor: 'pointer', borderRadius: '8px',
                background: selected.includes(allLabel) ? 'var(--primary-light)' : 'transparent',
                display: 'flex', alignItems: 'center', marginBottom: '4px', fontSize: '0.9rem', fontWeight: selected.includes(allLabel) ? 600 : 500,
                color: selected.includes(allLabel) ? 'var(--primary)' : 'var(--text-main)'
              }}
            >
              <div style={{ width: '16px', height: '16px', border: selected.includes(allLabel) ? 'none' : '1px solid var(--border-color)', borderRadius: '4px', marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selected.includes(allLabel) ? 'var(--primary)' : 'transparent' }}>
                {selected.includes(allLabel) && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '2px' }} />}
              </div>
              {allLabel === 'TODOS' ? 'Todos os Times' : 'Todas as Releases'}
            </div>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0', opacity: 0.5 }} />
            {options.map(opt => (
              <div
                key={opt}
                onClick={() => toggle(opt)}
                style={{
                  padding: '0.6rem 0.8rem', cursor: 'pointer', borderRadius: '8px',
                  background: selected.includes(opt) ? 'var(--primary-light)' : 'transparent',
                  display: 'flex', alignItems: 'center', marginBottom: '2px', fontSize: '0.9rem', fontWeight: selected.includes(opt) ? 600 : 500,
                  color: selected.includes(opt) ? 'var(--primary)' : 'var(--text-main)'
                }}
              >
                <div style={{ width: '16px', height: '16px', border: selected.includes(opt) ? 'none' : '1px solid var(--border-color)', borderRadius: '4px', marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selected.includes(opt) ? 'var(--primary)' : 'transparent' }}>
                  {selected.includes(opt) && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '2px' }} />}
                </div>
                {opt}
              </div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};
