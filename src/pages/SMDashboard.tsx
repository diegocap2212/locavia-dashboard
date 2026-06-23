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
import { getSemanas, getAutomaticActiveSemana, getSemanaById, semanaIdForDate } from '../config/semanas';
import { regroupFlow, regroupCFD, GRANULARITY_LABEL, type Granularity } from '../lib/timeBuckets';
import { RefreshButton } from '../components/RefreshButton';
import { CheckCircle2, Clock, Activity, Layers, Loader2, TrendingUp, Gauge, Download } from 'lucide-react';
import { format } from 'date-fns';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { getComments, exportComments } from '../services/commentsService';
import PageHero from '../components/PageHero';
import Tabs from '../components/Tabs';
import dataMeta from '../data-meta.json';

interface Props {
  smConfig: SMConfig;
}

/* pills claras para os controles sobre o hero escuro — legíveis abertas e fechadas */
const darkSelectWrap: React.CSSProperties = {
  display: 'flex', background: '#fff', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.25)', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
};
const darkSelect: React.CSSProperties = {
  background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.82rem',
  fontWeight: 600, padding: '7px 10px', cursor: 'pointer', outline: 'none',
};

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
  const [customStartDateStr, setCustomStartDateStr] = useState<string>('');
  const [customEndDateStr, setCustomEndDateStr] = useState<string>('');
  const [selectedRelease, setSelectedRelease] = useState<string>('ALL');
  const [selectedSemanaId, setSelectedSemanaId] = useState<string>(() => getAutomaticActiveSemana());
  const [granularity, setGranularity] = useState<Granularity>('semana');
  const [activeTab, setActiveTab] = useState<string>('fluxo');
  // "Agora" capturado uma vez no mount (inicializador lazy — sem Date.now() no corpo do render).
  const [nowMs] = useState(() => Date.now());

  // Cadência semanal: a semana escolhida define a análise E a janela dos gráficos
  // (semana + CONTEXT_WEEKS-1 anteriores, para dar contexto de tendência).
  const CONTEXT_WEEKS = 8;
  const semanas = getSemanas();
  const activeSemana = selectedSemanaId !== 'CUSTOM' ? getSemanaById(selectedSemanaId) : undefined;
  const selIdx = semanas.findIndex(s => s.id === selectedSemanaId);
  const windowStart = selIdx >= 0 ? semanas[Math.max(0, selIdx - (CONTEXT_WEEKS - 1))].startDate : undefined;
  const customStart = selectedSemanaId === 'CUSTOM' ? customStartDateStr : windowStart;
  const customEnd = selectedSemanaId === 'CUSTOM' ? customEndDateStr : activeSemana?.endDate;

  // Semana à qual a análise/comentário fica atrelada (sempre real, mesmo em modo custom).
  const analysisWeekId = selectedSemanaId !== 'CUSTOM'
    ? selectedSemanaId
    : (customEndDateStr ? semanaIdForDate(customEndDateStr) : getAutomaticActiveSemana());
  const analysisWeekLabel = getSemanaById(analysisWeekId)?.label;

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
  // Re-agrega as séries semanais conforme a granularidade (funções puras — sem hooks).
  const flowForCharts = regroupFlow(weeklyFlowData, granularity);
  const cfdForCharts = regroupCFD(cfdData, granularity);
  const gLabel = GRANULARITY_LABEL[granularity];

  // Throughput e Lead Time são da SEMANA selecionada (último bucket da janela).
  const selWeekData =
    weeklyFlowData.find(w => format(w.weekStart, 'yyyy-MM-dd') === analysisWeekId)
    ?? weeklyFlowData[weeklyFlowData.length - 1];
  const weekThroughput = selWeekData?.throughput ?? 0;
  const weekLeadTime = selWeekData?.leadTimeAvg ?? null;
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
          <div style={darkSelectWrap}>
            <select style={darkSelect} value={selectedTeam}
              onChange={(e) => { setSelectedTeam(e.target.value); setSelectedRelease('ALL'); }} title="Time / squad">
              <option value="ALL">Time: Visão Geral</option>
              {smConfig.teams.map(t => <option key={t.carCode} value={t.carCode}>{t.displayName}</option>)}
            </select>
          </div>

          {availableReleases && availableReleases.length > 1 && (
            <div style={darkSelectWrap}>
              <select style={darkSelect} value={selectedRelease} onChange={(e) => setSelectedRelease(e.target.value)}>
                {availableReleases.map(rel => (
                  <option key={rel} value={rel}>{rel === 'ALL' ? 'Todas as Releases' : `Release: ${rel}`}</option>
                ))}
              </select>
            </div>
          )}

          <div style={darkSelectWrap}>
            <select style={darkSelect} value={selectedSemanaId} onChange={(e) => setSelectedSemanaId(e.target.value)}
              title="Semana de análise — define o comentário e a janela dos gráficos">
              <option value="CUSTOM">Período Customizado (Dias)</option>
              {getSemanas().map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          <div style={darkSelectWrap}>
            <select style={darkSelect} value={granularity} onChange={(e) => setGranularity(e.target.value as Granularity)}
              title="Granularidade dos gráficos temporais">
              <option value="semana">Visão: Semanal</option>
              <option value="quinzena">Visão: Quinzenal</option>
              <option value="mes">Visão: Mensal</option>
            </select>
          </div>

          {selectedSemanaId === 'CUSTOM' && (
            <div style={{ ...darkSelectWrap, padding: '0 6px' }}>
              <DateRangeFilter
                startDate={customStartDateStr} endDate={customEndDateStr}
                onStartDateChange={setCustomStartDateStr} onEndDateChange={setCustomEndDateStr}
              />
            </div>
          )}

          <RefreshButton />

          <button
            onClick={async () => exportComments(await getComments())}
            style={{ ...darkSelect, ...darkSelectWrap, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Exportar todas as análises qualitativas"
          >
            <Download size={13} /> Exportar Análises
          </button>
        </div>
      </PageHero>

      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '2rem 2.5rem' }}>
        {/* Placar de KPIs consolidado */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
          <KPICard title="Throughput" value={weekThroughput} subtext={`entregas · ${analysisWeekLabel ?? 'semana'}`} icon={CheckCircle2} accent="#FF2993" />
          <KPICard title="Lead Time" value={weekLeadTime !== null ? `${weekLeadTime}d` : '—'} subtext={`média · ${analysisWeekLabel ?? 'semana'}`} icon={Clock} accent="#F59E0B" />
          <KPICard title="WIP" value={kpis.wip} subtext="em andamento agora" icon={Activity} accent="#8B0CF6" />
          <KPICard title="A Fazer" value={kpis.aFazer} subtext="backlog restante hoje" icon={Layers} accent="#94A3B8" />
          <KPICard title="Pontos Entregues" value={kpis.pointsDelivered} subtext="no período" icon={TrendingUp} accent="#2BBB92" />
          <KPICard title="Aderência" value={aderencia} subtext="entregue / comprometido" icon={Gauge} accent="#FF2993" />
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          <strong>Throughput</strong> e <strong>Lead Time</strong> referem-se à semana selecionada; <strong>WIP</strong> e <strong>A Fazer</strong> são o estado atual.
        </p>

        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {/* ── ABA FLUXO ── */}
        {activeTab === 'fluxo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
              <ChartCard title={`Vazão · ${gLabel}`} subtitle="Entregas (throughput) por tipo de item">
                <VazaoTrendChart data={flowForCharts} />
              </ChartCard>
              <ChartCard title={`Velocidade · ${gLabel}`} subtitle="Story points concluídos por período">
                <PointsVelocityChart data={weeks} />
              </ChartCard>
            </div>

            <ChartCard title="Fluxo Acumulado (CFD)" subtitle={`Itens por status ao longo do tempo (${gLabel.toLowerCase()}): A Fazer · Em andamento · Concluído`} height={450}>
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
              <ChartCard title={`Lead Time · ${gLabel}`} subtitle="Tempo médio Criado → Resolvido (dias)" height={450}>
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
