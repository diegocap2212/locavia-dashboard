import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import type { CFDPoint } from '../cfd/computeCFD';
import { CHART, CHART_DARK } from '../lib/chartColors';

interface Props {
  data: CFDPoint[];
  /** Fração [0..1] de itens com StartDate explícito — qualidade da banda "Em andamento". */
  coverage: number;
  /** tema escuro (navy do header) — usado como card de destaque */
  dark?: boolean;
}

interface TooltipEntry { name: string; value: number; color: string; dataKey: string }

const CFDTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  // Ordena topo→base para ler na mesma direção do empilhamento visual.
  const ordered = [...payload].reverse();
  const total = payload.reduce((acc, e) => acc + (e.value || 0), 0);
  return (
    <div style={{ background: '#0A1F12', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 12, minWidth: 210, boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.5)' }}>Semana {label}</p>
      {ordered.map(entry => (
        <div key={entry.dataKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color, display: 'inline-block' }} />
            {entry.name}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{entry.value}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>Total (escopo)</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{total}</span>
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
export const CFDChart: React.FC<Props> = ({ data, coverage, dark = false }) => {
  if (!data.length) {
    return <div className="h-full w-full flex items-center justify-center" style={{ color: dark ? 'rgba(255,255,255,0.5)' : undefined }}>Nenhum dado disponível</div>;
  }

  const lowCoverage = coverage < 0.7;
  const coveragePct = Math.round(coverage * 100);

  const gridStroke = dark ? CHART_DARK.grid : CHART.grid;
  const axisFill = dark ? CHART_DARK.axis : CHART.axis;
  const cDone = dark ? CHART_DARK.done : CHART.mint;
  const cWip = dark ? CHART_DARK.wip : CHART.amber;
  const cTodo = dark ? CHART_DARK.todo : CHART.neutral;

  return (
    <div className="h-full w-full flex flex-col">
      {lowCoverage && (
        <div
          className="flex items-start gap-2 mb-2 px-3 py-2 rounded-lg text-xs"
          style={dark
            ? { background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.35)', color: '#f7c365' }
            : { background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}
        >
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
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis dataKey="weekLabel" axisLine={false} tickLine={false} tick={{ fill: axisFill, fontSize: 11 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: axisFill, fontSize: 11 }} allowDecimals={false} />
            <Tooltip content={<CFDTooltip />} cursor={{ stroke: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: dark ? CHART_DARK.textMuted : undefined }} />
            {/* Ordem de empilhamento: Concluído na base, A Fazer no topo. */}
            <Area type="monotone" dataKey="Concluído" stackId="cfd" stroke={cDone} fill={cDone} fillOpacity={dark ? 0.75 : 0.85} />
            <Area type="monotone" dataKey="Em andamento" stackId="cfd" stroke={cWip} fill={cWip} fillOpacity={dark ? 0.6 : 0.7} />
            <Area type="monotone" dataKey="A Fazer" stackId="cfd" stroke={cTodo} fill={cTodo} fillOpacity={dark ? 0.45 : 0.55} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
