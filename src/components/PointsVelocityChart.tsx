import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WeeklyConeMetrics } from '../hooks/useSMDashboardData';
import { CHART } from '../lib/chartColors';

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
    <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 12, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-subtle)', minWidth: 160 }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Semana {label}</p>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
        Pontos entregues: <span style={{ fontWeight: 700, color: 'var(--accent-strong)' }}>{payload[0].value ?? 0}</span>
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
            <linearGradient id="barGradGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.95} />
              <stop offset="100%" stopColor={CHART.primary} stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} dy={8} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} />
          <Tooltip content={<PointsTooltip />} cursor={{ fill: 'rgba(130,146,138,0.12)' }} />
          <Bar dataKey="Pontos Entregues" fill="url(#barGradGreen)" radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
