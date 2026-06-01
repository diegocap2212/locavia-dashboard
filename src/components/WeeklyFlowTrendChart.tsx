import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import type { WeeklyFlowDataPoint } from '../hooks/useSMDashboardData';

interface Props {
  data: WeeklyFlowDataPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | null;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 min-w-[200px]">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Semana {label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex justify-between items-center py-0.5">
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="text-sm font-bold text-slate-800">
            {entry.value !== null ? (entry.dataKey.includes('Time') ? `${entry.value}d` : entry.value) : '-'}
          </span>
        </div>
      ))}
    </div>
  );
};

export const WeeklyFlowTrendChart: React.FC<Props> = ({ data }) => {
  // Flatten weekly data for Recharts
  const chartData = data.map(d => ({
    name: d.weekLabel,
    'História': d.byType['História'] || 0,
    'Bug': d.byType['Bug'] || 0,
    'Tarefa': d.byType['Tarefa'] || 0,
    'Spike': d.byType['Spike'] || 0,
    'Outros': d.byType['Outros'] || 0,
    'Lead Time': d.leadTimeAvg,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-400">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="barGradBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v: number) => `${v}d`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />

          <Bar yAxisId="left" dataKey="História" stackId="tp" fill="#3B82F6" maxBarSize={32} />
          <Bar yAxisId="left" dataKey="Bug" stackId="tp" fill="#EF4444" maxBarSize={32} />
          <Bar yAxisId="left" dataKey="Tarefa" stackId="tp" fill="#10B981" maxBarSize={32} />
          <Bar yAxisId="left" dataKey="Spike" stackId="tp" fill="#8B5CF6" maxBarSize={32} />
          <Bar yAxisId="left" dataKey="Outros" stackId="tp" fill="#94A3B8" maxBarSize={32} radius={[4, 4, 0, 0]} />

          <Line yAxisId="right" type="monotone" dataKey="Lead Time" stroke="#F59E0B"
            strokeWidth={2.5} dot={{ r: 3, fill: '#F59E0B', strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
