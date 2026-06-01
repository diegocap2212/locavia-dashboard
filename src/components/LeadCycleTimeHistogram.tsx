import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

interface HistogramBucket {
  range: string;
  count: number;
}

interface Props {
  leadTimeData: HistogramBucket[];
}

const BUCKET_COLORS = ['#10B981', '#34D399', '#FBBF24', '#F59E0B', '#F97316', '#EF4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex justify-between items-center gap-4">
        <span className="text-sm text-slate-600">Issues</span>
        <span className="text-sm font-bold text-slate-800">{payload[0].value}</span>
      </div>
    </div>
  );
};

export const LeadCycleTimeHistogram: React.FC<Props> = ({ leadTimeData }) => {
  const hasData = leadTimeData.some(d => d.count > 0);
  if (!hasData) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-400">
        Sem dados de Lead Time para análise
      </div>
    );
  }

  // Find the peak bucket for highlighting
  const maxCount = Math.max(...leadTimeData.map(d => d.count));

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={leadTimeData} margin={{ top: 10, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="range" axisLine={false} tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11 }} dy={6} />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
            <Bar dataKey="count" name="Lead Time" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {leadTimeData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={BUCKET_COLORS[index] || '#94A3B8'}
                  opacity={entry.count === maxCount ? 1 : 0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary footer */}
      <div className="pt-3 mt-2 border-t border-slate-100 flex justify-between items-center text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500">Rápido (≤10d)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-500">Médio (11-20d)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-500">Lento (21+d)</span>
          </span>
        </div>
        <span className="text-slate-400 font-semibold">
          {leadTimeData.reduce((a, d) => a + d.count, 0)} issues
        </span>
      </div>
    </div>
  );
};
