import React, { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import type { DashboardItem } from '../types/jira';

interface Props {
  items: DashboardItem[];
}

interface TooltipPayload {
  payload: {
    id: string;
    summary: string;
    tipo: string;
    dias: number;
  };
  fill?: string;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg max-w-xs">
        <p className="font-bold text-slate-800 text-xs mb-1">{data.id}</p>
        <p className="text-slate-600 text-xs mb-2 line-clamp-2">{data.summary}</p>
        <p className="font-semibold" style={{ color: payload[0].fill }}>
          {data.tipo}: {data.dias} dias
        </p>
      </div>
    );
  }
  return null;
};

export const LeadTimeCycleTimeScatter: React.FC<Props> = ({ items }) => {
  const [filterWeek, setFilterWeek] = useState<string>('ALL');
  
  const doneItems = useMemo(() => items.filter(i => i.StatusCategory === 'DONE' && i.LeadTime !== null), [items]);
  
  // Extrair semanas disponíveis para o filtro
  const weeks = useMemo(() => {
    const ws = new Set<string>();
    doneItems.forEach(i => {
      if (i.Resolved) {
        const d = new Date(i.Resolved);
        const start = new Date(d);
        start.setDate(d.getDate() - d.getDay() + 1); // Monday
        ws.add(start.toISOString().split('T')[0]);
      }
    });
    return Array.from(ws).sort().map(w => {
      const d = new Date(w);
      return {
        value: w,
        label: `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} - ${new Date(d.getTime() + 6*24*60*60*1000).getDate().toString().padStart(2,'0')}/${(new Date(d.getTime() + 6*24*60*60*1000).getMonth()+1).toString().padStart(2,'0')}`
      };
    });
  }, [doneItems]);

  const filteredItems = useMemo(() => {
    if (filterWeek === 'ALL') return doneItems;
    return doneItems.filter(i => {
      if (!i.Resolved) return false;
      const d = new Date(i.Resolved);
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay() + 1);
      return start.toISOString().split('T')[0] === filterWeek;
    });
  }, [doneItems, filterWeek]);

  const chartData = useMemo(() => {
    return filteredItems.map((item, index) => ({
      id: item.Key,
      summary: item.Summary,
      index: index + 1,
      dias: item.LeadTime || 0,
      tipo: 'Lead Time'
    }));
  }, [filteredItems]);

  if (doneItems.length === 0) {
    return <div className="h-[350px] w-full flex items-center justify-center text-slate-400">Sem dados para análise</div>;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-end mb-4">
        <select 
          className="vds-select text-sm"
          value={filterWeek}
          onChange={(e) => setFilterWeek(e.target.value)}
        >
          <option value="ALL">Todas as semanas</option>
          {weeks.map(w => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </select>
      </div>
      
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis type="number" dataKey="index" name="Item" hide />
            <YAxis type="number" dataKey="dias" name="Dias" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
            <ZAxis range={[60, 60]} />
            <Tooltip content={<CustomTooltip />} cursor={{strokeDasharray: '3 3'}} />
            
            <Scatter name="Lead Time" data={chartData} fill="#15B14C" opacity={0.8} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
