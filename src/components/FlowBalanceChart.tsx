import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import type { WeeklyFlowDataPoint } from '../hooks/useSMDashboardData';

interface Props {
  data: WeeklyFlowDataPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string | number | undefined;
    value: number;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const entradas = payload.find((p) => p.dataKey === 'entradas')?.value || 0;
  const saidas = payload.find((p) => p.dataKey === 'saidas')?.value || 0;
  const saldo = entradas - saidas;
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 min-w-[180px]">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Semana {label}</p>
      <div className="flex justify-between py-0.5">
        <span className="text-sm text-slate-600">Entradas</span>
        <span className="text-sm font-bold text-slate-500">{entradas}</span>
      </div>
      <div className="flex justify-between py-0.5">
        <span className="text-sm text-slate-600">Saídas</span>
        <span className="text-sm font-bold text-emerald-600">{saidas}</span>
      </div>
      <div className="border-t border-slate-100 mt-1.5 pt-1.5 flex justify-between">
        <span className="text-sm font-semibold text-slate-600">Saldo</span>
        <span className={`text-sm font-bold ${saldo > 0 ? 'text-rose-500' : saldo < 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
          {saldo > 0 ? '+' : ''}{saldo}
        </span>
      </div>
    </div>
  );
};

export const FlowBalanceChart: React.FC<Props> = ({ data }) => {
  // Show last 8 weeks only
  const recentData = data.slice(-8).map(d => ({
    name: d.weekLabel,
    entradas: d.entradas,
    saidas: d.saidas,
    saldo: d.saldo,
  }));

  const lastSaldo = recentData.length > 0 ? recentData[recentData.length - 1].saldo : 0;

  if (recentData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-400">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={recentData} margin={{ top: 10, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 10 }} dy={6} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <ReferenceLine y={0} stroke="#CBD5E1" />
            <Bar dataKey="entradas" fill="#94A3B8" name="Criadas" radius={[4, 4, 0, 0]} barSize={14} />
            <Bar dataKey="saidas" fill="#10B981" name="Entregues" radius={[4, 4, 0, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Saldo footer */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center">
        <span className="text-sm text-slate-500 font-semibold">Saldo (Última Semana)</span>
        <span className={`text-2xl font-extrabold tracking-tight ${
          lastSaldo > 0 ? 'text-rose-500' : lastSaldo < 0 ? 'text-emerald-500' : 'text-slate-400'
        }`}>
          {lastSaldo > 0 ? '+' : ''}{lastSaldo}
        </span>
      </div>
    </div>
  );
};
