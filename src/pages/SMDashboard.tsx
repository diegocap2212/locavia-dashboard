import React, { useState } from 'react';
import type { SMConfig } from '../config/sm-config';
import { useSMDashboardData } from '../hooks/useSMDashboardData';
import { KPICard } from '../components/KPICard';
import { PlannedVsDeliveredChart } from '../components/PlannedVsDeliveredChart';
import { ConeWeeklyTable } from '../components/ConeWeeklyTable';
import { DataQualityPanel } from '../components/DataQualityPanel';
import { VazaoTrendChart } from '../components/VazaoTrendChart';
import { LeadTimeTrendChart } from '../components/LeadTimeTrendChart';
import { CFDChart } from '../components/CFDChart';
import { IssueTypeDonut } from '../components/IssueTypeDonut';
import { FlowBalanceChart } from '../components/FlowBalanceChart';
import { LeadTimeHistogram } from '../components/LeadCycleTimeHistogram';
import { MetricCommentEditor } from '../components/MetricCommentEditor';
import { PointsVelocityChart } from '../components/PointsVelocityChart';
import { PointsCommittedVsDeliveredChart } from '../components/PointsCommittedVsDeliveredChart';
import { getAutomaticActiveSemana, getSemanaById, semanaIdForDate } from '../config/semanas';
import { RefreshButton } from '../components/RefreshButton';
import { CheckCircle2, Clock, Activity, Layers, Loader2, TrendingUp, Gauge, Download } from 'lucide-react';
import { format } from 'date-fns';
import { getComments, exportComments } from '../services/commentsService';
import PageHero from '../components/PageHero';
import Tabs from '../components/Tabs';
import NavDropdown from '../components/NavDropdown';
import dataMeta from '../data-meta.json';

interface Props {
  smConfig: SMConfig;
}

/* input de data escuro para o range customizado sobre o hero */
const darkDateInput: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 8, color: '#fff', fontSize: '0.8rem', fontWeight: 600,
  padding: '6px 10px', outline: 'none', colorScheme: 'dark',
};

/* presets de período (range único) */
const PERIOD_PRESETS = [
  { id: '4w', label: 'Últimas 4 semanas', weeks: 4 },
  { id: '8w', label: 'Últimas 8 semanas', weeks: 8 },
  { id: '12w', label: 'Últimas 12 semanas', weeks: 12 },
  { id: '24w', label: 'Últimas 24 semanas', weeks: 24 },
  { id: 'all', label: 'Todo o histórico', weeks: 0 },
  { id: 'custom', label: 'Personalizado…', weeks: -1 },
];
const toISO = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/* card branded de gráfico — substitui os divs repetidos bg-white */
const ChartCard: React.FC<{ title: string; subtitle?: string; height?: number; children: React.ReactNode }> = ({ title, subtitle, height = 420, children }) => (
  <div className="premium-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height }}>
    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>{title}</h3>
    {subtitle && <p style={{ margin: '0.25rem 0 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
    <div style={{ flex: 1, minHeight: 0, marginTop: subtitle ? 0 : '1rem' }}>{children}</div>
  </div>
);

const TABS = [
  { id: 'fluxo', label: 'Fluxo' },
  { id: 'compromisso', label: 'Compromisso' },
  { id: 'leadtime', label: 'Lead Time' },
  { id: 'tabela', label: 'Tabela' },
];

export const SMDashboard: React.FC<Props> = ({ smConfig }) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [selectedRelease, setSelectedRelease] = useState<string>('ALL');
  const [periodPreset, setPeriodPreset] = useState<string>('8w');
  const [customStartDateStr, setCustomStartDateStr] = useState<string>('');
  const [customEndDateStr, setCustomEndDateStr] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('fluxo');
  // "Agora" capturado uma vez no mount (inicializador lazy — sem Date.now() no corpo do render).
  const [nowMs] = useState(() => Date.now());

  // ── Período: UM range único (presets ou custom) alimenta a janela dos gráficos e os KPIs ──
  const preset = PERIOD_PRESETS.find(p => p.id === periodPreset) ?? PERIOD_PRESETS[1];
  let customStart: string | undefined;
  let customEnd: string | undefined;
  if (periodPreset === 'custom') {
    customStart = customStartDateStr || undefined;
    customEnd = customEndDateStr || undefined;
  } else if (preset.weeks === 0) {
    customStart = '2024-01-01';
    customEnd = toISO(nowMs);
  } else {
    customStart = toISO(nowMs - preset.weeks * 7 * 86400000);
    customEnd = toISO(nowMs);
  }

  // Decisão LM: a análise (comentário) ancora na SEMANA em que o range TERMINA — mantém o
  // log semanal e o hash v3_semana sem migração. O range só controla os gráficos.
  const anchorEnd = customEnd || toISO(nowMs);
  const analysisWeekId = semanaIdForDate(anchorEnd) || getAutomaticActiveSemana();
  const analysisWeekLabel = getSemanaById(analysisWeekId)?.label;
  const periodLabel = periodPreset === 'custom'
    ? (customStart && customEnd ? `${customStart} → ${customEnd}` : 'Personalizado…')
    : preset.label;

  const { data, loading, error, availableReleases } = useSMDashboardData(
    smConfig,
    selectedTeam,
    60, // Default fallback
    selectedRelease,
    customStart,
    customEnd
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '70vh' }}>
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin mb-3" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Carregando métricas...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
          Erro ao carregar dados: {error || 'Nenhum dado retornado'}
        </span>
      </div>
    );
  }

  const { items, kpis, weeks, weeklyFlowData, cfdData, cfdCoverage, issueTypeBreakdown, leadTimeHistogram } = data;
  // Charts sempre em cadência semanal (a "Visão"/granularidade foi removida).
  const flowForCharts = weeklyFlowData;
  const cfdForCharts = cfdData;

  // KPIs refletem o PERÍODO selecionado (throughput/leadTime do range; WIP/A Fazer = agora).
  const weekThroughput = kpis.throughput;
  const weekLeadTime = kpis.leadTimeAvg;
  // Hora real do último sync (gravada por sync/sync-jira.ts em src/data-meta.json).
  const syncedAt = new Date((dataMeta as { syncedAt: string }).syncedAt);
  const hoursSinceSync = (nowMs - syncedAt.getTime()) / (1000 * 60 * 60);
  const isStale = hoursSinceSync >= 2;

  const aderencia = kpis.pointsCommitted > 0
    ? `${Math.round((kpis.pointsDelivered / kpis.pointsCommitted) * 100)}%`
    : '—';

  const avatar = (
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: 'linear-gradient(135deg, #FF2993, #8B0CF6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.02em',
      boxShadow: '0 4px 14px 0 rgba(255,41,147,0.35)',
    }}>
      {smConfig.avatar}
    </div>
  );

  const subtitle = (
    <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
      {items.length} issues · sincronizado em {format(syncedAt, 'dd/MM/yyyy HH:mm')}
      {isStale && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999,
          background: 'rgba(245,158,11,0.18)', color: '#f7c365', border: '1px solid rgba(245,158,11,0.35)',
          fontSize: '0.7rem', fontWeight: 600,
        }}>
          <Clock size={11} /> {Math.floor(hoursSinceSync)}h atrás — sync pode estar atrasado
        </span>
      )}
    </span>
  );

  const commentProps = {
    squadId: selectedTeam,
    releaseId: selectedRelease,
    quinzenaId: analysisWeekId,
    cadence: 'semana' as const,
    periodLabel: analysisWeekLabel,
  };

  return (
    <>
      <PageHero eyebrow="Agilista · LM" title={`Dashboard — ${smConfig.name}`} subtitle={subtitle} leading={avatar}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
          {/* Período — range único (presets + custom) */}
          <NavDropdown
            variant="control"
            menuMinWidth={200}
            label={`Período: ${periodLabel}`}
            items={PERIOD_PRESETS.map(p => ({
              id: p.id, label: p.label, active: periodPreset === p.id,
              onSelect: () => setPeriodPreset(p.id),
            }))}
          />
          {periodPreset === 'custom' && (
            <>
              <input type="date" style={darkDateInput} value={customStartDateStr}
                onChange={e => setCustomStartDateStr(e.target.value)} title="Início" />
              <input type="date" style={darkDateInput} value={customEndDateStr}
                onChange={e => setCustomEndDateStr(e.target.value)} title="Fim" />
            </>
          )}

          {/* Time */}
          <NavDropdown
            variant="control"
            label={selectedTeam === 'ALL' ? 'Time: Visão Geral' : `Time: ${smConfig.teams.find(t => t.carCode === selectedTeam)?.displayName ?? selectedTeam}`}
            items={[
              { id: 'ALL', label: 'Visão Geral', active: selectedTeam === 'ALL', onSelect: () => { setSelectedTeam('ALL'); setSelectedRelease('ALL'); } },
              ...smConfig.teams.map(t => ({
                id: t.carCode, label: t.displayName, active: selectedTeam === t.carCode,
                onSelect: () => { setSelectedTeam(t.carCode); setSelectedRelease('ALL'); },
              })),
            ]}
          />

          {/* Release */}
          {availableReleases && availableReleases.length > 1 && (
            <NavDropdown
              variant="control"
              label={selectedRelease === 'ALL' ? 'Todas as Releases' : `Release: ${selectedRelease}`}
              items={availableReleases.map(rel => ({
                id: rel, label: rel === 'ALL' ? 'Todas as Releases' : rel, active: selectedRelease === rel,
                onSelect: () => setSelectedRelease(rel),
              }))}
            />
          )}

          <RefreshButton />

          <button
            onClick={async () => exportComments(await getComments())}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, color: '#fff',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
            }}
            title="Exportar todas as análises qualitativas"
          >
            <Download size={13} /> Exportar Análises
          </button>
        </div>
      </PageHero>

      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '2rem 2.5rem' }}>
        {/* Placar de KPIs consolidado */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
          <KPICard title="Throughput" value={weekThroughput} subtext="entregas no período" icon={CheckCircle2} accent="#FF2993" />
          <KPICard title="Lead Time" value={weekLeadTime !== null ? `${weekLeadTime}d` : '—'} subtext="média no período" icon={Clock} accent="#F59E0B" />
          <KPICard title="WIP" value={kpis.wip} subtext="em andamento agora" icon={Activity} accent="#8B0CF6" />
          <KPICard title="A Fazer" value={kpis.aFazer} subtext="backlog restante hoje" icon={Layers} accent="#94A3B8" />
          <KPICard title="Pontos Entregues" value={kpis.pointsDelivered} subtext="no período" icon={TrendingUp} accent="#2BBB92" />
          <KPICard title="Aderência" value={aderencia} subtext="entregue / comprometido" icon={Gauge} accent="#FF2993" />
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          <strong>Throughput</strong>, <strong>Lead Time</strong> e <strong>Pontos</strong> referem-se ao período selecionado; <strong>WIP</strong> e <strong>A Fazer</strong> são o estado atual. A análise é registrada na semana de <strong>{analysisWeekLabel ?? '—'}</strong>.
        </p>

        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {/* ── ABA FLUXO ── */}
        {activeTab === 'fluxo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
              <ChartCard title="Vazão" subtitle="Entregas (throughput) por tipo de item, por semana">
                <VazaoTrendChart data={flowForCharts} />
              </ChartCard>
              <ChartCard title="Velocidade" subtitle="Story points concluídos por semana">
                <PointsVelocityChart data={weeks} />
              </ChartCard>
            </div>

            <ChartCard title="Fluxo Acumulado (CFD)" subtitle="Itens por status ao longo do tempo: A Fazer · Em andamento · Concluído" height={450}>
              <CFDChart data={cfdForCharts} coverage={cfdCoverage} />
            </ChartCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
              <ChartCard title="Balanço do Fluxo" subtitle="Entradas vs Saídas (últimas 8 semanas)">
                <FlowBalanceChart data={weeklyFlowData} />
              </ChartCard>
              <ChartCard title="Entrega por Tipo" subtitle="Distribuição das entregas no período">
                <IssueTypeDonut data={issueTypeBreakdown} />
              </ChartCard>
            </div>

            <MetricCommentEditor {...commentProps} key={`vazao-${selectedTeam}-${selectedRelease}-${analysisWeekId}`} metricId="vazao" metricLabel="Fluxo (Vazão · CFD · Balanço)" />
          </div>
        )}

        {/* ── ABA COMPROMISSO ── */}
        {activeTab === 'compromisso' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ChartCard title="Planejadas vs Realizadas" subtitle="Composição da entrada por origem — planejado vs. fora da planning, contra o realizado" height={450}>
              <PlannedVsDeliveredChart data={weeks} />
            </ChartCard>
            <ChartCard title="Comprometido vs Entregue (Pontos)" subtitle="Pontos comprometidos vs efetivamente entregues por semana" height={450}>
              <PointsCommittedVsDeliveredChart data={weeks} />
            </ChartCard>
            <MetricCommentEditor {...commentProps} key={`planejadas-${selectedTeam}-${selectedRelease}-${analysisWeekId}`} metricId="planejadas" metricLabel="Compromisso (Planejado × Realizado)" />
          </div>
        )}

        {/* ── ABA LEAD TIME ── */}
        {activeTab === 'leadtime' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
              <ChartCard title="Lead Time" subtitle="Tempo médio Criado → Resolvido (dias), por semana" height={450}>
                <LeadTimeTrendChart data={flowForCharts} />
              </ChartCard>
              <ChartCard title="Distribuição do Lead Time" subtitle="Histograma de dispersão (rápido → lento)" height={450}>
                <LeadTimeHistogram leadTimeData={leadTimeHistogram} />
              </ChartCard>
            </div>
            <MetricCommentEditor {...commentProps} key={`leadTime-${selectedTeam}-${selectedRelease}-${analysisWeekId}`} metricId="leadTime" metricLabel="Lead Time" />
          </div>
        )}

        {/* ── ABA TABELA ── */}
        {activeTab === 'tabela' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="premium-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>Resumo Semanal (Metodologia CONE)</h3>
              <p style={{ margin: '0.25rem 0 1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Acompanhamento de planejamento, transbordo e entregas semana a semana.</p>
              <div style={{ flex: 1, overflow: 'auto', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <ConeWeeklyTable data={weeks} />
              </div>
            </div>
            <DataQualityPanel items={items} />
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Cobertura de estimativa em pontos: <strong>{kpis.pointsCoverage}%</strong> das USs têm estimativa
              {kpis.pointsCoverage < 50 ? ' — ⚠️ amostra baixa, leia velocidade/aderência com cautela.' : '.'}
            </p>
          </div>
        )}
      </div>
    </>
  );
};
