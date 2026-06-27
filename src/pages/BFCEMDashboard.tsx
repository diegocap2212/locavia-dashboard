import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Bar, BarChart, Legend
} from 'recharts';
import {
  Users, Activity, CheckCircle2, Clock, ShoppingCart, UserCircle, Download
} from 'lucide-react';
import { useDashboardData, excelToJSDate, formatDate } from '../hooks/useDashboardData';
import TemporalDeliveryMatrix from '../components/TemporalDeliveryMatrix';
import { MetricCommentEditor } from '../components/MetricCommentEditor';
import { MultiSelect } from '../components/MultiSelect';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { WeeklyVazaoChart } from '../components/WeeklyVazaoChart';
import { WeeklyLeadTimeChart } from '../components/WeeklyLeadTimeChart';
import { SM_CONFIGS } from '../config/sm-config';
import { getComments, exportComments } from '../services/commentsService';
import { getQuinzenas, getAutomaticActiveQuinzena, getQuinzenaById } from '../config/quinzenas';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

type ActiveView = 'locavia' | 'bf-cem' | 'sm-gabriela' | 'sm-rafael' | 'sm-ed';

const BFCEMDashboard: React.FC = () => {
  const navigate = useNavigate();

  const {
    chartData, weeklyPerformance, metrics,
    filteredList, teams, releases,
    selectedTeams, setSelectedTeams,
    selectedReleases, setSelectedReleases,
    startDate, setStartDate, endDate, setEndDate,
    temporalMatrixData,
    loading
  } = useDashboardData('bf-cem');

  const releaseBadgeColor: Record<string, string> = {
    'BAF': '#8b5cf6',
    'BAF-QW': '#a78bfa',
    'CEM': '#06b6d4',
  };

  const [selectedQuinzenaId, setSelectedQuinzenaId] = useState<string>(() => getAutomaticActiveQuinzena());

  useEffect(() => {
    if (selectedQuinzenaId !== 'CUSTOM') {
      const q = getQuinzenaById(selectedQuinzenaId);
      if (q) {
        setStartDate(q.startDate);
        setEndDate(q.endDate);
      }
    }
  }, [selectedQuinzenaId, setStartDate, setEndDate]);

  const activeSquadId = selectedTeams.includes('TODOS') ? 'bf-cem' : selectedTeams.slice().sort().join(',');
  const activeReleaseId = selectedReleases.includes('TODAS') ? 'ALL' : selectedReleases.slice().sort().join(',');

  const handleTabChange = (view: ActiveView) => {
    if (view === 'locavia') navigate('/');
    else if (view === 'bf-cem') navigate('/cone-bf-cem');
    else navigate(`/sm/${view.replace('sm-', '')}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p className="text-slate-600 font-medium">Carregando métricas...</p>
        </div>
      </div>
    );
  }

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
          {/* Unified Navigation Tabs */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>Consolidado</span>
              <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-color)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
                <button onClick={() => handleTabChange('locavia')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: 'transparent', color: 'var(--text-muted)', transition: 'all 0.15s' }}>
                  <Users size={12} /> Principal
                </button>
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: 'var(--primary)', color: 'white', transition: 'all 0.15s' }}>
                  <ShoppingCart size={12} /> BF / CEM
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>Agilistas / SMs</span>
              <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-color)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
                {SM_CONFIGS.map(c => (
                  <button key={c.id} onClick={() => handleTabChange(`sm-${c.id}` as ActiveView)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: 'transparent', color: 'var(--text-muted)', transition: 'all 0.15s' }}>
                    <UserCircle size={12} /> {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '220px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', fontWeight: 600 }}>Quinzena</span>
              <select
                value={selectedQuinzenaId}
                onChange={e => setSelectedQuinzenaId(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  width: '100%'
                }}
              >
                <option value="CUSTOM">Período Customizado</option>
                {getQuinzenas().map(q => (
                  <option key={q.id} value={q.id}>{q.label}</option>
                ))}
              </select>
            </div>
            <MultiSelect label="Time" options={teams} selected={selectedTeams} onChange={setSelectedTeams} allLabel="TODOS" />
            <MultiSelect label="Release" options={releases} selected={selectedReleases} onChange={setSelectedReleases} allLabel="TODAS" />
            {selectedQuinzenaId === 'CUSTOM' && (
              <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
            )}
          </div>

          <button
            onClick={async () => exportComments(await getComments())}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
          >
            <Download size={13} /> Exportar Análises
          </button>

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
          <p className="metric-sub">Itens no escopo ativo</p>
        </motion.div>

        <motion.div className="premium-card metric-card" variants={itemVariants}>
          <div className="metric-header">
            <h3 className="metric-label">Entregas</h3>
            <div className="icon-wrapper icon-green"><CheckCircle2 size={20} /></div>
          </div>
          <div className="metric-value">{metrics.deliveredCount}</div>
          <p className="metric-sub">Concluídas no período</p>
        </motion.div>

        <motion.div className="premium-card metric-card" variants={itemVariants}>
          <div className="metric-header">
            <h3 className="metric-label">WIP (A Fazer)</h3>
            <div className="icon-wrapper icon-orange"><Activity size={20} /></div>
          </div>
          <div className="metric-value">{metrics.wipCount}</div>
          <p className="metric-sub">Em desenvolvimento</p>
        </motion.div>

        <motion.div className="premium-card metric-card" variants={itemVariants}>
          <div className="metric-header">
            <h3 className="metric-label">Lead Time</h3>
            <div className="icon-wrapper icon-gray"><Clock size={20} /></div>
          </div>
          <div className="metric-value">{metrics.avgLeadTime} <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>d</span></div>
          <p className="metric-sub">Tempo médio (Criado → Resolvido)</p>
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }} /> Vel. Necessária</span>
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
                if (key.startsWith('Velocidade Necessária')) return <Area key={key} type="monotone" dataKey={key} stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />;
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
        <WeeklyVazaoChart data={weeklyPerformance} />

        <motion.div className="premium-card chart-section" variants={itemVariants} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-header">
            <h3 className="chart-title">Fluxo de Entrada vs Saída</h3>
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

      {/* Lead Time (separado da Vazão) */}
      <div style={{ marginTop: '1.5rem' }}>
        <WeeklyLeadTimeChart data={weeklyPerformance} height={280} />
      </div>

      {/* Comentários Qualitativos */}
      <div style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--primary)' }}>💬</span> Análises e Planos de Ação (Agilistas)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <MetricCommentEditor 
            squadId={activeSquadId} 
            releaseId={activeReleaseId} 
            quinzenaId={selectedQuinzenaId}
            key={`vazao-${activeSquadId}-${activeReleaseId}-${selectedQuinzenaId}`}
            metricId="vazao"
            metricLabel="Throughput"
          />
          <MetricCommentEditor 
            squadId={activeSquadId} 
            releaseId={activeReleaseId} 
            quinzenaId={selectedQuinzenaId}
            key={`leadTime-${activeSquadId}-${activeReleaseId}-${selectedQuinzenaId}`}
            metricId="leadTime"
            metricLabel="Lead Time"
          />
          <MetricCommentEditor 
            squadId={activeSquadId} 
            releaseId={activeReleaseId} 
            quinzenaId={selectedQuinzenaId}
            key={`flowBalance-${activeSquadId}-${activeReleaseId}-${selectedQuinzenaId}`}
            metricId="flowBalance"
            metricLabel="Balanço do Fluxo"
          />
        </div>
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
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{(() => { const d = excelToJSDate(item.Created); return d ? formatDate(d) : '-'; })()}</td>
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
