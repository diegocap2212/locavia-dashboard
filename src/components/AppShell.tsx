import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Rocket, Users, Car, LogOut } from 'lucide-react';
import { SM_CONFIGS } from '../config/sm-config';
import { deriveTeams } from '../config/teams';
import { teamLabel } from '../config/teamLabels';
import { fetchData } from '../services/dataService';
import { logout } from '../services/authService';

/* Inline Venice by blite SVG — sempre branco via currentColor */
const VeniceLogo = () => (
  <svg
    viewBox="0 0 999.11 284.44"
    aria-label="Venice by blite"
    style={{ height: 26, width: 'auto', display: 'block', color: '#fff' }}
  >
    <style>{`.vcls { fill: currentColor; }`}</style>
    <path className="vcls" d="M757.13,214.65l11.7,17.18h4.79l2.54-17.18h-19.02Z"/>
    <path className="vcls" d="M829.99,250.41h-4.23l-2.54,17.18h6.76v-17.18Z"/>
    <path className="vcls" d="M922.85,218.28h-13.11v49.31h13.11v-49.31Z"/>
    <path className="vcls" d="M966.96,214.51c-11.98,0-22.13,7.13-26.07,17.32v-17.32h7.05v-12.57h-7.05v-7.12h-13.11v72.78h13.11v-16.48c3.95,9.64,13.81,16.07,25.37,16.48h15.08c3.1-4.61,4.23-6.29,8.31-12.29h-23.39c-5.21,0-9.44-1.4-11.7-5.59h39.18c.71-1.96.98-4.05,1.27-6.29v-1.95c0-14.95-12.54-26.96-28.04-26.96ZM952.02,239.37c1.13-6.99,7.33-12.43,14.94-12.43s13.81,5.45,14.94,12.43h-29.88Z"/>
    <path className="vcls" d="M922.85,214.65v-19.7h-13.11v19.7h13.11Z"/>
    <path className="vcls" d="M891.99,194.81v36.46c-4.09-9.78-13.95-16.62-25.51-16.62h-11.56v-19.84h-12.82v72.78h24.38c11.56,0,21.42-6.85,25.51-16.62v16.62h12.82v-72.78h-12.82ZM866.49,255.02h-11.41v-27.8h11.41c8.03,0,14.52,6.29,14.52,13.97s-6.48,13.97-14.52,13.97v-.14Z"/>
    <path className="vcls" d="M804.76,250.41h-16.63l9.86-65.52h-17.9l-11.41,75.44c-.56,3.91,2.54,7.26,6.62,7.26h25.93l3.52-17.18Z"/>
    <path className="vcls" d="M823.36,214.65h-25.65l-3.66,17.18h16.63l-5.36,35.9-.85,6.29h18.04l6.2-42.33,1.41-9.64c.56-3.91-2.54-7.4-6.76-7.4Z"/>
    <path className="vcls" d="M673.57,267.59v-53.09h5.92v19.56h.56s.99-1.54,1.83-2.65c.85-1.12,1.83-2.1,3.38-2.93,1.41-.84,3.38-1.26,5.92-1.26,3.24,0,6.06.84,8.6,2.51,2.4,1.68,4.37,4.05,5.78,7.13,1.41,3.07,2.11,6.7,2.11,10.9s-.7,7.82-2.11,10.9c-1.41,3.07-3.24,5.45-5.78,7.13-2.4,1.68-5.21,2.51-8.46,2.51-2.4,0-4.37-.42-5.92-1.26-1.55-.84-2.68-1.82-3.38-2.93-.85-1.12-1.41-1.96-1.83-2.79h-.7v6.15h-5.92v.14ZM679.34,247.75c0,3.07.42,5.59,1.27,7.96.85,2.24,2.11,4.05,3.66,5.31,1.69,1.26,3.66,1.96,6.06,1.96s4.51-.7,6.2-1.96c1.69-1.4,2.96-3.21,3.8-5.45.85-2.37,1.27-4.89,1.27-7.68s-.42-5.31-1.27-7.54c-.85-2.24-2.11-4.05-3.66-5.31-1.69-1.4-3.66-1.96-6.2-1.96s-4.37.7-6.06,1.96c-1.69,1.26-2.82,2.93-3.66,5.17-.85,2.23-1.27,4.89-1.27,7.82v-.28h-.14Z"/>
    <path className="vcls" d="M718.8,282.54c-.99,0-1.83,0-2.68-.28-.85-.14-1.27-.28-1.69-.42l1.55-5.45c1.41.42,2.68.56,3.81.42,1.13,0,2.11-.56,2.96-1.54.85-.84,1.69-2.38,2.4-4.33l1.13-3.07-14.23-39.95h6.34l10.57,31.71h.42l10.57-31.71h6.34l-16.35,45.54c-.7,2.1-1.69,3.77-2.68,5.17-1.13,1.4-2.4,2.38-3.8,3.07s-2.96.98-4.79.98h.14v-.14Z"/>
    <g>
      <path className="vcls" d="M4.11,5.64v56.8c0,.35.27.64.62.64,2.95.04,15.64,1.21,21.47,18.24,6.63,19.33,28.72,69.6,28.72,69.6h34.83c11.32,0,41.7-6.08,56.62-49.71,14.91-43.64,28.97-95.56,28.97-95.56h-72.91v23.2s0,11.6,12.7,20.44c12.7,8.84,24.3,18.23,22.65,34.25-1.66,16.02-13.26,18.23-18.23,18.23h-20.99s-21.54-50.27-27.07-63.52c-5.52-13.26-21.54-32.59-38.11-32.59H4.11Z"/>
      <polygon className="vcls" points="636.62 47.58 636.62 5.71 548.23 5.71 548.23 47.58 567.26 47.58 567.26 108.98 548.23 108.98 548.23 150.84 567.26 150.84 567.26 150.84 617.59 150.84 617.59 150.84 636.62 150.84 636.62 108.98 617.59 108.98 617.59 47.58 636.62 47.58"/>
      <path className="vcls" d="M732.61,106.61s-35.51,1.35-35.51-28.97h0c0-30.32,35.51-28.97,35.51-28.97h.12s26.84-.99,33.83,18.68h53.13V4.56s-39.44-6.35-48.29,32.58h-.91c-13.07-35.05-52.11-32.53-56.14-32.53-1.9,0-68.82-2.74-68.82,73.03,0,37.89,13.42,74.74,87.88,74.74,69.81,0,85.97-32.39,87.71-67.66h-53.72c-5.12,22.93-34.68,21.89-34.68,21.89"/>
      <path className="vcls" d="M533.37,5.71h-50.33v87.42c-7.25-.04-15.28-.16-17.54-.46-8.31-1.1-13.85-6.37-16.72-13.62-3.92-9.94-7.06-20.23-9.95-30.53l-.1-.36c-7.04-25.09-29.99-42.44-56.14-42.44h-38.64v145.13h50.33V56.69c9.4.17,12.88.18,21.7,1.3,9.38,1.18,16.89,6.45,19.95,15.55,2.66,7.92,3.98,16.34,5.32,24.62.34,2.11,2.05,10.78,4,20.5,3.75,18.7,20.23,32.18,39.37,32.17h23.09s25.65,0,25.65,0V5.71Z"/>
      <polygon className="vcls" points="329.11 51.34 329.11 5.71 184.26 5.71 184.26 150.84 329.11 150.84 329.11 105.22 223.59 105.22 223.59 83.09 321.34 85.8 321.34 70.75 223.59 73.47 223.59 51.34 329.11 51.34"/>
      <polygon className="vcls" points="980.83 51.34 980.83 5.71 835.98 5.71 835.98 150.84 980.83 150.84 980.83 105.22 875.31 105.22 875.31 83.09 973.06 85.8 973.06 70.75 875.31 73.47 875.31 51.34 980.83 51.34"/>
    </g>
  </svg>
);

/* ── Botão da sidebar (icon rail) ── */
const railBtn = (active: boolean): React.CSSProperties => ({
  width: 44, height: 44, borderRadius: 12,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: 'none', cursor: 'pointer',
  color: active ? '#fff' : 'rgba(255,255,255,0.55)',
  background: active ? 'rgba(43,187,146,0.16)' : 'transparent',
  boxShadow: active ? 'inset 0 0 0 1px rgba(43,187,146,0.45)' : 'none',
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
            background: 'linear-gradient(180deg, #16223a 0%, #111B27 100%)',
            borderRadius: 12,
            border: '1px solid rgba(43,187,146,0.22)',
            boxShadow: '0 18px 44px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), 0 8px 30px -10px rgba(43,187,146,0.35)',
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
                  ? 'linear-gradient(92deg, rgba(43,187,146,0.30), rgba(139,12,246,0.26))'
                  : 'transparent',
                border: item.active ? '1px solid rgba(43,187,146,0.45)' : '1px solid transparent',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (!item.active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { if (!item.active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: item.active ? '#2BBB92' : 'rgba(255,255,255,0.25)' }} />
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
      }}>
        {/* Brand mark */}
        <button
          onClick={() => navigate('/')}
          aria-label="Início"
          title="Venice"
          style={{
            width: 40, height: 40, borderRadius: 11, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #2BBB92, #8B0CF6)',
            color: '#fff', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px 0 rgba(43,187,146,0.35)', marginBottom: '0.4rem',
          }}
        >
          V
        </button>

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
            aria-label="Início"
          >
            <VeniceLogo />
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Selo da marca Venice (verde) */}
            <span style={{
              fontFamily: 'monospace', fontSize: '0.68rem', letterSpacing: '0.14em',
              fontWeight: 700, color: '#2BBB92',
              background: 'rgba(43,187,146,0.12)',
              border: '1px solid rgba(43,187,146,0.35)',
              borderRadius: 999, padding: '0.26rem 0.75rem', whiteSpace: 'nowrap',
            }}>
              VENICE
            </span>

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
