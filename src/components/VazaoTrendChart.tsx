import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { WeeklyFlowDataPoint } from '../hooks/useSMDashboardData';

interface Props {
  data: WeeklyFlowDataPoint[];
}

interface TooltipEntry { name: string; value: number; color: string; dataKey: string }

const VazaoTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((acc, e) => acc + (e.value || 0), 0);
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 min-w-[200px]">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Semana {label}</p>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex justify-between items-center py-0.5">
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="text-sm font-bold text-slate-800">{entry.value}</span>
        </div>
      ))}
      <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-100">
        <span className="text-sm font-semibold text-slate-500">Total</span>
        <span className="text-sm font-bold text-slate-900">{total}</span>
      </div>
    </div>
  );
};

/**
 * Vazão (throughput) por semana — entregas por tipo de item, em gráfico próprio.
 * Separado do Lead Time a pedido da reunião LM (Michelle). Só apresentação:
 * consome `weeklyFlowData.byType`, já calculado no hook.
 */
export const VazaoTrendChart: React.FC<Props> = ({ data }) => {
  const chartData = data.map(d => ({
    name: d.weekLabel,
    'História': d.byType['História'] || 0,
    'Bug': d.byType['Bug'] || 0,
    'Tarefa': d.byType['Tarefa'] || 0,
    'Spike': d.byType['Spike'] || 0,
    'Outros': d.byType['Outros'] || 0,
  }));

  if (chartData.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-slate-400">Nenhum dado disponível</div>;
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
          <Tooltip content={<VazaoTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
          <Bar dataKey="História" stackId="tp" fill="#3B82F6" maxBarSize={32} />
          <Bar dataKey="Bug" stackId="tp" fill="#EF4444" maxBarSize={32} />
          <Bar dataKey="Tarefa" stackId="tp" fill="#10B981" maxBarSize={32} />
          <Bar dataKey="Spike" stackId="tp" fill="#8B5CF6" maxBarSize={32} />
          <Bar dataKey="Outros" stackId="tp" fill="#94A3B8" maxBarSize={32} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
