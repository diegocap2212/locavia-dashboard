import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { triggerRefresh, getRefreshStatus } from '../services/refreshService';
import Button from './ui/Button';

type Phase = 'idle' | 'starting' | 'running' | 'done' | 'error';

const POLL_INTERVAL_MS = 8000;
const POLL_TIMEOUT_MS = 8 * 60 * 1000;

/**
 * Botão "Atualizar agora" — dispara o sync do Jira sob demanda (workflow_dispatch via /api/refresh)
 * e acompanha a execução por polling. Não é instantâneo: o sync roda no GitHub Actions e a Vercel
 * redeploya, então comunicamos o tempo (~2-5 min) e recarregamos o painel ao concluir.
 */
export const RefreshButton: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [msg, setMsg] = useState<string>('');
  const startedAtRef = useRef<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  const beginPolling = () => {
    startedAtRef.current = Date.now();
    stopPolling();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
        stopPolling();
        setPhase('done');
        setMsg('Sincronização disparada. Recarregue a página em alguns minutos para ver os dados novos.');
        return;
      }
      const s = await getRefreshStatus();
      if (s.status === 'completed') {
        stopPolling();
        if (s.conclusion === 'success' || s.conclusion === null || s.conclusion === undefined) {
          setPhase('done');
          setMsg('Sincronização concluída. Recarregando o painel...');
          setTimeout(() => window.location.reload(), 4000);
        } else {
          setPhase('error');
          setMsg('A sincronização falhou no GitHub Actions — verifique a execução.');
        }
      } else if (s.status === 'in_progress' || s.status === 'queued') {
        setMsg('Sincronizando com o Jira... (pode levar alguns minutos)');
      }
    }, POLL_INTERVAL_MS);
  };

  const onClick = async () => {
    setPhase('starting');
    setMsg('Disparando sincronização...');
    const r = await triggerRefresh();
    if (!r.ok) {
      setPhase('error');
      setMsg(r.error || 'Não foi possível iniciar a sincronização.');
      return;
    }
    setPhase('running');
    setMsg(r.alreadyRunning ? 'Sincronização já em andamento...' : 'Sincronização iniciada...');
    beginPolling();
  };

  const busy = phase === 'starting' || phase === 'running';

  const leadIcon = phase === 'done'
    ? <Check className="w-4 h-4" />
    : phase === 'error'
      ? <AlertTriangle className="w-4 h-4" />
      : <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />;

  return (
    <div className="flex flex-col items-end shrink-0 min-w-[160px]">
      <Button
        variant={phase === 'error' ? 'destructive' : 'accent'}
        onClick={onClick}
        disabled={busy}
        icon={leadIcon}
        style={{ width: '100%' }}
        title="Dispara a sincronização com o Jira (leva alguns minutos)"
      >
        {busy ? 'Sincronizando...' : 'Atualizar agora'}
      </Button>
      {msg && (
        <span
          className="text-[11px] mt-1 text-right leading-tight max-w-[220px]"
          style={{ color: phase === 'error' ? 'var(--err-fg)' : 'var(--text-tertiary)' }}
        >
          {msg}
        </span>
      )}
    </div>
  );
};
