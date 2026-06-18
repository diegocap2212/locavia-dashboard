import React, { useState } from 'react';
import type { SMConfig } from '../config/sm-config';
import { useSMDashboardData } from '../hooks/useSMDashboardData';
import { KPICard } from '../components/KPICard';
import { PlannedVsDeliveredChart } from '../components/PlannedVsDeliveredChart';
import { LeadTimeCycleTimeScatter } from '../components/LeadTimeCycleTimeScatter';
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
import { CheckCircle2, Clock, Activity, Layers, Loader2, TrendingUp, Target, Gauge, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { DateRangeFilter } from '../components/DateRangeFilter';
import dataMeta from '../data-meta.json';

interface Props {
  smConfig: SMConfig;
}

export const SMDashboard: React.FC<Props> = ({ smConfig }) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [customStartDateStr, setCustomStartDateStr] = useState<string>('');
  const [customEndDateStr, setCustomEndDateStr] = useState<string>('');
  const [selectedRelease, setSelectedRelease] = useState<string>('ALL');
  const [selectedSemanaId, setSelectedSemanaId] = useState<string>(() => getAutomaticActiveSemana());
  const [granularity, setGranularity] = useState<Granularity>('semana');
  // "Agora" capturado uma vez no mount (inicializador lazy do useState — roda só uma vez,
  // sem chamar Date.now() no corpo do render). Usado p/ calcular a defasagem do sync.
  const [nowMs] = useState(() => Date.now());

  // Cadência semanal: a semana escolhida define a análise (Redis v3) E a janela dos gráficos
  // (a semana + CONTEXT_WEEKS-1 semanas anteriores, para dar contexto de tendência).
  const CONTEXT_WEEKS = 8;
  const semanas = getSemanas();
  const activeSemana = selectedSemanaId !== 'CUSTOM' ? getSemanaById(selectedSemanaId) : undefined;
  const selIdx = semanas.findIndex(s => s.id === selectedSemanaId);
  const windowStart = selIdx >= 0 ? semanas[Math.max(0, selIdx - (CONTEXT_WEEKS - 1))].startDate : undefined;
  const customStart = selectedSemanaId === 'CUSTOM' ? customStartDateStr : windowStart;
  const customEnd = selectedSemanaId === 'CUSTOM' ? customEndDateStr : activeSemana?.endDate;

  // Semana à qual a análise/comentário fica atrelada (sempre uma semana real, mesmo em modo custom).
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
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-slate-50 min-h-screen">
        <div className="inline-flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-rose-200">
          <span className="text-rose-500 font-medium">Erro ao carregar dados: {error || 'Nenhum dado retornado'}</span>
        </div>
      </div>
    );
  }

  const { items, kpis, weeks, weeklyFlowData, cfdData, cfdCoverage, issueTypeBreakdown, leadTimeHistogram } = data;
  // Re-agrega as séries semanais conforme a granularidade escolhida (funções puras — sem hooks).
  // Não altera o cone nem as métricas-fonte; só muda o bucket de exibição de Vazão/Lead Time/CFD.
  const flowForCharts = regroupFlow(weeklyFlowData, granularity);
  const cfdForCharts = regroupCFD(cfdData, granularity);
  const gLabel = GRANULARITY_LABEL[granularity];

  // Throughput e Lead Time são da SEMANA selecionada (a janela termina nela, então é o último
  // bucket de weeklyFlowData). Assim os números mudam claramente ao trocar de semana.
  const selWeekData =
    weeklyFlowData.find(w => format(w.weekStart, 'yyyy-MM-dd') === analysisWeekId)
    ?? weeklyFlowData[weeklyFlowData.length - 1];
  const weekThroughput = selWeekData?.throughput ?? 0;
  const weekLeadTime = selWeekData?.leadTimeAvg ?? null;
  // Hora real da última sincronização com o Jira, gravada por sync/sync-jira.ts em src/data-meta.json.
  // (Antes mostrávamos items[0].UpdatedAt — o "updated" de uma issue qualquer — que não refletia a frescura dos dados.)
  const syncedAt = new Date((dataMeta as { syncedAt: string }).syncedAt);
  // Alerta de defasagem: o cron de sync é best-effort e pode atrasar/pular.
  // Se os dados estão velhos, sinalizamos para ninguém confiar em número desatualizado sem saber.
  const hoursSinceSync = (nowMs - syncedAt.getTime()) / (1000 * 60 * 60);
  const isStale = hoursSinceSync >= 2;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <span className="bg-blue-600 text-white rounded-lg p-2 text-sm mr-3 font-semibold w-10 h-10 flex items-center justify-center">
              {smConfig.avatar}
            </span>
            Dashboard — {smConfig.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center flex-wrap gap-2">
            <span>{items.length} issues analisadas · Sincronizado em {format(syncedAt, 'dd/MM/yyyy HH:mm')}</span>
            {isStale && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200">
                <Clock className="w-3 h-3" />
                Dados de {Math.floor(hoursSinceSync)}h atrás — sync pode estar atrasado
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto lg:justify-end">
          {/* Time (dropdown — substitui as abas; sem scroll horizontal) */}
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm shrink-0">
            <select
              className="bg-transparent border-none text-sm font-medium text-slate-700 py-2 pl-3 pr-8 focus:ring-0 cursor-pointer w-full outline-none"
              value={selectedTeam}
              onChange={(e) => { setSelectedTeam(e.target.value); setSelectedRelease('ALL'); }}
              title="Time / squad"
            >
              <option value="ALL">Time: Visão Geral</option>
              {smConfig.teams.map(t => (
                <option key={t.carCode} value={t.carCode}>{t.displayName}</option>
              ))}
            </select>
          </div>

          {/* Release Filter */}
          {availableReleases && availableReleases.length > 1 && (
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm shrink-0">
              <select 
                className="bg-transparent border-none text-sm font-medium text-slate-700 py-2 pl-3 pr-8 focus:ring-0 cursor-pointer w-full outline-none"
                value={selectedRelease}
                onChange={(e) => setSelectedRelease(e.target.value)}
              >
                {availableReleases.map(rel => (
                  <option key={rel} value={rel}>
                    {rel === 'ALL' ? 'Todas as Releases' : `Release: ${rel}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Semana (cadência semanal das análises) */}
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm shrink-0">
            <select
              className="bg-transparent border-none text-sm font-medium text-slate-700 py-2 pl-3 pr-8 focus:ring-0 cursor-pointer w-full outline-none"
              value={selectedSemanaId}
              onChange={(e) => setSelectedSemanaId(e.target.value)}
              title="Semana de análise — define o comentário e a janela dos gráficos"
            >
              <option value="CUSTOM">Período Customizado (Dias)</option>
              {getSemanas().map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Granularidade dos gráficos temporais (Vazão / Lead Time / CFD) */}
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm shrink-0">
            <select
              className="bg-transparent border-none text-sm font-medium text-slate-700 py-2 pl-3 pr-8 focus:ring-0 cursor-pointer w-full outline-none"
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as Granularity)}
              title="Granularidade dos gráficos temporais"
            >
              <option value="semana">Visão: Semanal</option>
              <option value="quinzena">Visão: Quinzenal</option>
              <option value="mes">Visão: Mensal</option>
            </select>
          </div>

          {/* Days Filter */}
          {selectedSemanaId === 'CUSTOM' && (
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm shrink-0">
              <DateRangeFilter
                startDate={customStartDateStr}
                endDate={customEndDateStr}
                onStartDateChange={setCustomStartDateStr}
                onEndDateChange={setCustomEndDateStr}
              />
            </div>
          )}

          {/* Atualização sob demanda do Jira (dispara o sync no GitHub Actions) */}
          <RefreshButton />
        </div>
      </div>

      {/* KPI Cards */}
      <p className="text-xs text-slate-500 mb-2">
        <span className="font-semibold">Throughput</span> e <span className="font-semibold">Lead Time</span> referem-se à <span className="font-semibold">semana selecionada</span>; <span className="font-semibold">WIP</span> e <span className="font-semibold">A Fazer</span> são o estado atual.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Throughput"
          value={weekThroughput}
          subtext={`entregas · ${analysisWeekLabel ?? 'semana'}`}
          icon={CheckCircle2}
          iconColorClass="text-emerald-500 bg-emerald-50"
        />
        <KPICard
          title="Lead Time"
          value={weekLeadTime !== null ? `${weekLeadTime}d` : '-'}
          subtext={`média · ${analysisWeekLabel ?? 'semana'}`}
          icon={Clock}
          iconColorClass="text-slate-500 bg-slate-100"
        />
        <KPICard
          title="WIP"
          value={kpis.wip}
          subtext="em andamento agora"
          icon={Activity}
          iconColorClass="text-amber-500 bg-amber-50"
        />
        <KPICard
          title="A Fazer"
          value={kpis.aFazer}
          subtext="backlog restante hoje"
          icon={Layers}
          iconColorClass="text-violet-500 bg-violet-50"
        />
      </div>

      {/* ── ROW 1: Vazão, Lead Time e Entrega por Tipo (gráficos SEPARADOS — pedido LM/Michelle) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[420px]">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
            <span className="text-amber-500 mr-2">⚡</span> Vazão · {gLabel}
          </h2>
          <p className="text-sm text-slate-500 mb-4">Entregas (throughput) por tipo de item</p>
          <div className="flex-1 min-h-0">
            <VazaoTrendChart data={flowForCharts} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[420px]">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
            <span className="text-amber-500 mr-2">⏱</span> Lead Time · {gLabel}
          </h2>
          <p className="text-sm text-slate-500 mb-4">Tempo médio Criado → Resolvido (dias)</p>
          <div className="flex-1 min-h-0">
            <LeadTimeTrendChart data={flowForCharts} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[420px]">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
            <span className="text-blue-500 mr-2">◉</span> Entrega por Tipo
          </h2>
          <p className="text-sm text-slate-500 mb-4">Distribuição das entregas no período</p>
          <div className="flex-1 min-h-0">
            <IssueTypeDonut data={issueTypeBreakdown} />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <MetricCommentEditor
          squadId={selectedTeam}
          releaseId={selectedRelease}
          quinzenaId={analysisWeekId}
          cadence="semana"
          periodLabel={analysisWeekLabel}
          key={`vazao-${selectedTeam}-${selectedRelease}-${analysisWeekId}`}
          metricId="vazao"
          metricLabel="Vazão Semanal"
        />
      </div>

      {/* ── ROW 1b: CFD (Cumulative Flow Diagram) — largura total ── */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[450px]">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
            <span className="text-emerald-500 mr-2">▥</span> Fluxo Acumulado (CFD)
          </h2>
          <p className="text-sm text-slate-500 mb-4">Itens por status ao longo do tempo ({gLabel.toLowerCase()}): A Fazer · Em andamento · Concluído</p>
          <div className="flex-1 min-h-0">
            <CFDChart data={cfdForCharts} coverage={cfdCoverage} />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <MetricCommentEditor
          squadId={selectedTeam}
          releaseId={selectedRelease}
          quinzenaId={analysisWeekId}
          cadence="semana"
          periodLabel={analysisWeekLabel}
          key={`cfd-${selectedTeam}-${selectedRelease}-${analysisWeekId}`}
          metricId="cfd"
          metricLabel="Fluxo Acumulado (CFD)"
        />
      </div>

      {/* ── ROW 2: Planejadas vs Realizadas ── */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[450px]">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
            <span className="text-blue-500 mr-2">★</span> Planejadas vs Realizadas (Por Semana)
          </h2>
          <p className="text-sm text-slate-500 mb-4">Composição da entrada por origem — planejado vs. fora da planning, contra o realizado</p>
          <div className="flex-1 min-h-0">
            <PlannedVsDeliveredChart data={weeks} />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <MetricCommentEditor
          squadId={selectedTeam}
          releaseId={selectedRelease}
          quinzenaId={analysisWeekId}
          cadence="semana"
          periodLabel={analysisWeekLabel}
          key={`planejadas-${selectedTeam}-${selectedRelease}-${analysisWeekId}`}
          metricId="planejadas"
          metricLabel="Planejadas vs Realizadas"
        />
      </div>

      {/* ── SEÇÃO: Pontos das User Stories ── */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <span className="text-violet-500 mr-2">◆</span> Pontos das User Stories
        </h2>
        <p className="text-sm text-slate-500 mt-1">Velocidade e aderência ao compromisso, em story points</p>
      </div>

      {/* KPIs de Pontos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Pontos Entregues"
          value={kpis.pointsDelivered}
          subtext="no período"
          icon={TrendingUp}
          iconColorClass="text-violet-500 bg-violet-50"
        />
        <KPICard
          title="Comprometidos"
          value={kpis.pointsCommitted}
          subtext="pontos no período"
          icon={Target}
          iconColorClass="text-slate-500 bg-slate-100"
        />
        <KPICard
          title="Aderência"
          value={kpis.pointsCommitted > 0 ? `${Math.round((kpis.pointsDelivered / kpis.pointsCommitted) * 100)}%` : '—'}
          subtext="entregue / comprometido"
          icon={Gauge}
          iconColorClass="text-blue-500 bg-blue-50"
        />
        <KPICard
          title="Cobertura"
          value={`${kpis.pointsCoverage}%`}
          subtext={kpis.pointsCoverage < 50 ? '⚠️ poucas USs com ponto' : 'USs com estimativa'}
          icon={Percent}
          iconColorClass={kpis.pointsCoverage < 50 ? 'text-amber-500 bg-amber-50' : 'text-emerald-500 bg-emerald-50'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[450px]">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
            <span className="text-violet-500 mr-2">⚡</span> Velocidade (Pontos Entregues por Semana)
          </h2>
          <p className="text-sm text-slate-500 mb-4">Story points concluídos a cada semana</p>
          <div className="flex-1 min-h-0">
            <PointsVelocityChart data={weeks} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[450px]">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
            <span className="text-blue-500 mr-2">★</span> Comprometido vs Entregue (Pontos)
          </h2>
          <p className="text-sm text-slate-500 mb-4">Pontos comprometidos vs efetivamente entregues por semana</p>
          <div className="flex-1 min-h-0">
            <PointsCommittedVsDeliveredChart data={weeks} />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <MetricCommentEditor
          squadId={selectedTeam}
          releaseId={selectedRelease}
          quinzenaId={analysisWeekId}
          cadence="semana"
          periodLabel={analysisWeekLabel}
          key={`pontos-${selectedTeam}-${selectedRelease}-${analysisWeekId}`}
          metricId="pontos"
          metricLabel="Pontos das User Stories"
        />
      </div>

      {/* ── ROW 3: Flow Balance + Scatter + Histogram ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[450px]">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
            <span className="text-emerald-500 mr-2">⇅</span> Balanço do Fluxo
          </h2>
          <p className="text-sm text-slate-500 mb-4">Entradas vs Saídas (últimas 8 semanas)</p>
          <div className="flex-1 min-h-0">
            <FlowBalanceChart data={weeklyFlowData} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[450px]">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Lead Time</h2>
          <p className="text-sm text-slate-500 mb-4">Dispersão por entrega</p>
          <div className="flex-1 min-h-0">
            <LeadTimeCycleTimeScatter items={items} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[450px]">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
            <span className="text-cyan-500 mr-2">📊</span> Distribuição Lead Time
          </h2>
          <p className="text-sm text-slate-500 mb-4">Histograma de dispersão do Lead Time</p>
          <div className="flex-1 min-h-0">
            <LeadTimeHistogram leadTimeData={leadTimeHistogram} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <MetricCommentEditor
          squadId={selectedTeam}
          releaseId={selectedRelease}
          quinzenaId={analysisWeekId}
          cadence="semana"
          periodLabel={analysisWeekLabel}
          key={`leadTime-${selectedTeam}-${selectedRelease}-${analysisWeekId}`}
          metricId="leadTime"
          metricLabel="Lead Time"
        />
        <MetricCommentEditor
          squadId={selectedTeam}
          releaseId={selectedRelease}
          quinzenaId={analysisWeekId}
          cadence="semana"
          periodLabel={analysisWeekLabel}
          key={`flowBalance-${selectedTeam}-${selectedRelease}-${analysisWeekId}`}
          metricId="flowBalance"
          metricLabel="Balanço do Fluxo"
        />
      </div>

      {/* ── ROW 4: CONE Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col overflow-hidden mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Resumo Semanal (Metodologia CONE)</h2>
        <p className="text-sm text-slate-500 mb-6">Acompanhamento de planejamento, transbordo e entregas semana a semana.</p>
        <div className="flex-1 overflow-auto rounded-lg border border-slate-200">
          <ConeWeeklyTable data={weeks} />
        </div>
      </div>

      {/* Data Quality */}
      <div className="mb-8">
        <DataQualityPanel items={items} />
      </div>

    </div>
  );
};
