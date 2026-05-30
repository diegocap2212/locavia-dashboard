import React, { useState } from 'react';
import type { SMConfig } from '../config/sm-config';
import { useSMDashboardData } from '../hooks/useSMDashboardData';
import { KPICard } from '../components/KPICard';
import { PlannedVsDeliveredChart } from '../components/PlannedVsDeliveredChart';
import { WeeklyThroughputChart } from '../components/WeeklyThroughputChart';
import { LeadTimeCycleTimeScatter } from '../components/LeadTimeCycleTimeScatter';
import { ConeWeeklyTable } from '../components/ConeWeeklyTable';
import { DataQualityPanel } from '../components/DataQualityPanel';
import { CheckCircle2, Clock, Zap, Activity, Layers, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  smConfig: SMConfig;
}

export const SMDashboard: React.FC<Props> = ({ smConfig }) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [daysAgo, setDaysAgo] = useState<number>(60);
  
  const { data, loading, error } = useSMDashboardData(smConfig, selectedTeam, daysAgo);

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

  const { items, kpis, weeks } = data;
  const lastSyncDate = items.length > 0 ? items[0].UpdatedAt : new Date().toISOString();

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
          <p className="text-sm text-slate-500 mt-1 flex items-center">
            {items.length} issues analisadas · Atualizado em {format(new Date(lastSyncDate), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 self-stretch lg:self-auto">
          {/* Team Tabs */}
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm overflow-x-auto">
            <button
              onClick={() => setSelectedTeam('ALL')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedTeam === 'ALL' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Visão Geral
            </button>
            {smConfig.teams.map(t => (
              <button
                key={t.carCode}
                onClick={() => setSelectedTeam(t.carCode)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedTeam === t.carCode ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t.displayName}
              </button>
            ))}
          </div>

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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
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
          title="Cycle Time" 
          value={kpis.cycleTimeAvg !== null ? `${kpis.cycleTimeAvg}d` : '-'} 
          subtext={`Mediana: ${kpis.cycleTimeMedian || '-'}d`}
          icon={Zap}
          iconColorClass="text-blue-500 bg-blue-50"
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

      {/* Main Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[450px]">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <span className="text-blue-500 mr-2">★</span> Planejadas vs Realizadas (Por Semana)
          </h2>
          <div className="flex-1">
            <PlannedVsDeliveredChart data={weeks} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[450px]">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Entregas por Semana (Throughput)</h2>
          <div className="flex-1">
            <WeeklyThroughputChart items={items} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[450px]">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Lead Time & Cycle Time</h2>
          <p className="text-sm text-slate-500 mb-6">Dispersão por entrega. Use o filtro para analisar semanas específicas.</p>
          <div className="flex-1">
            <LeadTimeCycleTimeScatter items={items} />
          </div>
        </div>
        
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col overflow-hidden">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Resumo Semanal (Metodologia CONE)</h2>
          <p className="text-sm text-slate-500 mb-6">Acompanhamento de planejamento, transbordo e entregas semana a semana.</p>
          <div className="flex-1 overflow-auto rounded-lg border border-slate-200">
            <ConeWeeklyTable data={weeks} />
          </div>
        </div>
      </div>

      {/* Data Quality */}
      <div className="mb-8">
        <DataQualityPanel items={items} />
      </div>

    </div>
  );
};
