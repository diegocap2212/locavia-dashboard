import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';

interface Props {
  /** estilo p/ shell escuro (topbar) — usa cores claras translúcidas */
  onShell?: boolean;
}

/** Botão de alternância light/dark (sol/lua). */
export const ThemeToggle: React.FC<Props> = ({ onShell = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const shellStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.14)',
    color: 'rgba(255,255,255,0.8)',
  };
  const plainStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-primary)',
  };

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Mudar para claro' : 'Mudar para escuro'}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 9, cursor: 'pointer',
        transition: 'all 0.15s', flexShrink: 0,
        ...(onShell ? shellStyle : plainStyle),
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = onShell ? 'rgba(255,255,255,0.12)' : 'var(--surface-2)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = onShell ? 'rgba(255,255,255,0.06)' : 'var(--surface)';
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};

export default ThemeToggle;
