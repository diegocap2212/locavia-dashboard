import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { useDashboardData } from './hooks/useDashboardData';
import { SMDashboard } from './pages/SMDashboard';
import { SM_CONFIGS } from './config/sm-config';
import AppShell from './components/AppShell';
import ConeCanvas from './components/ConeCanvas';
import PageHero, { deriveStatus } from './components/PageHero';
import { KPICard } from './components/KPICard';
import Button from './components/ui/Button';
import { useTheme } from './theme/ThemeProvider';
import releaseConfig from './config/release-config.json';
import { getReleaseDates, type ReleaseDatesMap } from './services/releaseDatesService';
import './App.css';

const ReleaseDetail = lazy(() => import('./pages/ReleaseDetail'));
const TeamDetail = lazy(() => import('./pages/TeamDetail'));
const ReleaseDates = lazy(() => import('./pages/ReleaseDates'));
const ProjectTracking = lazy(() => import('./pages/ProjectTracking'));

const activeReleases = releaseConfig.releases.filter(r => r.active !== false && r.id !== 'DEFAULT');

/* ────────────────────────────────────────────
   Variants
   ──────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};
const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

/* ────────────────────────────────────────────
   SMDashboardWrapper
   ──────────────────────────────────────────── */
const SMDashboardWrapper = () => {
  const { smId } = useParams();
  const config = SM_CONFIGS.find(c => c.id === smId);

  if (!config) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        SM não encontrado.
      </div>
    );
  }

  return <SMDashboard smConfig={config} />;
};

/* ────────────────────────────────────────────
   Home — Cone da Incerteza
   ──────────────────────────────────────────── */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { loading, releaseCones } = useDashboardData('locavia');

  const [selectedId, setSelectedId] = useState<string>(activeReleases[0]?.id ?? '');

  // Datas-alvo editáveis (Redis) — sobrepõem o deadline estático do release-config p/ o status.
  const [releaseDates, setReleaseDates] = useState<ReleaseDatesMap>({});
  useEffect(() => {
    let alive = true;
    getReleaseDates().then(d => { if (alive) setReleaseDates(d); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  /** Meta da release: data-alvo editada na LM (Redis) ou, na falta, o deadline do config. */
  const targetFor = (releaseId: string): Date | null => {
    const stored = releaseDates[releaseId]?.targetDate;
    if (stored) { const d = new Date(stored); if (!isNaN(d.getTime())) return d; }
    const conf = releaseConfig.releases.find(r => r.id === releaseId);
    return conf ? new Date(conf.deadline) : null;
  };

  const rc = releaseCones.find(r => r.releaseId === selectedId) ?? releaseCones[0];
  const { summary } = rc ?? { summary: null };

  const fmtDate = (d: Date | null) =>
    d ? d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : '—';

  const now = new Date();
  const isDelivered = summary ? summary.remaining === 0 : false;
  const status = summary
    ? deriveStatus(summary.remaining, summary.entregaMelhor, summary.entregaPior, now)
    : undefined;

  const kpis = rc ? [
    {
      label: 'Escopo',
      value: `${rc.summary.done}/${rc.summary.total}`,
      sub: `${rc.summary.remaining} restantes`,
      accent: 'var(--accent)',
    },
    {
      label: 'Velocidade (otimista)',
      value: `${rc.summary.velBest.toFixed(1)}`,
      sub: 'itens/semana · P85 (padrão LM)',
      accent: 'var(--forest)',
    },
    {
      label: 'Projeção de Entrega',
      value: isDelivered ? 'Concluído' : fmtDate(rc.summary.entregaMelhor),
      sub: isDelivered
        ? ''
        : rc.summary.confident
          ? `otimista → pessimista: até ${fmtDate(rc.summary.entregaPior)}`
          : 'previsão única (amostra curta)',
      accent: 'var(--accent)',
    },
    {
      label: 'Tendência (mediana)',
      value: `${rc.summary.velTrend.toFixed(1)}`,
      sub: 'itens/semana · P50',
      accent: 'var(--text-tertiary)',
    },
  ] : [];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <RefreshCw className="animate-spin" size={36} color="var(--primary)" />
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Carregando dados...</p>
      </div>
    );
  }

  return (
    <>
      <PageHero
        eyebrow={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Locavia ·
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'var(--surface)', borderRadius: 6,
              border: '1px solid var(--border-subtle)',
              padding: '3px 7px', boxShadow: 'var(--shadow-sm)',
            }}>
              <img src="/lm-logo.svg" alt="LM" style={{ height: 14, display: 'block' }} />
            </span>
          </span>
        }
        title="Cone da Incerteza"
        subtitle={rc ? (releaseCones.find(r => r.releaseId === selectedId)?.displayName ?? selectedId) : undefined}
        status={status}
      >
        <div style={{ position: 'relative' }}>
          {/* Cone (esquerda) + KPIs (direita) */}
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
            {/* Coluna esquerda — cone canvas (card claro do hero) */}
            <div style={{ flex: '3 1 560px', minWidth: 0 }}>
              {rc && rc.chartData.length > 0 && (
                <div style={{
                  borderRadius: 16,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '0.75rem 0.75rem 0.25rem',
                  height: '100%',
                }}>
                  <ConeCanvas coneData={rc} height={340} theme={theme} />
                  {/* Legend */}
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '0.5rem 0.25rem 0.5rem' }}>
                    {[
                      { color: 'var(--accent-strong)', dash: false, label: 'Realizado (a fazer hoje)' },
                      { color: 'var(--text-secondary)', dash: true,  label: 'Cenário otimista (P85)' },
                      { color: 'var(--warn)', dash: true,  label: 'Cenário pessimista (P15)' },
                      { color: 'linear-gradient(90deg,rgba(43,232,107,0.55),rgba(43,232,107,0.12))', dash: false, label: 'Faixa de incerteza', band: true },
                    ].map(({ color, dash, label, band }) => (
                      <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {band
                          ? <span style={{ width: 22, height: 12, borderRadius: 3, background: color, display: 'inline-block' }} />
                          : <span style={{ width: 22, height: 0, borderTop: `3px ${dash ? 'dashed' : 'solid'} ${color}`, borderRadius: 2, display: 'inline-block' }} />
                        }
                        {label}
                      </span>
                    ))}
                  </div>
                  {/* Explicação curta */}
                  <p style={{ margin: 0, padding: '0 0.25rem 0.6rem', fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                    A faixa mostra a <strong style={{ color: 'var(--text-secondary)' }}>incerteza da entrega</strong>: quanto mais aberta, menos previsível.
                    Otimista = ritmo dos melhores períodos (P85); pessimista = ritmo dos piores (P15).
                    {rc.summary.remaining > 0 && !rc.summary.confident && (
                      <span style={{ color: 'var(--warn-fg)' }}> · Poucas semanas de dados ({rc.summary.weeksWithData}) — faixa de incerteza ainda indisponível.</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Coluna direita — KPIs da release */}
            <div style={{ flex: '1 1 260px', display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', alignContent: 'stretch' }}>
              {kpis.map(({ label, value, sub, accent }) => (
                <KPICard key={label} title={label} value={value} subtext={sub} accent={accent} />
              ))}
            </div>
          </div>

          {/* Drill-down link */}
          {rc && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/release/${selectedId}`)}
              icon={<ExternalLink size={15} />}
              style={{ marginTop: '0.75rem' }}
            >
              Ver métricas de fluxo de&nbsp;<strong>{selectedId}</strong>
            </Button>
          )}
        </div>
      </PageHero>

      {/* ── Light content area ── */}
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '2rem 2.5rem' }}>
        {!rc ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem' }}>Sem dados para esta release.</p>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show">

            {/* Release portfolio cards — seletor de release (substitui as pills do topo) */}
            <motion.div variants={fadeUp}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Releases · selecione para ver o cone
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {releaseCones.map(r => {
                  const s = r.summary;
                  const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                  const meta = targetFor(r.releaseId);
                  // Atrasado: nem o melhor caso (otimista) alcança a meta (ou não há projeção de fim).
                  // Em Risco: o otimista bate a meta, mas o pessimista a estoura.
                  const rLate = s.remaining > 0 && !!meta && (!s.entregaMelhor || s.entregaMelhor > meta);
                  const rRisk = !rLate && s.remaining > 0 && !!meta && !!s.entregaPior && s.entregaPior > meta;
                  const accent = rLate ? 'var(--err)' : rRisk ? 'var(--warn)' : 'var(--accent)';

                  return (
                    <div
                      key={r.releaseId}
                      onClick={() => setSelectedId(r.releaseId)}
                      style={{
                        background: 'var(--surface-color)',
                        border: `1px solid ${r.releaseId === selectedId ? 'var(--primary)' : 'var(--border-color)'}`,
                        borderRadius: 12, padding: '1.25rem',
                        cursor: 'pointer', transition: 'all 0.15s',
                        boxShadow: r.releaseId === selectedId ? 'var(--shadow-brand)' : 'var(--shadow-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {r.releaseId}
                          </span>
                          <p style={{ margin: '2px 0 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {r.displayName}
                          </p>
                        </div>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                          background: rLate ? 'var(--err-bg)' : rRisk ? 'var(--warn-bg)' : 'var(--ok-bg)',
                          color: accent,
                        }}>
                          {rLate ? 'Atrasado' : rRisk ? 'Em Risco' : s.remaining === 0 ? 'Entregue' : 'No Prazo'}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ background: 'var(--bg-color)', borderRadius: 999, height: 5, marginBottom: '0.75rem', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, var(--green-400), var(--green-700))`, borderRadius: 999, transition: 'width 0.5s ease' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        <span>{s.done}/{s.total} entregues ({pct}%)</span>
                        <span>P85 {fmtDate(s.entregaMelhor)} · Meta {fmtDate(meta)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

          </motion.div>
        )}
      </div>
    </>
  );
};

/* ────────────────────────────────────────────
   App root
   ──────────────────────────────────────────── */
const App: React.FC = () => (
  <AppShell>
    <Routes>
      <Route path="/sm/:smId" element={<SMDashboardWrapper />} />
      <Route path="/cone-bf-cem" element={<Navigate to="/" replace />} />
      <Route
        path="/release/:releaseId"
        element={
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" size={28} color="var(--primary)" /></div>}>
            <ReleaseDetail />
          </Suspense>
        }
      />
      <Route
        path="/time/:teamId"
        element={
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" size={28} color="var(--primary)" /></div>}>
            <TeamDetail />
          </Suspense>
        }
      />
      <Route
        path="/datas-releases"
        element={
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" size={28} color="var(--primary)" /></div>}>
            <ReleaseDates />
          </Suspense>
        }
      />
      <Route
        path="/projetos/:projectId?"
        element={
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" size={28} color="var(--primary)" /></div>}>
            <ProjectTracking />
          </Suspense>
        }
      />
      <Route path="*" element={<Home />} />
    </Routes>
  </AppShell>
);

export default App;
