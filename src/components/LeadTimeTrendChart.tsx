import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import type { WeeklyFlowDataPoint } from '../hooks/useSMDashboardData';
import { CHART } from '../lib/chartColors';

interface Props {
  data: WeeklyFlowDataPoint[];
}

interface TooltipEntry { value: number | null }

const LeadTimeTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 min-w-[180px]">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Semana {label}</p>
      <div className="flex justify-between items-center py-0.5">
        <span className="flex items-center gap-2 text-sm text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CHART.amber }} />
          Lead Time (Méd)
        </span>
        <span className="text-sm font-bold text-slate-800">{v !== null && v !== undefined ? `${v}d` : '-'}</span>
      </div>
    </div>
  );
};

/**
 * Lead Time médio por semana — em gráfico próprio, separado da Vazão (pedido LM).
 * Consome `weeklyFlowData.leadTimeAvg`, já calculado no hook.
 */
export const LeadTimeTrendChart: React.FC<Props> = ({ data }) => {
  const chartData = data.map(d => ({ name: d.weekLabel, 'Lead Time': d.leadTimeAvg }));

  if (chartData.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-slate-400">Nenhum dado disponível</div>;
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="smLeadTimeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.amber} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART.amber} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} dy={8} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} tickFormatter={(v: number) => `${v}d`} />
          <Tooltip content={<LeadTimeTooltip />} />
          <Area
            type="monotone"
            dataKey="Lead Time"
            stroke={CHART.amber}
            strokeWidth={2.5}
            fill="url(#smLeadTimeGrad)"
            dot={{ r: 3, fill: CHART.amber, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
