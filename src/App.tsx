import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { RefreshCw, ExternalLink, Plus } from 'lucide-react';
import { useDashboardData } from './hooks/useDashboardData';
import { SMDashboard } from './pages/SMDashboard';
import { SM_CONFIGS } from './config/sm-config';
import AppShell from './components/AppShell';
import ConeCanvas from './components/ConeCanvas';
import PageHero, { deriveStatus } from './components/PageHero';
import { KPICard } from './components/KPICard';
import Button from './components/ui/Button';
import { Input, Select } from './components/ui/Input';
import { useTheme } from './theme/ThemeProvider';
import releaseConfig from './config/release-config.json';
import { getReleaseDates, type ReleaseDatesMap } from './services/releaseDatesService';
import { createRelease } from './services/releasesService';
import './App.css';

const ReleaseDetail = lazy(() => import('./pages/ReleaseDetail'));
const TeamDetail = lazy(() => import('./pages/TeamDetail'));
const ReleaseDates = lazy(() => import('./pages/ReleaseDates'));
const ApiDocs = lazy(() => import('./pages/ApiDocs'));

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
   CreateReleaseModal — formulário p/ criar release (persiste no Redis)
   ──────────────────────────────────────────── */
interface CreateReleaseModalProps {
  /** ids já existentes (config + criadas) para barrar colisão no cliente */
  existingIds: Set<string>;
  onClose: () => void;
  onCreated: (id: string) => void;
}

const CreateReleaseModal: React.FC<CreateReleaseModalProps> = ({ existingIds, onClose, onCreated }) => {
  const [id, setId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [cone, setCone] = useState<'locavia' | 'bf-cem'>('locavia');
  const [generation, setGeneration] = useState<'gen1' | 'gen2'>('gen1');
  const [percentileWindow, setPercentileWindow] = useState('8');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanId = id.trim().toUpperCase();
  const idError =
    cleanId && !/^[A-Z0-9][A-Z0-9-]{1,30}$/.test(cleanId)
      ? 'Use o label do Jira: letras/números/hífen (ex.: O4R4).'
      : cleanId && existingIds.has(cleanId)
        ? 'Já existe uma release com esse id.'
        : undefined;

  const canSave = !!cleanId && !idError && !!deadline && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const res = await createRelease({
      id: cleanId,
      displayName: displayName.trim() || cleanId,
      deadline,
      cone,
      generation,
      percentileWindow: Number(percentileWindow) || 8,
    });
    setSaving(false);
    if (!res.ok) { setError(res.error ?? 'Falha ao criar release.'); return; }
    onCreated(res.record?.id ?? cleanId);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
      }}
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: 'min(520px, 100%)', maxHeight: '90vh', overflowY: 'auto',
          background: 'var(--surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 16, boxShadow: 'var(--shadow-lg, var(--shadow-sm))', padding: '1.5rem',
        }}
      >
        <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
          Nova release
        </h2>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          Crie uma release para acompanhar no cone. Ela aparece no seletor na hora; o cone é preenchido
          automaticamente assim que houver itens no Jira com este label.
        </p>

        <div style={{ display: 'grid', gap: '0.9rem' }}>
          <Input
            label="ID (label no Jira)"
            placeholder="ex.: O4R4"
            value={id}
            onChange={e => setId(e.target.value)}
            error={idError}
            help="Igual ao label usado nos itens do Jira."
            autoFocus
          />
          <Input
            label="Nome de exibição"
            placeholder="ex.: Release O4R4 (Dez/26)"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
          <Input
            label="Data-alvo (meta)"
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            <Select label="Cone" value={cone} onChange={e => setCone(e.target.value as 'locavia' | 'bf-cem')}>
              <option value="locavia">Locavia</option>
              <option value="bf-cem">BF / CEM</option>
            </Select>
            <Select label="Geração" value={generation} onChange={e => setGeneration(e.target.value as 'gen1' | 'gen2')}>
              <option value="gen1">gen1</option>
              <option value="gen2">gen2</option>
            </Select>
          </div>
          <Input
            label="Janela de percentil"
            type="number"
            min={1}
            max={52}
            value={percentileWindow}
            onChange={e => setPercentileWindow(e.target.value)}
            help="Semanas usadas no cálculo dos percentis (padrão 8)."
          />
        </div>

        {error && (
          <p style={{ margin: '1rem 0 0', fontSize: '0.8rem', color: 'var(--err, #ef4444)' }}>{error}</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.5rem' }}>
          <Button type="button" variant="tertiary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="accent" loading={saving} disabled={!canSave} icon={<Plus size={15} />}>
            Criar release
          </Button>
        </div>
      </form>
    </div>
  );
};

/* ────────────────────────────────────────────
   Home — Cone da Incerteza
   ──────────────────────────────────────────── */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { loading, releaseCones, createdReleases, reloadCreatedReleases } = useDashboardData('locavia');

  const [selectedId, setSelectedId] = useState<string>(activeReleases[0]?.id ?? '');
  const [showCreate, setShowCreate] = useState(false);

  // ids já em uso (config estático + releases atualmente no seletor) — barra colisão no form.
  const existingIds = new Set<string>([
    ...releaseConfig.releases.map(r => r.id),
    ...releaseCones.map(r => r.releaseId),
  ]);

  // Datas-alvo editáveis (Redis) — sobrepõem o deadline estático do release-config p/ o status.
  const [releaseDates, setReleaseDates] = useState<ReleaseDatesMap>({});
  useEffect(() => {
    let alive = true;
    getReleaseDates().then(d => { if (alive) setReleaseDates(d); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  /** Meta da release: data-alvo editada na LM (Redis) ou, na falta, o deadline do config/criada. */
  const targetFor = (releaseId: string): Date | null => {
    const stored = releaseDates[releaseId]?.targetDate;
    if (stored) { const d = new Date(stored); if (!isNaN(d.getTime())) return d; }
    const conf = releaseConfig.releases.find(r => r.id === releaseId)
      ?? createdReleases.find(r => r.id === releaseId);
    return conf ? new Date(conf.deadline) : null;
  };

  const rc = releaseCones.find(r => r.releaseId === selectedId) ?? releaseCones[0];
  const { summary } = rc ?? { summary: null };

  const fmtDate = (d: Date | null) =>
    d ? d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : '—';

  const now = new Date();
  const hasConeData = !!rc && rc.chartData.length > 0;
  const isDelivered = summary ? summary.remaining === 0 : false;
  const status = summary && hasConeData
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
          {/* Seletor de release (pílulas acima do cone) + criar nova */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.62rem', letterSpacing: '0.18em', color: 'var(--text-tertiary)', marginRight: '0.25rem', fontWeight: 700 }}>RELEASES</span>
            {releaseCones.map(r => (
              <Button
                key={r.releaseId}
                size="sm"
                variant={rc?.releaseId === r.releaseId ? 'accent' : 'tertiary'}
                onClick={() => setSelectedId(r.releaseId)}
              >
                {r.releaseId}
              </Button>
            ))}
            <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
              Nova release
            </Button>
          </div>

          {/* Cone (esquerda) + KPIs (direita) — alinhados ao topo p/ o card do cone não esticar */}
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* Coluna esquerda — cone canvas (card claro do hero) */}
            <div style={{ flex: '3 1 560px', minWidth: 0 }}>
              {rc && (
                <div style={{
                  borderRadius: 16,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '0.75rem 0.75rem 0.6rem',
                }}>
                  {hasConeData ? (
                    <>
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
                      <p style={{ margin: '0 0 0.6rem', padding: '0 0.25rem', fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                        A faixa mostra a <strong style={{ color: 'var(--text-secondary)' }}>incerteza da entrega</strong>: quanto mais aberta, menos previsível.
                        Otimista = ritmo dos melhores períodos (P85); pessimista = ritmo dos piores (P15).
                        {rc.summary.remaining > 0 && !rc.summary.confident && (
                          <span style={{ color: 'var(--warn-fg)' }}> · Poucas semanas de dados ({rc.summary.weeksWithData}) — faixa de incerteza ainda indisponível.</span>
                        )}
                      </p>
                      {/* Drill-down link — encostado ao cone, dentro do card */}
                      <div style={{ padding: '0 0.25rem' }}>
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/release/${selectedId}`)}
                          icon={<ExternalLink size={15} />}
                        >
                          Ver métricas de fluxo de&nbsp;<strong>{selectedId}</strong>
                        </Button>
                      </div>
                    </>
                  ) : (
                    /* Release recém-criada sem itens no Jira ainda */
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 0.4rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Aguardando dados do Jira
                      </p>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                        A release <strong style={{ color: 'var(--text-secondary)' }}>{rc.releaseId}</strong> ainda não tem itens com este label no Jira.
                        O cone aparece automaticamente assim que houver dados.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Coluna direita — KPIs da release (só quando há cone) */}
            {hasConeData && (
              <div style={{ flex: '1 1 260px', display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                {kpis.map(({ label, value, sub, accent }) => (
                  <KPICard key={label} title={label} value={value} subtext={sub} accent={accent} />
                ))}
              </div>
            )}
          </div>
        </div>
      </PageHero>

      {showCreate && (
        <CreateReleaseModal
          existingIds={existingIds}
          onClose={() => setShowCreate(false)}
          onCreated={(newId) => {
            setShowCreate(false);
            reloadCreatedReleases();
            setSelectedId(newId);
          }}
        />
      )}

      {/* ── Light content area ── */}
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '2rem 2.5rem' }}>
        {!rc ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem' }}>Sem dados para esta release.</p>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show">

            {/* Release portfolio cards — visão geral; também serve de seletor (sincroniza com as pílulas do topo) */}
            <motion.div variants={fadeUp}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Releases · selecione para ver o cone
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {releaseCones.map(r => {
                  const s = r.summary;
                  const isEmpty = r.chartData.length === 0;
                  const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                  const meta = targetFor(r.releaseId);
                  // Atrasado: nem o melhor caso (otimista) alcança a meta (ou não há projeção de fim).
                  // Em Risco: o otimista bate a meta, mas o pessimista a estoura.
                  const rLate = !isEmpty && s.remaining > 0 && !!meta && (!s.entregaMelhor || s.entregaMelhor > meta);
                  const rRisk = !isEmpty && !rLate && s.remaining > 0 && !!meta && !!s.entregaPior && s.entregaPior > meta;
                  const accent = isEmpty ? 'var(--text-tertiary)' : rLate ? 'var(--err)' : rRisk ? 'var(--warn)' : 'var(--accent)';

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
                          background: isEmpty ? 'var(--surface-2, var(--bg-color))' : rLate ? 'var(--err-bg)' : rRisk ? 'var(--warn-bg)' : 'var(--ok-bg)',
                          color: accent,
                        }}>
                          {isEmpty ? 'Sem dados' : rLate ? 'Atrasado' : rRisk ? 'Em Risco' : s.remaining === 0 ? 'Entregue' : 'No Prazo'}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ background: 'var(--bg-color)', borderRadius: 999, height: 5, marginBottom: '0.75rem', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, var(--green-400), var(--green-700))`, borderRadius: 999, transition: 'width 0.5s ease' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        <span>{isEmpty ? 'Aguardando itens no Jira' : `${s.done}/${s.total} entregues (${pct}%)`}</span>
                        <span>{isEmpty ? `Meta ${fmtDate(meta)}` : `P85 ${fmtDate(s.entregaMelhor)} · Meta ${fmtDate(meta)}`}</span>
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
        path="/api-docs"
        element={
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" size={28} color="var(--primary)" /></div>}>
            <ApiDocs />
          </Suspense>
        }
      />
      <Route path="*" element={<Home />} />
    </Routes>
  </AppShell>
);

export default App;
