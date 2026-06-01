import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DataItem {
  name: string;
  value: number;
  color: string;
}

interface Props {
  data: DataItem[];
}

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null; // Don't render labels for tiny slices
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, color } = payload[0].payload;
  return (
    <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ background: color }} />
        <span className="text-sm font-bold text-slate-800">{name}</span>
      </div>
      <p className="text-sm text-slate-600 mt-1">{value} entregas</p>
    </div>
  );
};

export const IssueTypeDonut: React.FC<Props> = ({ data }) => {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const [hovered, setHovered] = useState<string | null>(null);

  if (data.length === 0 || total === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-400">
        Nenhuma entrega no período
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="78%"
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
              strokeWidth={0}
              onMouseEnter={(_, index) => setHovered(data[index].name)}
              onMouseLeave={() => setHovered(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={hovered === null || hovered === entry.name ? 1 : 0.4}
                  style={{ transition: 'opacity 0.2s ease', cursor: 'pointer' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center stat */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-extrabold text-slate-800 tracking-tight">{total}</div>
            <div className="text-xs text-slate-400 font-semibold">entregas</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-2">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-1.5 cursor-pointer"
            onMouseEnter={() => setHovered(item.name)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
            <span className="text-xs text-slate-500 font-medium">{item.name}</span>
            <span className="text-xs text-slate-700 font-bold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
