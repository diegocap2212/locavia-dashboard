import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { WeeklyConeMetrics } from '../hooks/useSMDashboardData';
import { CHART } from '../lib/chartColors';

interface Props {
  data: WeeklyConeMetrics[];
}

export const PlannedVsDeliveredChart: React.FC<Props> = ({ data }) => {
  const chartData = data.map(d => ({
    name: d.weekLabel,
    'Entrada (Total)': d.planejados + d.naoPlanejados + d.furaFila,
    'Planejadas': d.planejados,
    'Não Planejadas': d.naoPlanejados,
    'Fura Fila': d.furaFila,
    'Realizadas': d.realizado,
    'Saldo': (d.planejados + d.naoPlanejados + d.furaFila) - d.realizado
  }));

  interface TooltipProps {
    active?: boolean;
    payload?: readonly {
      payload?: {
        'Entrada (Total)': number;
        'Planejadas': number;
        'Não Planejadas': number;
        'Fura Fila': number;
        'Realizadas': number;
        'Saldo': number;
      };
    }[];
    label?: string | number;
  }

  const renderTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (!data) return null;
      const total = data['Entrada (Total)'];
      const foraPlanning = data['Não Planejadas'] + data['Fura Fila'];
      const pctFora = total > 0 ? Math.round((foraPlanning / total) * 100) : 0;
      return (
        <div className="bg-white p-4 border border-slate-200 shadow-lg rounded-lg">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-slate-600">📥 Total Entrada: <span className="font-bold">{total}</span></p>
            <p className="pl-4 text-xs"><span className="inline-block w-2 h-2 rounded-sm mr-1 align-middle" style={{ background: CHART.primary }}></span><span className="text-slate-500">Planejadas: {data['Planejadas']}</span></p>
            <p className="pl-4 text-xs"><span className="inline-block w-2 h-2 rounded-sm mr-1 align-middle" style={{ background: CHART.amber }}></span><span className="text-slate-500">Não Planejadas: {data['Não Planejadas']}</span></p>
            <p className="pl-4 text-xs"><span className="inline-block w-2 h-2 rounded-sm mr-1 align-middle" style={{ background: CHART.red }}></span><span className="text-slate-500">Fura Fila/Bug: {data['Fura Fila']}</span></p>
            <p className="pl-4 text-xs text-amber-600">↳ Fora da planning: <span className="font-bold">{foraPlanning} ({pctFora}%)</span></p>
            <div className="border-t border-slate-100 my-1"></div>
            <p className="text-emerald-600">✅ Realizadas: <span className="font-bold">{data['Realizadas']}</span></p>
            <div className="border-t border-slate-100 my-1"></div>
            <p className={data['Saldo'] > 0 ? "text-amber-600" : "text-emerald-600"}>
               ⚖️ Saldo (Gargalo): <span className="font-bold">{data['Saldo'] > 0 ? '+' : ''}{data['Saldo']}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
          <Tooltip content={renderTooltip} cursor={{fill: '#F1F5F9'}} />
          <Legend wrapperStyle={{paddingTop: '20px'}} />
          <ReferenceLine y={0} stroke={CHART.neutral} />

          {/* Entrada decomposta por origem (empilhada): base planejado → topo fora da planning */}
          <Bar dataKey="Planejadas" stackId="entrada" fill={CHART.primary} name="Planejadas" maxBarSize={50} />
          <Bar dataKey="Não Planejadas" stackId="entrada" fill={CHART.amber} name="Não Planejadas (fora da planning)" maxBarSize={50} />
          <Bar dataKey="Fura Fila" stackId="entrada" fill={CHART.red} radius={[4, 4, 0, 0]} name="Fura-fila / Bug" maxBarSize={50} />
          <Bar dataKey="Realizadas" fill={CHART.mint} radius={[4, 4, 0, 0]} name="Entregas (Realizadas)" maxBarSize={50} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
