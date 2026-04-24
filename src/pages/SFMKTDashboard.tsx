import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, ScatterChart, Scatter, Cell, Legend
} from 'recharts';
import {
  Clock, TrendingUp, Activity, CheckCircle2, AlertTriangle,
  Users, Zap, BarChart2
} from 'lucide-react';
import { useSFMKTData, type PeriodFilter } from '../hooks/useSFMKTData';
import type { DataQualitySummary } from '../types/sfmkt';

// ── Constants ────────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  Story: '#6366f1',
  Bug: '#ef4444',
  Task: '#64748b',
  Spike: '#f59e0b',
  'Sub-task': '#94a3b8',
};
const getTypeColor = (type: string) => TYPE_COLORS[type] || '#8b5cf6';

const item = { 
  hidden: { opacity: 0, y: 15 }, 
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring', stiffness: 280, damping: 24 } as any
  } 
};
const container = { 
  hidden: { opacity: 0 }, 
  show: { opacity: 1, transition: { staggerChildren: 0.07 } as any } 
};

// ── Reusable KPI Card ─────────────────────────────────────────────────────────
const KPICard: React.FC<{
  label: string; value: string | number; sub: string;
  icon: React.ReactNode; color: string;
}> = ({ label, value, sub, icon, color }) => (
  <motion.div variants={item} className="premium-card metric-card">
    <div className="metric-header">
      <h3 className="metric-label">{label}</h3>
      <div className={`icon-wrapper ${color}`}>{icon}</div>
    </div>
    <div className="metric-value">{value}</div>
    <p className="metric-sub">{sub}</p>
  </motion.div>
);

// ── Data Quality Gauge ────────────────────────────────────────────────────────
const DQBar: React.FC<{ label: string; pct: number; count: number; severity: 'low' | 'mid' | 'high' }> = ({ label, pct, count, severity }) => {
  const colors = { low: 'var(--warning)', mid: '#f97316', high: 'var(--danger)' };
  const bg = colors[severity];
  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: pct > 30 ? bg : 'var(--text-main)' }}>
          {count} issues ({pct}%)
        </span>
      </div>
      <div style={{ height: '6px', borderRadius: '99px', background: 'var(--border-color)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: bg, borderRadius: '99px', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
};

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '110px', height: '110px', borderRadius: '50%', border: `5px solid ${color}`, marginRight: '2rem', flexShrink: 0 }}>
      <span style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>score</span>
    </div>
  );
};

function buildDQSection(dq: DataQualitySummary) {
  return [
    { label: 'Issues "Done" sem data de resolução', pct: dq.pctDoneWithoutResolutionDate, count: dq.doneWithoutResolutionDate, severity: 'high' as const },
    { label: 'Issues "Done" sem Cycle Time rastreável', pct: dq.pctDoneWithoutCycleData, count: dq.doneWithoutCycleData, severity: 'high' as const },
    { label: 'Issues sem Assignee', pct: Math.round((dq.doneWithoutResolutionDate / Math.max(dq.totalIssues, 1)) * 100), count: dq.doneWithoutResolutionDate, severity: 'mid' as const },
    { label: 'Issues sem Sprint associada', pct: dq.pctWithoutSprint, count: dq.withoutSprint, severity: 'mid' as const },
    { label: 'Issues paradas em "To Do" há +30 dias', pct: dq.pctStaleTodo, count: dq.staleTodo, severity: 'low' as const },
    { label: 'Lead Time suspeito (>60 dias)', pct: dq.pctSuspiciouslyLongLead, count: dq.suspiciouslyLongLead, severity: 'low' as const },
  ];
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const SFMKTDashboard: React.FC = () => {
  const {
    kpis, weeklyThroughput, sprintMetrics, assigneeMetrics,
    leadTimeHistogram, leadTimeScatter, dataQuality,
    period, setPeriod, syncedAt, totalFetched,
  } = useSFMKTData();

  const syncDate = new Date(syncedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const issueTypes = [...new Set(weeklyThroughput.flatMap(w => Object.keys(w).filter(k => !['name', 'Entregues', 'Lead Time Méd'].includes(k))))];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ padding: '0 0 3rem 0' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div variants={item} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 0 4px var(--primary-light)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SFMKT · Board 2846</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Sprint Metrics</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            {totalFetched} issues · Sincronizado em {syncDate}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-color)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border-color)' }}>
          {(['60d', '120d'] as PeriodFilter[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600,
                background: period === p ? 'var(--primary)' : 'transparent',
                color: period === p ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {p === '60d' ? 'Últimos 2 meses' : '4 meses'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <motion.div className="metrics-grid" variants={container} style={{ marginBottom: '1.5rem' }}>
        <KPICard label="Throughput" value={kpis.throughput} sub={`issues entregues no período`} icon={<CheckCircle2 size={20} />} color="icon-green" />
        <KPICard label="Lead Time Médio" value={kpis.avgLeadTime !== null ? `${kpis.avgLeadTime}d` : 'N/A'} sub={`Mediana: ${kpis.medianLeadTime ?? 'N/A'}d`} icon={<Clock size={20} />} color="icon-gray" />
        <KPICard label="Cycle Time Médio" value={kpis.avgCycleTime !== null ? `${kpis.avgCycleTime}d` : 'N/A'} sub={`Mediana: ${kpis.medianCycleTime ?? 'N/A'}d`} icon={<Zap size={20} />} color="icon-blue" />
        <KPICard label="WIP Atual" value={kpis.wip} sub={`+ ${kpis.backlog} no backlog`} icon={<Activity size={20} />} color="icon-orange" />
      </motion.div>

      {/* ── Throughput semanal ───────────────────────────────────────────────── */}
      <motion.div variants={item} className="premium-card chart-section" style={{ marginBottom: '1.5rem' }}>
        <div className="chart-header">
          <h3 className="chart-title">Throughput Semanal</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Issues entregues por semana + Lead Time médio</span>
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart data={weeklyThroughput} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis yAxisId="left" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--warning)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dx={8} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '12px' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              {issueTypes.map((type, i) => (
                <Bar key={type} yAxisId="left" dataKey={type} stackId="a" fill={getTypeColor(type)}
                  radius={i === issueTypes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
              {issueTypes.length === 0 && <Bar yAxisId="left" dataKey="Entregues" stackId="a" fill="var(--primary)" radius={[4, 4, 0, 0]} />}
              <Line yAxisId="right" type="monotone" dataKey="Lead Time Méd" stroke="var(--warning)" strokeWidth={2.5} dot={{ r: 4, fill: 'white', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Lead Time Méd (d)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Histograma + Scatter ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <motion.div variants={item} className="premium-card chart-section">
          <div className="chart-header">
            <h3 className="chart-title">Distribuição Lead Time</h3>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={leadTimeHistogram} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dy={6} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '12px' }} />
                <Bar dataKey="count" name="Issues" radius={[6, 6, 0, 0]}>
                  {leadTimeHistogram.map((_, index) => (
                    <Cell key={index} fill={index < 2 ? 'var(--success)' : index < 4 ? 'var(--warning)' : 'var(--danger)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item} className="premium-card chart-section">
          <div className="chart-header">
            <h3 className="chart-title">Lead Time por Entrega</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cada ponto = 1 issue entregue</span>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" name="Data" stroke="var(--text-muted)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} dy={6} />
                <YAxis dataKey="leadTime" name="Lead Time (d)" stroke="var(--text-muted)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{d.key}</div>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px', maxWidth: '200px' }}>{d.summary}</div>
                        <div><b>Lead Time:</b> {d.leadTime}d</div>
                        {d.cycleTime && <div><b>Cycle Time:</b> {d.cycleTime}d</div>}
                        <div><b>Assignee:</b> {d.assignee}</div>
                      </div>
                    );
                  }}
                />
                <Scatter data={leadTimeScatter} fill="var(--primary)">
                  {leadTimeScatter.map((entry, i) => (
                    <Cell key={i} fill={getTypeColor(entry.type)} fillOpacity={0.75} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── Sprint Table ─────────────────────────────────────────────────────── */}
      {sprintMetrics.length > 0 && (
        <motion.div variants={item} className="premium-card" style={{ marginBottom: '1.5rem' }}>
          <div className="chart-header" style={{ padding: '1.75rem 2rem 0.75rem 2rem' }}>
            <h3 className="chart-title"><BarChart2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />Métricas por Sprint</h3>
          </div>
          <div style={{ overflowX: 'auto', padding: '0 2rem 1.75rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sprint</th><th>Estado</th><th>Throughput</th>
                  <th>Lead Time Méd</th><th>Cycle Time Méd</th><th>WIP Final</th><th>Qualidade</th>
                </tr>
              </thead>
              <tbody>
                {sprintMetrics.slice(-8).reverse().map(s => (
                  <tr key={s.sprintName}>
                    <td style={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sprintName}</td>
                    <td>
                      <span className={`badge ${s.state === 'active' ? 'badge-success' : s.state === 'future' ? 'badge-warning' : 'badge-neutral'}`}>
                        {s.state === 'active' ? 'Ativa' : s.state === 'future' ? 'Futura' : 'Fechada'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{s.throughput}</td>
                    <td>{s.avgLeadTimeDays !== null ? `${s.avgLeadTimeDays}d` : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{s.avgCycleTimeDays !== null ? `${s.avgCycleTimeDays}d` : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{s.wipAtEnd}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: s.dataQualityScore >= 70 ? 'var(--success)' : s.dataQualityScore >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                        {s.dataQualityScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── Assignee Table ───────────────────────────────────────────────────── */}
      <motion.div variants={item} className="premium-card" style={{ marginBottom: '1.5rem' }}>
        <div className="chart-header" style={{ padding: '1.75rem 2rem 0.75rem 2rem' }}>
          <h3 className="chart-title"><Users size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />Métricas por Pessoa</h3>
        </div>
        <div style={{ overflowX: 'auto', padding: '0 2rem 1.75rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Pessoa</th><th>Total</th><th>Entregues</th><th>WIP</th>
                <th>Lead Time Méd</th><th>Cycle Time Méd</th><th>Qualidade</th>
              </tr>
            </thead>
            <tbody>
              {assigneeMetrics.map(a => (
                <tr key={a.assignee}>
                  <td style={{ fontWeight: 600 }}>
                    {a.assignee === '(Sem assignee)'
                      ? <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '5px' }}><AlertTriangle size={13} />{a.assignee}</span>
                      : a.assignee
                    }
                  </td>
                  <td>{a.totalIssues}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>{a.resolvedIssues}</td>
                  <td>{a.wipIssues}</td>
                  <td>{a.avgLeadTimeDays !== null ? `${a.avgLeadTimeDays}d` : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>{a.avgCycleTimeDays !== null ? `${a.avgCycleTimeDays}d` : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: a.dataQualityScore >= 70 ? 'var(--success)' : a.dataQualityScore >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                      {a.dataQualityScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Data Quality Radar ───────────────────────────────────────────────── */}
      <motion.div variants={item} className="premium-card" style={{ marginBottom: '1.5rem' }}>
        <div className="chart-header" style={{ padding: '1.75rem 2rem 1rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} color="var(--warning)" />
            <h3 className="chart-title" style={{ margin: 0 }}>Radar de Qualidade dos Dados</h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Evidência de gaps no processo · {dataQuality.totalIssues} issues analisadas
          </span>
        </div>
        <div style={{ padding: '0 2rem 1.75rem', display: 'flex', alignItems: 'center' }}>
          <ScoreCircle score={dataQuality.overallScore} />
          <div style={{ flex: 1 }}>
            {buildDQSection(dataQuality).map(row => (
              <DQBar key={row.label} {...row} />
            ))}
          </div>
        </div>
        <div style={{ margin: '0 2rem 1.5rem', padding: '1rem 1.25rem', borderRadius: '10px', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-main)' }}>Como interpretar:</strong> Estes números <em>não são críticas ao time</em> — são oportunidades de processo.
            Issues "Done" sem data de resolução indicam fechamentos diretos sem transição de status, o que impossibilita calcular Lead Time.
            Issues sem sprint associada ficam invisíveis na velocity. O score geral reflete o quanto as métricas acima são confiáveis.
          </p>
        </div>
      </motion.div>

      {/* ── TrendingUp indicators ────────────────────────────────────────────── */}
      <motion.div variants={item} style={{ display: 'flex', gap: '1rem' }}>
        <div className="premium-card" style={{ flex: 1, padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={15} color="var(--primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Como melhorar os dados</span>
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 1.2rem', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <li>Ao concluir uma issue, sempre mova para o status <strong>"Done"</strong> pelo board — nunca edite direto</li>
            <li>Toda issue deve ter um <strong>Assignee</strong> ao entrar em Sprint</li>
            <li>Associe a sprint antes de começar a trabalhar na issue</li>
            <li>Evite fechar issues diretamente da coluna "To Do" — isso apaga o Cycle Time</li>
          </ul>
        </div>
      </motion.div>

    </motion.div>
  );
};

export default SFMKTDashboard;
