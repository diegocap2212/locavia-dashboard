import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { WeeklyConeMetrics } from '../hooks/useSMDashboardData';

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

  const renderTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-200 shadow-lg rounded-lg">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-slate-600">📥 Total Entrada: <span className="font-bold">{data['Entrada (Total)']}</span></p>
            <p className="pl-4 text-slate-500 text-xs">- Planejadas: {data['Planejadas']}</p>
            <p className="pl-4 text-slate-500 text-xs">- Não Planejadas: {data['Não Planejadas']}</p>
            <p className="pl-4 text-slate-500 text-xs">- Fura Fila/Bug: {data['Fura Fila']}</p>
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
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
          <Tooltip content={renderTooltip} cursor={{fill: '#F1F5F9'}} />
          <Legend wrapperStyle={{paddingTop: '20px'}} />
          <ReferenceLine y={0} stroke="#94A3B8" />
          
          <Bar dataKey="Entrada (Total)" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Volume de Entrada" maxBarSize={50} />
          <Bar dataKey="Realizadas" fill="#10B981" radius={[4, 4, 0, 0]} name="Entregas (Realizadas)" maxBarSize={50} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
