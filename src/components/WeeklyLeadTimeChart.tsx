import React from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import type { WeeklyPerformancePoint } from '../hooks/useDashboardData';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

interface Props {
  data: WeeklyPerformancePoint[];
  /** Rótulo do bucket de tempo (ex.: "Semanal", "Quinzenal", "Mensal"). Default: "Semanal". */
  granularityLabel?: string;
  height?: number;
}

/**
 * Lead Time médio por período, em gráfico próprio (separado da Vazão — pedido da reunião LM).
 * `Lead Time (Méd)` já vem calculado em `weeklyPerformance`; aqui só apresentamos a tendência.
 */
export const WeeklyLeadTimeChart: React.FC<Props> = ({ data, granularityLabel = 'Semanal', height = 320 }) => (
  <motion.div className="premium-card chart-section" variants={itemVariants}>
    <div className="chart-header">
      <h3 className="chart-title">Lead Time {granularityLabel}</h3>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tempo médio Criado → Resolvido (dias)</span>
    </div>
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLeadTime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--warning)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
          <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
          <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="d" />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}
            formatter={(value) => [`${value} d`, 'Lead Time (Méd)']}
          />
          <Area
            type="monotone"
            dataKey="Lead Time (Méd)"
            stroke="var(--warning)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorLeadTime)"
            dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);
