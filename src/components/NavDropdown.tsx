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
}

/**
 * Dropdown da navbar escura — trigger estilo nav-link + menu popover BRANCO (texto escuro).
 * Menu não-nativo: legível (sem o bug do <select> branco-sobre-branco), scrollável, fecha
 * em clique-fora e ao escolher.
 */
const NavDropdown: React.FC<Props> = ({ label, items, active }) => {
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

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          color: active || open ? '#fff' : 'rgba(255,255,255,0.6)',
          background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
          border: 'none', cursor: 'pointer',
          fontSize: '0.82rem', fontWeight: 600, padding: '0.4rem 0.85rem',
          borderRadius: 8, transition: 'all 0.15s',
        }}
      >
        {label}
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
            minWidth: 200, maxHeight: 360, overflowY: 'auto',
            background: '#fff', borderRadius: 10,
            border: '1px solid var(--border-color)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            padding: 6,
          }}
        >
          {items.map(item => (
            <button
              key={item.id}
              role="menuitem"
              onClick={() => { item.onSelect(); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left',
                padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: item.active ? 700 : 500,
                color: item.active ? 'var(--primary)' : 'var(--text-main)',
                background: item.active ? 'var(--primary-light)' : 'transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (!item.active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-color)'; }}
              onMouseLeave={e => { if (!item.active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavDropdown;
