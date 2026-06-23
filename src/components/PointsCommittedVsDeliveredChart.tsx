import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { WeeklyConeMetrics } from '../hooks/useSMDashboardData';
import { CHART } from '../lib/chartColors';

interface Props {
  data: WeeklyConeMetrics[];
}

interface TooltipProps {
  active?: boolean;
  payload?: readonly {
    payload?: { 'Comprometido': number; 'Entregue': number; 'Saldo': number };
  }[];
  label?: string | number;
}

const renderTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;
  return (
    <div className="bg-white p-4 border border-slate-200 shadow-lg rounded-lg min-w-[180px]">
      <p className="font-bold text-slate-800 mb-2">Semana {label}</p>
      <div className="space-y-1 text-sm">
        <p className="text-slate-600">🎯 Comprometido: <span className="font-bold">{d['Comprometido']} pts</span></p>
        <p className="text-emerald-600">✅ Entregue: <span className="font-bold">{d['Entregue']} pts</span></p>
        <div className="border-t border-slate-100 my-1"></div>
        <p className={d['Saldo'] > 0 ? 'text-amber-600' : 'text-emerald-600'}>
          ⚖️ Saldo: <span className="font-bold">{d['Saldo'] > 0 ? '+' : ''}{d['Saldo']} pts</span>
        </p>
      </div>
    </div>
  );
};

export const PointsCommittedVsDeliveredChart: React.FC<Props> = ({ data }) => {
  const chartData = data.map(d => ({
    name: d.weekLabel,
    'Comprometido': d.pointsCommitted,
    'Entregue': d.pointsDelivered,
    'Saldo': d.pointsCommitted - d.pointsDelivered,
  }));

  if (chartData.length === 0 || chartData.every(d => d['Comprometido'] === 0 && d['Entregue'] === 0)) {
    return (
      <div className="h-full w-full flex items-center justify-center text-center text-slate-400 text-sm px-4">
        Sem pontos comprometidos ou entregues no período (verifique a cobertura de estimativa ou aguarde o próximo sync).
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
          <Tooltip content={renderTooltip} cursor={{ fill: '#F1F5F9' }} />
          <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
          <Bar dataKey="Comprometido" fill={CHART.neutral} radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="Entregue" fill={CHART.mint} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
