import React, { useMemo } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import type { DashboardItem } from '../types/jira';
import { startOfWeek, format } from 'date-fns';
import { excelToJSDate } from '../hooks/useDashboardData';

interface Props {
  items: DashboardItem[];
}

const COLORS: Record<string, string> = {
  'Story': '#3B82F6', // blue-500
  'História': '#3B82F6',
  'Bug': '#EF4444', // red-500
  'Defeito': '#EF4444',
  'Task': '#10B981', // emerald-500
  'Tarefa': '#10B981',
  'Spike': '#8B5CF6', // violet-500
  'Outros': '#94A3B8' // slate-400
};

export const WeeklyThroughputChart: React.FC<Props> = ({ items }) => {
  const chartData = useMemo(() => {
    // Apenas items DONE (e ignoramos Sub-tasks que poluem a contagem real de entregas de valor)
    const doneItems = items.filter(i => 
      i.StatusCategory === 'DONE' && 
      i.Resolved &&
      !['sub-task', 'sub-tarefa', 'subtarefa'].includes(i.Type.toLowerCase())
    );

    const weeksMap = new Map<string, Record<string, any>>();

    doneItems.forEach(item => {
      const resolved = excelToJSDate(item.Resolved);
      if (!resolved || isNaN(resolved.getTime())) return;
      const weekStart = startOfWeek(resolved, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      const weekLabel = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
      
      let type = item.Type;
      // Normalize common types
      if (['Story', 'História'].includes(type)) type = 'História';
      else if (['Bug', 'Defeito'].includes(type)) type = 'Bug';
      else if (['Task', 'Tarefa'].includes(type)) type = 'Tarefa';
      else if (type === 'Spike') type = 'Spike';
      else type = 'Outros';

      if (!weeksMap.has(weekKey)) {
        weeksMap.set(weekKey, { name: weekLabel, sortKey: weekStart.getTime(), Total: 0, _leadTimes: [] });
      }

      const weekData = weeksMap.get(weekKey)!;
      weekData[type] = (weekData[type] || 0) + 1;
      weekData.Total += 1;
      
      if (item.LeadTime !== null) {
        weekData._leadTimes.push(item.LeadTime);
      }
    });

    const data = Array.from(weeksMap.values()).sort((a, b) => a.sortKey - b.sortKey);
    
    // Calcular Lead Time médio por semana
    data.forEach(d => {
      if (d._leadTimes.length > 0) {
        d['Lead Time Med'] = Math.round(d._leadTimes.reduce((acc: number, val: number) => acc + val, 0) / d._leadTimes.length);
      } else {
        d['Lead Time Med'] = null;
      }
      delete d._leadTimes;
      delete d.sortKey;
    });

    return data;
  }, [items]);

  // Extract unique issue types to create Bar series
  const issueTypes = useMemo(() => {
    const types = new Set<string>();
    chartData.forEach(d => {
      Object.keys(d).forEach(k => {
        if (k !== 'name' && k !== 'Total' && k !== 'Lead Time Med') types.add(k);
      });
    });
    return Array.from(types).sort();
  }, [chartData]);

  if (chartData.length === 0) {
    return <div className="h-[350px] w-full flex items-center justify-center text-slate-400">Nenhum item finalizado no período</div>;
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94A3B8'}} tickFormatter={(v) => `${v}d`} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{paddingTop: '20px'}} />
          
          {issueTypes.map(type => (
            <Bar key={type} yAxisId="left" dataKey={type} stackId="a" fill={COLORS[type] || COLORS.Outros} maxBarSize={50} />
          ))}
          
          <Line yAxisId="right" type="monotone" dataKey="Lead Time Med" stroke="#94A3B8" strokeWidth={2} dot={{r: 4, fill: '#94A3B8'}} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
