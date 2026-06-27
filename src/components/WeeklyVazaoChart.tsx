import React from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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
 * Vazão (throughput) por período, separada do Lead Time (pedido da Michelle na reunião LM).
 * Barras empilhadas por tipo de item; eixo único. Os dados vêm de `weeklyPerformance`,
 * já calculado no hook — este componente é só apresentação, não recalcula métrica.
 */
export const WeeklyVazaoChart: React.FC<Props> = ({ data, granularityLabel = 'Semanal', height = 320 }) => (
  <motion.div className="premium-card chart-section" variants={itemVariants}>
    <div className="chart-header">
      <h3 className="chart-title">Vazão {granularityLabel}</h3>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Entregas por tipo de item</span>
    </div>
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
          <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
          <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Bar dataKey="História" stackId="a" fill="#3D6B4F" name="Histórias" />
          <Bar dataKey="Bug" stackId="a" fill="#EF4444" name="Bugs" />
          <Bar dataKey="Tarefa" stackId="a" fill="#7BB88A" name="Tarefas" />
          <Bar dataKey="Spike" stackId="a" fill="#8B5CF6" name="Spikes" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);
