import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Rocket, Users, Car, CalendarDays, FolderKanban, LogOut } from 'lucide-react';
import { SM_CONFIGS } from '../config/sm-config';
import { PROJECTS } from '../config/projects';
import { deriveTeams } from '../config/teams';
import { teamLabel } from '../config/teamLabels';
import { fetchData } from '../services/dataService';
import { logout } from '../services/authService';
import VeniceBadge from './VeniceBadge';
import ThemeToggle from './ui/ThemeToggle';
import Button from './ui/Button';

/* ── Botão da sidebar (icon rail) — chrome claro do DS ── */
const railBtn = (active: boolean): React.CSSProperties => ({
  width: 44, height: 44, borderRadius: 12,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: 'none', cursor: 'pointer',
  color: active ? 'var(--accent-strong)' : 'var(--text-secondary)',
  background: active ? 'var(--accent-soft)' : 'transparent',
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
        onMouseEnter={e => { if (!active && !open) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-3)'; }}
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
            background: 'var(--surface)',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)',
            padding: 6,
          }}
        >
          <p style={{ margin: '4px 8px 6px', fontFamily: 'monospace', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
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
                color: item.active ? 'var(--accent-strong)' : 'var(--text-secondary)',
                background: item.active ? 'var(--accent-soft)' : 'transparent',
                border: '1px solid transparent',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (!item.active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { if (!item.active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: item.active ? 'var(--accent)' : 'var(--border-strong)' }} />
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
  const isReleaseDates = location.pathname.startsWith('/datas-releases');
  const activeProjectId = location.pathname.startsWith('/projetos')
    ? (decodeURIComponent(location.pathname.split('/projetos/')[1] || '') || PROJECTS[0]?.id || null)
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
    <div style={{ minHeight: '100vh', display: 'flex', background: 'transparent', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Sidebar de ícones (icon rail) ── */}
      <aside style={{
        width: 68,
        background: 'var(--shell-bg)',
        borderRight: '1px solid var(--shell-border)',
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
        <RailItem icon={CalendarDays} label="Datas das Releases" active={isReleaseDates} onClick={() => navigate('/datas-releases')} />
        <RailItem
          icon={FolderKanban}
          label="Projetos"
          active={!!activeProjectId}
          items={PROJECTS.map(p => ({
            id: p.id,
            label: p.name,
            active: activeProjectId === p.id,
            onSelect: () => navigate(`/projetos/${p.id}`),
          }))}
        />
      </aside>

      {/* ── Coluna principal ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar slim — header translúcido do DS */}
        <header className="vds-topbar" style={{
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

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Alternar tema */}
            <ThemeToggle />
            {/* Sair */}
            <Button variant="secondary" size="sm" onClick={handleLogout} title="Sair" icon={<LogOut size={15} />}>
              Sair
            </Button>
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
