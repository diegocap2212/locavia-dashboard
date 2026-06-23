import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import type { CFDPoint } from '../cfd/computeCFD';
import { CHART } from '../lib/chartColors';

interface Props {
  data: CFDPoint[];
  /** Fração [0..1] de itens com StartDate explícito — qualidade da banda "Em andamento". */
  coverage: number;
}

interface TooltipEntry { name: string; value: number; color: string; dataKey: string }

const CFDTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  // Ordena topo→base para ler na mesma direção do empilhamento visual.
  const ordered = [...payload].reverse();
  const total = payload.reduce((acc, e) => acc + (e.value || 0), 0);
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 min-w-[210px]">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Semana {label}</p>
      {ordered.map(entry => (
        <div key={entry.dataKey} className="flex justify-between items-center py-0.5">
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="text-sm font-bold text-slate-800">{entry.value}</span>
        </div>
      ))}
      <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-100">
        <span className="text-sm font-semibold text-slate-500">Total (escopo)</span>
        <span className="text-sm font-bold text-slate-900">{total}</span>
      </div>
    </div>
  );
};

/**
 * CFD (Cumulative Flow Diagram) — fluxo acumulado por status, semana a semana.
 * Pedido de Michelle/Conrado na reunião LM. Bandas: Concluído (base) → Em andamento → A Fazer.
 *
 * Aviso de fidelidade: a banda "Em andamento" depende do StartDate, que é esparso.
 * Quando a cobertura é baixa, exibimos um alerta para o número não ser lido como exato.
 */
export const CFDChart: React.FC<Props> = ({ data, coverage }) => {
  if (!data.length) {
    return <div className="h-full w-full flex items-center justify-center text-slate-400">Nenhum dado disponível</div>;
  }

  const lowCoverage = coverage < 0.7;
  const coveragePct = Math.round(coverage * 100);

  return (
    <div className="h-full w-full flex flex-col">
      {lowCoverage && (
        <div className="flex items-start gap-2 mb-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Banda <strong>Em andamento</strong> é aproximada: só {coveragePct}% dos itens têm data de início no Jira.
            "A Fazer" e "Concluído" usam Criação/Resolução (confiáveis).
          </span>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="weekLabel" axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} allowDecimals={false} />
            <Tooltip content={<CFDTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
            {/* Ordem de empilhamento: Concluído na base, A Fazer no topo. */}
            <Area type="monotone" dataKey="Concluído" stackId="cfd" stroke={CHART.mint} fill={CHART.mint} fillOpacity={0.85} />
            <Area type="monotone" dataKey="Em andamento" stackId="cfd" stroke={CHART.amber} fill={CHART.amber} fillOpacity={0.7} />
            <Area type="monotone" dataKey="A Fazer" stackId="cfd" stroke={CHART.neutral} fill={CHART.neutral} fillOpacity={0.55} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
