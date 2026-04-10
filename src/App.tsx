import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Bar, ComposedChart, Line, BarChart
} from 'recharts';
import { 
  Users, Activity, CheckCircle2, Clock, RefreshCw, ChevronDown, 
  Bell, Calendar
} from 'lucide-react';
import { useDashboardData, excelToJSDate, formatDate } from './hooks/useDashboardData';
import TemporalDeliveryMatrix from './components/TemporalDeliveryMatrix';
import './App.css';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
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
    if (val === allLabel) {
      onChange([allLabel]);
    } else {
      let next = selected.includes(allLabel) ? [] : [...selected];
      if (next.includes(val)) next = next.filter(v => v !== val);
      else next.push(val);
      if (next.length === 0) next = [allLabel];
      onChange(next);
    }
  };

  return (
    <div style={{ position: 'relative', minWidth: '220px' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="filter-dropdown"
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', fontWeight: 600 }}>{label}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', fontSize: '0.9rem', fontWeight: 500 }}>
            {selected.includes(allLabel) ? `Todas (${options.length})` : 
             (selected.length === 1 ? selected[0] : `${selected.length} selecionados`)}
          </span>
        </div>
        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-muted)' }} />
      </button>
      
      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="premium-card" style={{ 
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50,
            maxHeight: '280px', overflowY: 'auto', padding: '0.5rem'
          }}>
            <div 
              onClick={() => { toggle(allLabel); setIsOpen(false); }}
              style={{ 
                padding: '0.6rem 0.8rem', cursor: 'pointer', borderRadius: '8px', 
                background: selected.includes(allLabel) ? 'var(--primary-light)' : 'transparent', 
                display: 'flex', alignItems: 'center', marginBottom: '4px', fontSize: '0.9rem', fontWeight: selected.includes(allLabel) ? 600 : 500,
                color: selected.includes(allLabel) ? 'var(--primary)' : 'var(--text-main)'
              }}
            >
              <div style={{ width: '16px', height: '16px', border: selected.includes(allLabel) ? 'none' : '1px solid var(--border-color)', borderRadius: '4px', marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selected.includes(allLabel) ? 'var(--primary)' : 'transparent' }}>
                {selected.includes(allLabel) && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '2px' }} />}
              </div>
              {allLabel === 'TODOS' ? 'Todos os Times' : 'Todas as Releases'}
            </div>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0', opacity: 0.5 }} />
            {options.map(opt => (
              <div 
                key={opt}
                onClick={() => toggle(opt)}
                style={{ 
                  padding: '0.6rem 0.8rem', cursor: 'pointer', borderRadius: '8px', 
                  background: selected.includes(opt) ? 'var(--primary-light)' : 'transparent', 
                  display: 'flex', alignItems: 'center', marginBottom: '2px', fontSize: '0.9rem', fontWeight: selected.includes(opt) ? 600 : 500,
                  color: selected.includes(opt) ? 'var(--primary)' : 'var(--text-main)'
                }}
              >
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
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
}> = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDisplay = () => {
    if (!startDate && !endDate) return "Todo o período";
    const startStr = startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Início';
    const endStr = endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Fim';
    return `${startDate ? startStr : ''} - ${endDate ? endStr : ''}`.replace(/^- |- $/g, '').trim() || "Todo o período";
  };

  return (
    <div style={{ position: 'relative', minWidth: '220px' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="filter-dropdown"
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', fontWeight: 600 }}>Período</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', fontSize: '0.9rem', fontWeight: 500 }}>
            {formatDisplay()}
          </span>
        </div>
        <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
      </button>
      
      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="premium-card" style={{ 
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50,
            padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Data Inicial</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => onStartDateChange(e.target.value)}
                style={{
                  padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)',
                  background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.9rem',
                  outline: 'none', fontFamily: 'inherit'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Data Final</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => onEndDateChange(e.target.value)}
                style={{
                  padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)',
                  background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.9rem',
                  outline: 'none', fontFamily: 'inherit'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button 
                onClick={() => { onStartDateChange(''); onEndDateChange(''); }}
                style={{
                  padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', 
                  border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600
                }}
              >
                Limpar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const {
    loading, chartData, weeklyPerformance, metrics,
    filteredList, teams, releases, selectedTeams, setSelectedTeams,
    selectedReleases, setSelectedReleases,
    startDate, setStartDate, endDate, setEndDate,
    temporalMatrixData
  } = useDashboardData();

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
      {/* Main Content Area */}
      <motion.main className="dashboard-content" variants={containerVariants} initial="hidden" animate="show">
        <motion.header className="header" variants={itemVariants}>
          <div className="title-section">
            <h1 style={{ letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
              Dashboard de Métricas LM
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', opacity: 0.65 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>powered by</span>
              <img src="/venice-logo.png" alt="Venice" style={{ height: '12px', objectFit: 'contain' }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <MultiSelect label="Time" options={teams} selected={selectedTeams} onChange={setSelectedTeams} allLabel="TODOS" />
              <MultiSelect label="Release" options={releases} selected={selectedReleases} onChange={setSelectedReleases} allLabel="TODAS" />
              <DateRangeFilter 
                startDate={startDate} endDate={endDate} 
                onStartDateChange={setStartDate} onEndDateChange={setEndDate} 
              />
            </div>
            
            <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }}></div>
            
            <div className="user-profile">
              <div className="notification-bell">
                <Bell size={18} />
              </div>
              <div className="avatar">JD</div>
            </div>
          </div>
        </motion.header>

        <motion.div className="metrics-grid" variants={containerVariants}>
          <motion.div className="premium-card metric-card" variants={itemVariants}>
            <div className="metric-header">
              <h3 className="metric-label">Escopo Total</h3>
              <div className="icon-wrapper icon-blue"><Users size={20} /></div>
            </div>
            <div className="metric-value">{metrics.totalItems}</div>
            <p className="metric-sub">Items na release atuante</p>
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
            <div className="metric-value">{metrics.avgCycleTime} <span style={{fontSize:'1.25rem', color:'var(--text-muted)'}}>d</span></div>
            <p className="metric-sub">Tempo médio de ciclo</p>
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
                  if (key.startsWith('Melhor Cenário')) {
                    return <Area key={key} type="monotone" dataKey={key} stroke="var(--success)" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />;
                  }
                  if (key.startsWith('Pior Cenário')) {
                    return <Area key={key} type="monotone" dataKey={key} stroke="var(--danger)" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />;
                  }
                  if (key.startsWith('Tendência Real')) {
                    return <Area key={key} type="monotone" dataKey={key} stroke="var(--warning)" strokeWidth={2.5} strokeDasharray="3 3" fill="transparent" activeDot={{ r: 5 }} />;
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
          <motion.div className="premium-card chart-section" variants={itemVariants}>
            <div className="chart-header">
              <h3 className="chart-title">Throughput Mensurado</h3>
            </div>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <ComposedChart data={weeklyPerformance} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis yAxisId="left" orientation="left" stroke="var(--text-muted)" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--warning)" tick={{fontSize: 11}} axisLine={false} tickLine={false} dx={10} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}/>
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
                        {item.Created ? formatDate(excelToJSDate(item.Created)!) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default App;
