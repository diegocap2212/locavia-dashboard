import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Rocket, Users, Car, LogOut } from 'lucide-react';
import { SM_CONFIGS } from '../config/sm-config';
import { deriveTeams } from '../config/teams';
import { teamLabel } from '../config/teamLabels';
import { fetchData } from '../services/dataService';
import { logout } from '../services/authService';
import VeniceBadge from './VeniceBadge';
import ThemeToggle from './ui/ThemeToggle';

/* ── Botão da sidebar (icon rail) ── */
const railBtn = (active: boolean): React.CSSProperties => ({
  width: 44, height: 44, borderRadius: 12,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: 'none', cursor: 'pointer',
  color: active ? '#fff' : 'rgba(255,255,255,0.55)',
  background: active ? 'rgba(43,232,107,0.16)' : 'transparent',
  boxShadow: active ? 'inset 0 0 0 1px rgba(43,232,107,0.45)' : 'none',
  transition: 'all 0.15s',
});

interface RailItemProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
  items?: { id: string; label: string; active: boolean; onSelect: () => void }[];
}

/** Item da sidebar: ícone direto (onClick) ou ícone que abre um flyout à direita (items). */
const RailItem: React.FC<RailItemProps> = ({ icon: Icon, label, active, onClick, items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        title={label}
        aria-label={label}
        onClick={items ? () => setOpen(o => !o) : onClick}
        style={railBtn(!!active || open)}
        onMouseEnter={e => { if (!active && !open) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { if (!active && !open) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        <Icon size={20} />
      </button>

      {items && open && (
        <div
          role="menu"
          style={{
            position: 'absolute', left: 'calc(100% + 10px)', top: 0, zIndex: 300,
            minWidth: 230, maxHeight: 420, overflowY: 'auto',
            background: 'linear-gradient(180deg, #11281A 0%, #0A1F12 100%)',
            borderRadius: 12,
            border: '1px solid rgba(43,232,107,0.22)',
            boxShadow: '0 18px 44px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), 0 8px 30px -10px rgba(43,232,107,0.35)',
            padding: 6,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <p style={{ margin: '4px 8px 6px', fontFamily: 'monospace', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
            {label}
          </p>
          {items.map(item => (
            <button
              key={item.id}
              role="menuitem"
              onClick={() => { item.onSelect(); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: item.active ? 700 : 500,
                color: item.active ? '#fff' : 'rgba(255,255,255,0.72)',
                background: item.active
                  ? 'linear-gradient(92deg, rgba(43,232,107,0.30), rgba(43,232,107,0.12))'
                  : 'transparent',
                border: item.active ? '1px solid rgba(43,232,107,0.45)' : '1px solid transparent',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (!item.active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { if (!item.active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: item.active ? '#2BE86B' : 'rgba(255,255,255,0.25)' }} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/' || location.pathname === '/cone-bf-cem' || location.pathname.startsWith('/release/');
  const activeSmId = location.pathname.startsWith('/sm/')
    ? location.pathname.split('/sm/')[1]
    : null;
  const activeTeamId = location.pathname.startsWith('/time/')
    ? decodeURIComponent(location.pathname.split('/time/')[1])
    : null;

  // Lista de times derivada de /api/data (memoizado em dataService) — não embute o data.json.
  const [allTeams, setAllTeams] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    fetchData()
      .then(items => { if (alive) setAllTeams(deriveTeams(items)); })
      .catch(() => { /* sem sessão / erro: dropdown de Times fica vazio */ });
    return () => { alive = false; };
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-color)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Sidebar de ícones (icon rail) ── */}
      <aside style={{
        width: 68,
        background: 'var(--navy)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '0.5rem',
        padding: '0.9rem 0',
        position: 'sticky', top: 0, height: '100vh',
        flexShrink: 0,
        zIndex: 200,
      }}>
        <RailItem icon={Rocket} label="Releases" active={isHome} onClick={() => navigate('/')} />
        <RailItem
          icon={Users}
          label="Agilistas"
          active={!!activeSmId}
          items={SM_CONFIGS.map(sm => ({
            id: sm.id,
            label: sm.name,
            active: activeSmId === sm.id,
            onSelect: () => navigate(`/sm/${sm.id}`),
          }))}
        />
        <RailItem
          icon={Car}
          label="Times"
          active={!!activeTeamId}
          items={allTeams.map(team => ({
            id: team,
            label: teamLabel(team),
            active: activeTeamId === team,
            onSelect: () => navigate(`/time/${encodeURIComponent(team)}`),
          }))}
        />
      </aside>

      {/* ── Coluna principal ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar slim */}
        <header style={{
          background: 'var(--navy)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', gap: '1rem',
          height: 56, padding: '0 1.5rem',
        }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
            aria-label="Início · Venice"
          >
            <VeniceBadge height={24} />
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Alternar tema */}
            <ThemeToggle onShell />
            {/* Sair */}
            <button
              onClick={handleLogout}
              title="Sair"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: 'rgba(255,255,255,0.8)', borderRadius: 9,
                padding: '0.4rem 0.7rem', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
