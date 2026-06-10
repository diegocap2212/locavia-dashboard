import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WeeklyConeMetrics } from '../hooks/useSMDashboardData';

interface Props {
  data: WeeklyConeMetrics[];
}

interface TooltipProps {
  active?: boolean;
  payload?: readonly { value?: number | string }[];
  label?: string | number;
}

const PointsTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 min-w-[160px]">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Semana {label}</p>
      <p className="text-sm text-slate-700">
        Pontos entregues: <span className="font-bold text-violet-600">{payload[0].value ?? 0}</span>
      </p>
    </div>
  );
};

export const PointsVelocityChart: React.FC<Props> = ({ data }) => {
  const chartData = data.map(d => ({ name: d.weekLabel, 'Pontos Entregues': d.pointsDelivered }));

  if (chartData.length === 0 || chartData.every(d => d['Pontos Entregues'] === 0)) {
    return (
      <div className="h-full w-full flex items-center justify-center text-center text-slate-400 text-sm px-4">
        Nenhum ponto entregue no período (verifique a cobertura de estimativa ou aguarde o próximo sync).
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="barGradViolet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.65} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
          <Tooltip content={<PointsTooltip />} cursor={{ fill: '#F1F5F9' }} />
          <Bar dataKey="Pontos Entregues" fill="url(#barGradViolet)" radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
