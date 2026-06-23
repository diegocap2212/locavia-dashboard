import React, { lazy, Suspense, useState } from 'react';
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
import releaseConfig from './config/release-config.json';
import './App.css';

const ReleaseDetail = lazy(() => import('./pages/ReleaseDetail'));
const TeamDetail = lazy(() => import('./pages/TeamDetail'));

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
  const { loading, releaseCones } = useDashboardData('locavia');

  const [selectedId, setSelectedId] = useState<string>(activeReleases[0]?.id ?? '');

  const rc = releaseCones.find(r => r.releaseId === selectedId) ?? releaseCones[0];
  const { summary } = rc ?? { summary: null };

  const fmtDate = (d: Date | null) =>
    d ? d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : '—';

  const now = new Date();
  const isDelivered = summary ? summary.remaining === 0 : false;
  const status = summary
    ? deriveStatus(summary.remaining, summary.entregaMelhor, summary.entregaPior, now)
    : undefined;

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
        eyebrow="Locavia · LM"
        title="Cone da Incerteza"
        subtitle={rc ? (releaseCones.find(r => r.releaseId === selectedId)?.displayName ?? selectedId) : undefined}
        status={status}
      >
        <div style={{ position: 'relative' }}>
          {/* Flat release selector */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.62rem', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.38)', marginRight: '0.25rem', fontWeight: 700 }}>RELEASES</span>
            {releaseCones.map(r => {
              const active = selectedId === r.releaseId;
              return (
                <button
                  key={r.releaseId}
                  onClick={() => setSelectedId(r.releaseId)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '5px 14px', borderRadius: 999,
                    border: `1px solid ${active ? '#FF2993' : 'rgba(255,255,255,0.12)'}`,
                    cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.03em',
                    transition: 'all 0.15s',
                    background: active ? 'linear-gradient(92deg, rgba(255,41,147,0.28), rgba(139,12,246,0.28))' : 'rgba(255,255,255,0.05)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                    boxShadow: active ? '0 0 0 1px rgba(255,41,147,0.5), 0 6px 18px -8px rgba(255,41,147,0.7)' : 'none',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? '#FF2993' : 'rgba(255,255,255,0.3)', display: 'inline-block' }} />
                  {r.releaseId}
                </button>
              );
            })}
          </div>

          {/* Cone canvas — dark card inside hero */}
          {rc && rc.chartData.length > 0 && (
            <div style={{
              borderRadius: 16,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '0.75rem 0.75rem 0.25rem',
              marginBottom: '0.25rem',
            }}>
              <ConeCanvas coneData={rc} height={340} />
              {/* Legend */}
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '0.5rem 0.25rem 0.75rem' }}>
                {[
                  { color: '#FF2993', dash: false, label: 'Realizado' },
                  { color: '#FFFFFF', dash: true,  label: 'Projeção P85 · padrão LM' },
                  { color: 'linear-gradient(90deg,rgba(255,41,147,0.55),rgba(139,12,246,0.18))', dash: false, label: 'Faixa de incerteza (P15–P85)', band: true },
                ].map(({ color, dash, label, band }) => (
                  <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: 'rgba(255,255,255,0.6)' }}>
                    {band
                      ? <span style={{ width: 22, height: 12, borderRadius: 3, background: color, display: 'inline-block' }} />
                      : <span style={{ width: 22, height: 0, borderTop: `3px ${dash ? 'dashed' : 'solid'} ${color}`, borderRadius: 2, display: 'inline-block' }} />
                    }
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Drill-down link */}
          {rc && (
            <button
              onClick={() => navigate(`/release/${selectedId}`)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                background: 'var(--navy-surface)', color: '#fff',
                border: 'none', borderRadius: 11, cursor: 'pointer',
                fontWeight: 700, fontSize: '0.88rem', padding: '0.8rem 1.3rem',
                transition: 'all 0.15s', marginTop: '0.75rem',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FF2993'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 22px -10px rgba(255,41,147,0.8)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--navy-surface)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
            >
              <ExternalLink size={15} /> Ver métricas de fluxo de <strong>{selectedId}</strong>
            </button>
          )}
        </div>
      </PageHero>

      {/* ── Light content area ── */}
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '2rem 2.5rem' }}>
        {!rc ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem' }}>Sem dados para esta release.</p>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show">

            {/* KPI cards */}
            <motion.div variants={stagger} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
              {[
                {
                  label: 'Escopo',
                  value: `${rc.summary.done}/${rc.summary.total}`,
                  sub: `${rc.summary.remaining} restantes`,
                  accent: '#FF2993',
                },
                {
                  label: 'Velocidade · P85',
                  value: `${rc.summary.velBest.toFixed(1)}`,
                  sub: 'itens/semana · padrão LM',
                  accent: '#8B0CF6',
                },
                {
                  label: 'Projeção de Entrega',
                  value: isDelivered ? 'Concluído' : fmtDate(rc.summary.entregaMelhor),
                  sub: isDelivered ? '' : `até ${fmtDate(rc.summary.entregaPior)} (P15)`,
                  accent: '#2BBB92',
                },
                {
                  label: 'Tendência · P50',
                  value: `${rc.summary.velTrend.toFixed(1)}`,
                  sub: 'itens/semana',
                  accent: '#9ca3af',
                },
              ].map(({ label, value, sub, accent }) => (
                <motion.div key={label} variants={fadeUp}>
                  <KPICard title={label} value={value} subtext={sub} accent={accent} />
                </motion.div>
              ))}
            </motion.div>

            {/* Release portfolio cards */}
            <motion.div variants={fadeUp}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Todas as Releases
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {releaseCones.map(r => {
                  const s = r.summary;
                  const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                  const rLate = !!s.entregaPior && s.entregaPior < now && s.remaining > 0;
                  const rRisk = !rLate && !!s.entregaMelhor && s.entregaMelhor > new Date(now.getTime() + 60 * 86400000) && s.remaining > 0;
                  const accent = rLate ? '#ef4444' : rRisk ? '#f59e0b' : '#2BBB92';

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
                          background: rLate ? 'rgba(239,68,68,0.1)' : rRisk ? 'rgba(245,158,11,0.1)' : 'rgba(43,187,146,0.1)',
                          color: accent,
                        }}>
                          {rLate ? 'Atrasado' : rRisk ? 'Em Risco' : s.remaining === 0 ? 'Entregue' : 'No Prazo'}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ background: 'var(--bg-color)', borderRadius: 999, height: 5, marginBottom: '0.75rem', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, var(--primary), var(--brand-violet))`, borderRadius: 999, transition: 'width 0.5s ease' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        <span>{s.done}/{s.total} entregues ({pct}%)</span>
                        <span>P85: {fmtDate(s.entregaMelhor)}</span>
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
      <Route path="*" element={<Home />} />
    </Routes>
  </AppShell>
);

export default App;
