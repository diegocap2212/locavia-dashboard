import React from 'react';

export interface TabItem {
  id: string;
  label: string;
}

interface Props {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}

/**
 * Abas branded — compartilhadas pelas visões de métricas.
 * Aba ativa com realce Magenta (sublinhado + texto). Estado controlado pelo pai.
 */
const Tabs: React.FC<Props> = ({ tabs, active, onChange }) => (
  <div style={{
    display: 'flex', gap: '0.25rem', flexWrap: 'wrap',
    borderBottom: '1px solid var(--border-color)', marginBottom: '1.75rem',
  }}>
    {tabs.map(tab => {
      const isActive = tab.id === active;
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            position: 'relative',
            padding: '0.7rem 1.1rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            transition: 'color 0.15s',
          }}
        >
          {tab.label}
          <span style={{
            position: 'absolute', left: 8, right: 8, bottom: -1, height: 3, borderRadius: 3,
            background: isActive ? 'var(--primary)' : 'transparent',
            transition: 'background 0.15s',
          }} />
        </button>
      );
    })}
  </div>
);

export default Tabs;
