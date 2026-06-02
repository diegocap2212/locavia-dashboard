import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SMConfig } from '../config/sm-config';
import { useSMDashboardData } from '../hooks/useSMDashboardData';
import { KPICard } from '../components/KPICard';
import { PlannedVsDeliveredChart } from '../components/PlannedVsDeliveredChart';
import { LeadTimeCycleTimeScatter } from '../components/LeadTimeCycleTimeScatter';
import { ConeWeeklyTable } from '../components/ConeWeeklyTable';
import { DataQualityPanel } from '../components/DataQualityPanel';
import { WeeklyFlowTrendChart } from '../components/WeeklyFlowTrendChart';
import { IssueTypeDonut } from '../components/IssueTypeDonut';
import { FlowBalanceChart } from '../components/FlowBalanceChart';
import { LeadTimeHistogram } from '../components/LeadCycleTimeHistogram';
import { MetricCommentEditor } from '../components/MetricCommentEditor';
import { CheckCircle2, Clock, Activity, Layers, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { excelToJSDate } from '../hooks/useDashboardData';

interface Props {
  smConfig: SMConfig;
}

export const SMDashboard: React.FC<Props> = ({ smConfig }) => {
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [daysAgo, setDaysAgo] = useState<number>(60);
  const [selectedRelease, setSelectedRelease] = useState<string>('ALL');
  
  const { data, loading, error, availableReleases } = useSMDashboardData(smConfig, selectedTeam, daysAgo, selectedRelease);

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

  const { items, kpis, weeks, weeklyFlowData, issueTypeBreakdown, leadTimeHistogram } = data;
  const lastSyncDate = items.length > 0 ? items[0].UpdatedAt : new Date().toISOString();
  const parsedSyncDate = excelToJSDate(lastSyncDate) || new Date();

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
            <button
              onClick={() => navigate(`/presentation/${smConfig.id}`)}
              className="ml-4 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-transparent rounded-lg flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
            >
              <span>📺</span> Apresentação
            </button>
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center">
            {items.length} issues analisadas · Atualizado em {format(parsedSyncDate, 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 self-stretch lg:self-auto">
          {/* Team Tabs */}
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm overflow-x-auto">
            <button
              onClick={() => { setSelectedTeam('ALL'); setSelectedRelease('ALL'); }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedTeam === 'ALL' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Visão Geral
            </button>
            {smConfig.teams.map(t => (
              <button
                key={t.carCode}
                onClick={() => { setSelectedTeam(t.carCode); setSelectedRelease('ALL'); }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedTeam === t.carCode ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t.displayName}
              </button>
            ))}
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

          {/* Days Filter */}
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm shrink-0">
            <select 
              className="bg-transparent border-none text-sm font-medium text-slate-700 py-2 pl-3 pr-8 focus:ring-0 cursor-pointer w-full outline-none"
              value={daysAgo}
              onChange={(e) => setDaysAgo(Number(e.target.value))}
            >
              <option value={30}>Últimos 30 dias</option>
              <option value={60}>Últimos 60 dias</option>
              <option value={90}>Últimos 90 dias</option>
              <option value={120}>Últimos 120 dias</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KPICard 
          title="Throughput" 
          value={kpis.throughput} 
          subtext={`entregas em ${daysAgo} dias`}
          icon={CheckCircle2}
          iconColorClass="text-emerald-500 bg-emerald-50"
        />
        <KPICard 
          title="Lead Time" 
          value={kpis.leadTimeAvg !== null ? `${kpis.leadTimeAvg}d` : '-'} 
          subtext={`P85: ${kpis.leadTimeP85 || '-'}d · P15: ${kpis.leadTimeP15 || '-'}d`}
          icon={Clock}
          iconColorClass="text-slate-500 bg-slate-100"
        />
        <KPICard 
          title="WIP" 
          value={kpis.wip} 
          subtext="issues In Progress"
          icon={Activity}
          iconColorClass="text-amber-500 bg-amber-50"
        />
        <KPICard 
          title="A Fazer" 
          value={kpis.aFazer} 
          subtext="backlog atualizado"
          icon={Layers}
          iconColorClass="text-violet-500 bg-violet-50"
        />
      </div>

      {/* ── ROW 1: Flow Trends + Issue Type Donut ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[450px]">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
            <span className="text-amber-500 mr-2">⚡</span> Vazão & Tempos por Semana
          </h2>
          <p className="text-sm text-slate-500 mb-4">Throughput (barras por tipo) + Lead Time (linhas)</p>
          <div className="flex-1 min-h-0">
            <WeeklyFlowTrendChart data={weeklyFlowData} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[450px]">
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
          squadId={smConfig.id} 
          releaseId={selectedRelease} 
          metricId="vazao" 
          metricLabel="Vazão Semanal" 
        />
      </div>

      {/* ── ROW 2: Planejadas vs Realizadas ── */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[450px]">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <span className="text-blue-500 mr-2">★</span> Planejadas vs Realizadas (Por Semana)
          </h2>
          <div className="flex-1">
            <PlannedVsDeliveredChart data={weeks} />
          </div>
        </div>
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
          squadId={smConfig.id} 
          releaseId={selectedRelease} 
          metricId="leadTime" 
          metricLabel="Lead Time" 
        />
        <MetricCommentEditor 
          squadId={smConfig.id} 
          releaseId={selectedRelease} 
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
