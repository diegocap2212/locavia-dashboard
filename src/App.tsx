import React, { lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Bar, BarChart
} from 'recharts';
import {
  Users, Activity, CheckCircle2, Clock, RefreshCw,
  UserCircle, ShoppingCart, Download
} from 'lucide-react';
import { useDashboardData, excelToJSDate, formatDate } from './hooks/useDashboardData';
import TemporalDeliveryMatrix from './components/TemporalDeliveryMatrix';
import { SMDashboard } from './pages/SMDashboard';
import { SM_CONFIGS } from './config/sm-config';
import { MultiSelect } from './components/MultiSelect';
import { DateRangeFilter } from './components/DateRangeFilter';
import { WeeklyVazaoChart } from './components/WeeklyVazaoChart';
import { WeeklyLeadTimeChart } from './components/WeeklyLeadTimeChart';
import { getComments, exportComments } from './services/commentsService';
import './App.css';

const BFCEMDashboard = lazy(() => import('./pages/BFCEMDashboard'));
// (Feature de apresentação removida — deck executivo descontinuado.)
type ActiveView = 'locavia' | 'bf-cem' | 'sm-gabriela' | 'sm-rafael' | 'sm-ed';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

/* ──────────────────────────────────────────────
   Shared Navigation Header — used by all views
   ────────────────────────────────────────────── */
const NavigationHeader: React.FC<{
  activeView: ActiveView;
  onTabChange: (view: ActiveView) => void;
  rightSlot?: React.ReactNode;
}> = ({ activeView, onTabChange, rightSlot }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', marginBottom: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.65 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>powered by</span>
        <img src="/venice-logo.png" alt="Venice" style={{ height: '12px', objectFit: 'contain' }} />
      </div>
      {rightSlot}
    </div>
    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>Consolidado</span>
        <div style={{ display: 'flex', gap: '0.25rem', background: 'white', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
          <button onClick={() => onTabChange('locavia')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: activeView === 'locavia' ? 'var(--primary)' : 'transparent', color: activeView === 'locavia' ? 'white' : 'var(--text-muted)', transition: 'all 0.15s' }}>
            <Users size={12} /> Principal
          </button>
          <button onClick={() => onTabChange('bf-cem')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: activeView === 'bf-cem' ? 'var(--primary)' : 'transparent', color: activeView === 'bf-cem' ? 'white' : 'var(--text-muted)', transition: 'all 0.15s' }}>
            <ShoppingCart size={12} /> BF / CEM
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>Agilistas / SMs</span>
        <div style={{ display: 'flex', gap: '0.25rem', background: 'white', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
          {SM_CONFIGS.map(c => (
            <button
              key={c.id}
              onClick={() => onTabChange(`sm-${c.id}` as ActiveView)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 600,
                background: activeView === `sm-${c.id}` ? 'var(--primary)' : 'transparent',
                color: activeView === `sm-${c.id}` ? 'white' : 'var(--text-muted)',
                transition: 'all 0.15s'
              }}
            >
              <UserCircle size={12} /> {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ──────────────────────────────────────────
   SM Dashboard Wrapper
   ────────────────────────────────────────── */
const SMDashboardWrapper = () => {
  const { smId } = useParams();
  const navigate = useNavigate();
  const config = SM_CONFIGS.find(c => c.id === smId);

  if (!config) {
    return <div className="p-8 text-center bg-slate-50 min-h-screen">SM não encontrado</div>;
  }

  const activeView: ActiveView = `sm-${smId}` as ActiveView;

  const handleTabChange = (view: ActiveView) => {
    if (view === 'locavia') navigate('/');
    else if (view === 'bf-cem') navigate('/cone-bf-cem');
    else navigate(`/sm/${view.replace('sm-', '')}`);
  };

  return (
    <div className="dashboard-content">
      <div style={{ padding: '1.5rem 0 0', backgroundColor: '#f8fafc' }}>
        <NavigationHeader
          activeView={activeView}
          onTabChange={handleTabChange}
          rightSlot={
            <>
              <button
                onClick={async () => exportComments(await getComments())}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
              >
                <Download size={13} /> Exportar Análises
              </button>
            </>
          }
        />
        <SMDashboard smConfig={config} />
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────
   Main App
   ────────────────────────────────────────── */
const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeView: ActiveView =
    location.pathname.startsWith('/sm/gabriela') ? 'sm-gabriela' :
    location.pathname.startsWith('/sm/rafael') ? 'sm-rafael' :
    location.pathname.startsWith('/sm/ed') ? 'sm-ed' :
    location.pathname === '/cone-bf-cem' ? 'bf-cem' : 'locavia';

  const {
    loading, chartData, weeklyPerformance, metrics,
    filteredList, teams, releases, selectedTeams, setSelectedTeams,
    selectedReleases, setSelectedReleases,
    startDate, setStartDate, endDate, setEndDate,
    temporalMatrixData
  } = useDashboardData('locavia');

  const handleTabChange = (view: ActiveView) => {
    if (view === 'bf-cem') navigate('/cone-bf-cem');
    else if (view.startsWith('sm-')) navigate(`/sm/${view.replace('sm-', '')}`);
    else navigate('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', background: 'var(--bg-color)' }}>
        <RefreshCw className="animate-spin" size={40} color="var(--primary)" />
        <p style={{ color: 'var(--text-main)', fontWeight: 600 }}>Carregando Workspace...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Routes>
        <Route path="/sm/:smId" element={<SMDashboardWrapper />} />

        <Route path="/cone-bf-cem" element={
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><RefreshCw className="animate-spin" size={32} color="var(--primary)" /></div>}>
            <div className="dashboard-wrapper">
              <BFCEMDashboard />
            </div>
          </Suspense>
        } />

        <Route path="*" element={
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
            {/* View Tabs */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>Consolidado</span>
                <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-color)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => handleTabChange('locavia')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: activeView === 'locavia' ? 'var(--primary)' : 'transparent', color: activeView === 'locavia' ? 'white' : 'var(--text-muted)', transition: 'all 0.15s' }}
                  >
                    <Users size={12} /> Principal
                  </button>
                  <button
                    onClick={() => handleTabChange('bf-cem')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: activeView === 'bf-cem' ? 'var(--primary)' : 'transparent', color: activeView === 'bf-cem' ? 'white' : 'var(--text-muted)', transition: 'all 0.15s' }}
                  >
                    <ShoppingCart size={12} /> BF / CEM
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>Agilistas / SMs</span>
                <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-color)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
                  {SM_CONFIGS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleTabChange(`sm-${c.id}` as ActiveView)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: activeView === `sm-${c.id}` ? 'var(--primary)' : 'transparent', color: activeView === `sm-${c.id}` ? 'white' : 'var(--text-muted)', transition: 'all 0.15s' }}
                    >
                      <UserCircle size={12} /> {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {activeView === 'locavia' && <div style={{ display: 'flex', gap: '1rem' }}>
              <MultiSelect label="Time" options={teams} selected={selectedTeams} onChange={setSelectedTeams} allLabel="TODOS" />
              <MultiSelect label="Release" options={releases} selected={selectedReleases} onChange={setSelectedReleases} allLabel="TODAS" />
              <DateRangeFilter
                startDate={startDate} endDate={endDate}
                onStartDateChange={setStartDate} onEndDateChange={setEndDate}
              />
            </div>}
          </div>
        </motion.header>

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
            <div className="metric-value">{metrics.avgLeadTime} <span style={{fontSize:'1.25rem', color:'var(--text-muted)'}}>d</span></div>
            <p className="metric-sub">Tempo médio (Criado → Resolvido)</p>
          </motion.div>
        </motion.div>

        <motion.div className="premium-card chart-section" variants={itemVariants} style={{ marginBottom: '1.5rem' }}>
          <div className="chart-header">
            <h3 className="chart-title">Burndown & Projeção do Cone</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div> Realizado</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' }}></div> Tendência</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div> Melhor Caso</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }}></div> Pior Caso</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }}></div> Vel. Necessária</span>
            </div>
          </div>
          <div style={{ width: '100%', height: 380 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fontSize: 12, fontWeight: 500}} dy={10} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{fontSize: 12, fontWeight: 500}} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', padding: '12px' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 600, padding: '2px 0' }}
                  labelStyle={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="A Fazer (Real)" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorReal)" activeDot={{ r: 6, strokeWidth: 0 }} />
                {Object.keys(chartData?.[chartData.length-1] || {}).map(key => {
                  if (key.startsWith('Melhor Caso')) {
                    return <Area key={key} type="monotone" dataKey={key} stroke="var(--success)" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />;
                  }
                  if (key.startsWith('Pior Caso')) {
                    return <Area key={key} type="monotone" dataKey={key} stroke="var(--danger)" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />;
                  }
                  if (key.startsWith('Tendência')) {
                    return <Area key={key} type="monotone" dataKey={key} stroke="var(--warning)" strokeWidth={2.5} strokeDasharray="3 3" fill="transparent" activeDot={{ r: 5 }} />;
                  }
                  if (key.startsWith('Velocidade Necessária')) {
                    return <Area key={key} type="monotone" dataKey={key} stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />;
                  }
                  return null;
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </motion.div>

        <motion.div variants={itemVariants}>
          <TemporalDeliveryMatrix data={temporalMatrixData} />
        </motion.div>

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
                  <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fontSize: 10}} axisLine={false} tickLine={false} dy={8} />
                  <YAxis stroke="var(--text-muted)" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }} cursor={{fill: 'var(--bg-color)'}} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                  <Bar dataKey="Entradas" fill="var(--text-muted)" name="Demandas Criadas" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="Saídas" fill="var(--success)" name="Entregas Feitas" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Saldo (Semana Atual):</span>
              <span style={{
                fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em',
                color: (weeklyPerformance?.[weeklyPerformance.length-1]?.Saldo || 0) > 0 ? 'var(--danger)' : 'var(--success)'
              }}>
                {(weeklyPerformance?.[weeklyPerformance.length-1]?.Saldo || 0) > 0 ? '+' : ''}{weeklyPerformance?.[weeklyPerformance.length-1]?.Saldo || 0}
              </span>
            </div>
          </motion.div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <WeeklyLeadTimeChart data={weeklyPerformance} height={280} />
        </div>

        <motion.div className="premium-card" variants={itemVariants} style={{ marginTop: '1.5rem' }}>
          <div className="chart-header" style={{ padding: '1.75rem 2rem 0 2rem', borderBottom: 'none' }}>
            <h3 className="chart-title">Backlog Recente</h3>
          </div>
          <div style={{ overflowX: 'auto', padding: '0 2rem 1.75rem 2rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Issue ID</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>D. Criação</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.slice(0, 8).map((item) => {
                  const isDone = item.Status.includes('DONE') || item.Status.includes('CONCLUIDO');
                  return (
                    <tr key={item.Key}>
                      <td className="detail-key">{item.Key}</td>
                      <td>
                        <span className="badge badge-neutral">{item.Type}</span>
                      </td>
                      <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                        {item.Summary as string}
                      </td>
                      <td>
                        <span className={`badge ${isDone ? 'badge-success' : 'badge-warning'}`}>
                          {item.Status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                        {(() => { const d = excelToJSDate(item.Created); return d ? formatDate(d) : '-'; })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
          </motion.main>
        } />
      </Routes>
    </div>
  );
};

export default App;
