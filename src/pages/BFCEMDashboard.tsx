import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Bar, ComposedChart, Line, BarChart, Legend
} from 'recharts';
import {
  Users, Activity, CheckCircle2, Clock, ChevronDown, Calendar, BarChart2, ShoppingCart
} from 'lucide-react';
import { useDashboardData, excelToJSDate, formatDate } from '../hooks/useDashboardData';
import TemporalDeliveryMatrix from '../components/TemporalDeliveryMatrix';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const MultiSelect: React.FC<{
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  allLabel: string;
}> = ({ label, options, selected, onChange, allLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = (val: string) => {
    if (val === allLabel) { onChange([allLabel]); return; }
    let next = selected.includes(allLabel) ? [] : [...selected];
    if (next.includes(val)) next = next.filter(v => v !== val);
    else next.push(val);
    if (next.length === 0) next = [allLabel];
    onChange(next);
  };
  return (
    <div style={{ position: 'relative', minWidth: '200px' }}>
      <button onClick={() => setIsOpen(!isOpen)} className="filter-dropdown">
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', fontWeight: 600 }}>{label}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem', fontWeight: 500 }}>
            {selected.includes(allLabel) ? `Todas (${options.length})` : selected.length === 1 ? selected[0] : `${selected.length} selecionados`}
          </span>
        </div>
        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-muted)' }} />
      </button>
      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="premium-card" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50, maxHeight: '280px', overflowY: 'auto', padding: '0.5rem' }}>
            <div onClick={() => { toggle(allLabel); setIsOpen(false); }} style={{ padding: '0.6rem 0.8rem', cursor: 'pointer', borderRadius: '8px', background: selected.includes(allLabel) ? 'var(--primary-light)' : 'transparent', display: 'flex', alignItems: 'center', marginBottom: '4px', fontSize: '0.9rem', fontWeight: selected.includes(allLabel) ? 600 : 500, color: selected.includes(allLabel) ? 'var(--primary)' : 'var(--text-main)' }}>
              <div style={{ width: '16px', height: '16px', border: selected.includes(allLabel) ? 'none' : '1px solid var(--border-color)', borderRadius: '4px', marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selected.includes(allLabel) ? 'var(--primary)' : 'transparent' }}>
                {selected.includes(allLabel) && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '2px' }} />}
              </div>
              {allLabel === 'TODOS' ? 'Todos os Times' : 'Todas as Releases'}
            </div>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0', opacity: 0.5 }} />
            {options.map(opt => (
              <div key={opt} onClick={() => toggle(opt)} style={{ padding: '0.6rem 0.8rem', cursor: 'pointer', borderRadius: '8px', background: selected.includes(opt) ? 'var(--primary-light)' : 'transparent', display: 'flex', alignItems: 'center', marginBottom: '2px', fontSize: '0.9rem', fontWeight: selected.includes(opt) ? 600 : 500, color: selected.includes(opt) ? 'var(--primary)' : 'var(--text-main)' }}>
                <div style={{ width: '16px', height: '16px', border: selected.includes(opt) ? 'none' : '1px solid var(--border-color)', borderRadius: '4px', marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selected.includes(opt) ? 'var(--primary)' : 'transparent' }}>
                  {selected.includes(opt) && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '2px' }} />}
                </div>
                {opt}
              </div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};

const DateRangeFilter: React.FC<{
  startDate: string; endDate: string;
  onStartDateChange: (v: string) => void; onEndDateChange: (v: string) => void;
}> = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const formatDisplay = () => {
    if (!startDate && !endDate) return "Todo o período";
    const s = startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Início';
    const e = endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Fim';
    return `${startDate ? s : ''} - ${endDate ? e : ''}`.replace(/^- |- $/g, '').trim() || "Todo o período";
  };
  return (
    <div style={{ position: 'relative', minWidth: '200px' }}>
      <button onClick={() => setIsOpen(!isOpen)} className="filter-dropdown">
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', fontWeight: 600 }}>Período</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem', fontWeight: 500 }}>{formatDisplay()}</span>
        </div>
        <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
      </button>
      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="premium-card" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Data Inicial</label>
              <input type="date" value={startDate} onChange={e => onStartDateChange(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Data Final</label>
              <input type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button onClick={() => { onStartDateChange(''); onEndDateChange(''); }} style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Limpar</button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

const BFCEMDashboard: React.FC = () => {
  const navigate = useNavigate();

  const {
    chartData, weeklyPerformance, metrics,
    filteredList, teams, releases,
    selectedTeams, setSelectedTeams,
    selectedReleases, setSelectedReleases,
    startDate, setStartDate, endDate, setEndDate,
    temporalMatrixData
  } = useDashboardData('bf-cem');

  const releaseBadgeColor: Record<string, string> = {
    'BAF': '#8b5cf6',
    'BAF-QW': '#a78bfa',
    'CEM': '#06b6d4',
  };

  return (
    <motion.main className="dashboard-content" variants={containerVariants} initial="hidden" animate="show">
      <motion.header className="header" variants={itemVariants}>
        <div className="title-section">
          <h1 style={{ letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            Dashboard de Métricas LM
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', opacity: 0.65 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>powered by</span>
            <img src="/venice-logo.png" alt="Venice" style={{ height: '12px', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-color)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border-color)', width: 'fit-content' }}>
            <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, background: 'transparent', color: 'var(--text-muted)', transition: 'all 0.2s' }}>
              <Users size={13} /> Locavia Principal
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, background: 'var(--primary)', color: 'white', transition: 'all 0.2s' }}>
              <ShoppingCart size={13} /> BF / CEM
            </button>
            <button onClick={() => navigate('/metrics_sfmkt')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, background: 'transparent', color: 'var(--text-muted)', transition: 'all 0.2s' }}>
              <BarChart2 size={13} /> SFMKT Sprint
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <MultiSelect label="Time" options={teams} selected={selectedTeams} onChange={setSelectedTeams} allLabel="TODOS" />
            <MultiSelect label="Release" options={releases} selected={selectedReleases} onChange={setSelectedReleases} allLabel="TODAS" />
            <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
          </div>
          <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }} />
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['BAF', 'BAF-QW', 'CEM'] as const).map(r => (
              <span key={r} style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: releaseBadgeColor[r] + '22', color: releaseBadgeColor[r], border: `1px solid ${releaseBadgeColor[r]}44` }}>
                {r}
              </span>
            ))}
          </div>
        </div>
      </motion.header>

      {/* KPI Cards */}
      <motion.div className="metrics-grid" variants={containerVariants}>
        <motion.div className="premium-card metric-card" variants={itemVariants}>
          <div className="metric-header">
            <h3 className="metric-label">Escopo Total</h3>
            <div className="icon-wrapper icon-blue"><Users size={20} /></div>
          </div>
          <div className="metric-value">{metrics.totalItems}</div>
          <p className="metric-sub">Itens BAF + CEM no cone</p>
        </motion.div>

        <motion.div className="premium-card metric-card" variants={itemVariants}>
          <div className="metric-header">
            <h3 className="metric-label">Entregas</h3>
            <div className="icon-wrapper icon-green"><CheckCircle2 size={20} /></div>
          </div>
          <div className="metric-value">{metrics.deliveredCount}</div>
          <p className="metric-sub">Produtividade liquidada</p>
        </motion.div>

        <motion.div className="premium-card metric-card" variants={itemVariants}>
          <div className="metric-header">
            <h3 className="metric-label">WIP (A Fazer)</h3>
            <div className="icon-wrapper icon-orange"><Activity size={20} /></div>
          </div>
          <div className="metric-value">{metrics.wipCount}</div>
          <p className="metric-sub">Sendo desenvolvidos</p>
        </motion.div>

        <motion.div className="premium-card metric-card" variants={itemVariants}>
          <div className="metric-header">
            <h3 className="metric-label">Lead Time</h3>
            <div className="icon-wrapper icon-gray"><Clock size={20} /></div>
          </div>
          <div className="metric-value">{metrics.avgCycleTime} <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>d</span></div>
          <p className="metric-sub">Tempo médio de ciclo</p>
        </motion.div>
      </motion.div>

      {/* Burndown */}
      <motion.div className="premium-card chart-section" variants={itemVariants} style={{ marginBottom: '1.5rem' }}>
        <div className="chart-header">
          <h3 className="chart-title">Burndown & Projeção — BF / CEM</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} /> Realizado</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' }} /> Tendência</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} /> Melhor Caso</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }} /> Pior Caso</span>
          </div>
        </div>
        <div style={{ width: '100%', height: 380 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRealBF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12, fontWeight: 500 }} dy={10} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', padding: '12px' }} itemStyle={{ fontSize: '13px', fontWeight: 600, padding: '2px 0' }} labelStyle={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }} />
              <Area type="monotone" dataKey="A Fazer (Real)" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRealBF)" activeDot={{ r: 6, strokeWidth: 0 }} />
              {Object.keys(chartData?.[chartData.length - 1] || {}).map(key => {
                if (key.startsWith('Melhor Caso')) return <Area key={key} type="monotone" dataKey={key} stroke="var(--success)" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />;
                if (key.startsWith('Pior Caso')) return <Area key={key} type="monotone" dataKey={key} stroke="var(--danger)" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />;
                if (key.startsWith('Tendência')) return <Area key={key} type="monotone" dataKey={key} stroke="var(--warning)" strokeWidth={2.5} strokeDasharray="3 3" fill="transparent" activeDot={{ r: 5 }} />;
                return null;
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Temporal Matrix */}
      <motion.div variants={itemVariants}>
        <TemporalDeliveryMatrix data={temporalMatrixData} />
      </motion.div>

      {/* Throughput + Flow Balance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <motion.div className="premium-card chart-section" variants={itemVariants}>
          <div className="chart-header">
            <h3 className="chart-title">Throughput Mensurado</h3>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={weeklyPerformance} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis yAxisId="left" orientation="left" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--warning)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dx={10} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="História" stackId="a" fill="#3b82f6" name="Histórias" />
                <Bar yAxisId="left" dataKey="Bug" stackId="a" fill="#ef4444" name="Bugs" />
                <Bar yAxisId="left" dataKey="Tarefa" stackId="a" fill="#9ca3af" name="Tarefas" />
                <Bar yAxisId="left" dataKey="Spike" stackId="a" fill="#f59e0b" name="Spikes" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="Lead Time (Méd)" stroke="var(--warning)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="premium-card chart-section" variants={itemVariants} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-header">
            <h3 className="chart-title">Balanço do Fluxo (Delta)</h3>
          </div>
          <div style={{ flex: 1, minHeight: 180 }}>
            <ResponsiveContainer>
              <BarChart data={weeklyPerformance.slice(-5)} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} dy={8} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }} cursor={{ fill: 'var(--bg-color)' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                <Bar dataKey="Entradas" fill="var(--text-muted)" name="Demandas Criadas" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="Saídas" fill="var(--success)" name="Entregas Feitas" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Saldo (Semana Atual):</span>
            <span style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', color: (weeklyPerformance?.[weeklyPerformance.length - 1]?.Saldo || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {(weeklyPerformance?.[weeklyPerformance.length - 1]?.Saldo || 0) > 0 ? '+' : ''}{weeklyPerformance?.[weeklyPerformance.length - 1]?.Saldo || 0}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Recent Items Table */}
      <motion.div className="premium-card" variants={itemVariants} style={{ marginTop: '1.5rem' }}>
        <div className="chart-header" style={{ padding: '1.75rem 2rem 0 2rem', borderBottom: 'none' }}>
          <h3 className="chart-title">Backlog BF / CEM Recente</h3>
        </div>
        <div style={{ overflowX: 'auto', padding: '0 2rem 1.75rem 2rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Issue ID</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Release</th>
                <th>D. Criação</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.slice(0, 8).map(item => {
                const isDone = item.Status.includes('DONE') || item.Status.includes('CONCLUIDO');
                const badgeColor = releaseBadgeColor[item.Release] ?? 'var(--text-muted)';
                return (
                  <tr key={item.Key}>
                    <td className="detail-key">{item.Key}</td>
                    <td><span className="badge badge-neutral">{item.Type}</span></td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{item.Summary as string}</td>
                    <td><span className={`badge ${isDone ? 'badge-success' : 'badge-warning'}`}>{item.Status}</span></td>
                    <td><span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: badgeColor + '22', color: badgeColor, border: `1px solid ${badgeColor}44` }}>{item.Release}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{item.Created ? formatDate(excelToJSDate(item.Created)!) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.main>
  );
};

export default BFCEMDashboard;
