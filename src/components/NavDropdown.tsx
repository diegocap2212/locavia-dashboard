import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface NavDropdownItem {
  id: string;
  label: string;
  onSelect: () => void;
  active?: boolean;
}

interface Props {
  label: string;
  items: NavDropdownItem[];
  /** destaca o trigger quando a rota pertence a este grupo */
  active?: boolean;
  /** 'nav' = link da navbar · 'control' = pill de filtro (mostra o valor atual) */
  variant?: 'nav' | 'control';
  /** largura mínima do menu */
  menuMinWidth?: number;
}

/**
 * Dropdown da navbar escura — trigger estilo nav-link + menu popover BRANCO (texto escuro).
 * Menu não-nativo: legível (sem o bug do <select> branco-sobre-branco), scrollável, fecha
 * em clique-fora e ao escolher.
 */
const NavDropdown: React.FC<Props> = ({ label, items, active, variant = 'nav', menuMinWidth = 210 }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const triggerStyle: React.CSSProperties = variant === 'control'
    ? {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        color: 'var(--text-primary)', background: 'var(--surface)',
        border: `1px solid ${open ? 'var(--accent)' : 'var(--border-default)'}`,
        boxShadow: open ? '0 0 0 3px var(--ring)' : 'none',
        cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
        padding: '7px 12px', borderRadius: 8, transition: 'all 0.15s', whiteSpace: 'nowrap',
      }
    : {
        display: 'inline-flex', alignItems: 'center', gap: 5,
        color: active || open ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: active ? 'var(--surface-2)' : 'transparent',
        border: 'none', cursor: 'pointer',
        fontSize: '0.82rem', fontWeight: 600, padding: '0.4rem 0.85rem',
        borderRadius: 8, transition: 'all 0.15s',
      };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={triggerStyle}>
        {label}
        <ChevronDown size={14} style={{ opacity: 0.8, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 200,
            minWidth: menuMinWidth, maxHeight: 380, overflowY: 'auto',
            background: 'var(--surface)',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)',
            padding: 6,
          }}
        >
          {items.map(item => (
            <button
              key={item.id}
              role="menuitem"
              onClick={() => { item.onSelect(); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: item.active ? 700 : 500,
                color: item.active ? 'var(--accent-strong)' : 'var(--text-secondary)',
                background: item.active ? 'var(--accent-soft)' : 'transparent',
                border: '1px solid transparent',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (!item.active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { if (!item.active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: item.active ? 'var(--accent)' : 'var(--border-strong)',
              }} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavDropdown;
