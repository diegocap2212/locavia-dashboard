import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Bar, ComposedChart, Line, BarChart
} from 'recharts';
import { 
  Users, Activity, CheckCircle2, Clock, RefreshCw, ChevronDown
} from 'lucide-react';
import { useDashboardData, excelToJSDate, formatDate } from './hooks/useDashboardData';
import './App.css';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
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
      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="glass-card"
        style={{ 
          width: '100%', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', 
          alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)', border: '1px solid var(--border-color)',
          borderRadius: '12px', fontWeight: 500
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
          {selected.includes(allLabel) ? `Todas (${options.length})` : 
           (selected.length === 1 ? selected[0] : `${selected.length} selecionados`)}
        </span>
        <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-muted)' }} />
      </button>
      
      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass-card" style={{ 
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50,
            maxHeight: '280px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(255,255,255,0.98)',
            borderRadius: '16px', boxShadow: 'var(--shadow-md)'
          }}>
            <div 
              onClick={() => { toggle(allLabel); setIsOpen(false); }}
              style={{ 
                padding: '0.6rem 0.8rem', cursor: 'pointer', borderRadius: '8px', 
                background: selected.includes(allLabel) ? 'rgba(59, 130, 246, 0.08)' : 'transparent', 
                display: 'flex', alignItems: 'center', marginBottom: '4px', fontSize: '0.9rem', fontWeight: selected.includes(allLabel) ? 600 : 400,
                color: selected.includes(allLabel) ? 'var(--primary)' : 'var(--text-main)'
              }}
            >
              <div style={{ 
                width: '16px', height: '16px', border: selected.includes(allLabel) ? 'none' : '1.5px solid var(--border-color)', borderRadius: '4px', 
                marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: selected.includes(allLabel) ? 'var(--primary)' : 'transparent'
              }}>
                {selected.includes(allLabel) && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '2px' }} />}
              </div>
              {allLabel === 'TODOS' ? 'Todos os Times' : 'Todas as Releases'}
            </div>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '6px 0', opacity: 0.5 }} />
            {options.map(opt => (
              <div 
                key={opt}
                onClick={() => toggle(opt)}
                style={{ 
                  padding: '0.6rem 0.8rem', cursor: 'pointer', borderRadius: '8px', 
                  background: selected.includes(opt) ? 'rgba(59, 130, 246, 0.08)' : 'transparent', 
                  display: 'flex', alignItems: 'center', marginBottom: '2px', fontSize: '0.9rem', fontWeight: selected.includes(opt) ? 600 : 400,
                  color: selected.includes(opt) ? 'var(--primary)' : 'var(--text-main)', transition: 'background 0.2s'
                }}
              >
                <div style={{ 
                  width: '16px', height: '16px', border: selected.includes(opt) ? 'none' : '1.5px solid var(--border-color)', borderRadius: '4px', 
                  marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: selected.includes(opt) ? 'var(--primary)' : 'transparent'
                }}>
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

const App: React.FC = () => {
  const {
    loading, chartData, weeklyPerformance, metrics,
    filteredList, teams, releases, selectedTeams, setSelectedTeams,
    selectedReleases, setSelectedReleases
  } = useDashboardData();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', background: '#f8fafc' }}>
        <RefreshCw className="animate-spin" size={48} color="var(--primary)" />
        <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem' }}>Sincronizando Insights...</p>
      </div>
    );
  }

  return (
    <motion.div className="dashboard-container" variants={containerVariants} initial="hidden" animate="show">
      <motion.header className="header" variants={itemVariants}>
        <div className="title-section">
          <h1>Locavia Agile Insights</h1>
          <p>Visão Executiva de Produtividade e Capacidade</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <MultiSelect label="Filtrar por Time" options={teams} selected={selectedTeams} onChange={setSelectedTeams} allLabel="TODOS" />
          <MultiSelect label="Filtrar por Release" options={releases} selected={selectedReleases} onChange={setSelectedReleases} allLabel="TODAS" />
        </div>
      </motion.header>

      <motion.div className="metrics-grid" variants={containerVariants}>
        <motion.div className="glass-card metric-card" variants={itemVariants}>
          <div className="metric-label"><Users size={20} color="var(--primary)" /> Escopo Total</div>
          <div className="metric-value" style={{ color: 'var(--primary)' }}>{metrics.totalItems}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Itens mapeados no backlog</p>
        </motion.div>
        <motion.div className="glass-card metric-card" variants={itemVariants}>
          <div className="metric-label"><CheckCircle2 size={20} color="var(--success)" /> Entregas Completas</div>
          <div className="metric-value">{metrics.deliveredCount}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Produtividade liquidada</p>
        </motion.div>
        <motion.div className="glass-card metric-card" variants={itemVariants}>
          <div className="metric-label"><Activity size={20} color="var(--warning)" /> WIP Atual</div>
          <div className="metric-value">{metrics.wipCount}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Itens na esteira de dev</p>
        </motion.div>
        <motion.div className="glass-card metric-card" variants={itemVariants}>
          <div className="metric-label"><Clock size={20} color="var(--text-main)" /> Lead Time</div>
          <div className="metric-value">{metrics.avgCycleTime} <span style={{fontSize:'1.2rem', color:'var(--text-muted)', fontWeight:500}}>dias</span></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Média de ciclo ponta a ponta</p>
        </motion.div>
      </motion.div>

      <motion.div className="glass-card main-chart" variants={itemVariants}>
        <div className="chart-header">
          <h3 className="chart-title">Evolução do Escopo & Cone de Vazão</h3>
        </div>
        <div style={{ width: '100%', height: 420 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fontSize: 12, fontWeight: 500}} dy={15} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--text-muted)" tick={{fontSize: 12, fontWeight: 500}} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '16px', boxShadow: 'var(--shadow-md)', padding: '12px 16px' }}
                itemStyle={{ fontSize: '13px', fontWeight: 600, padding: '4px 0' }}
              />
              <Legend verticalAlign="top" height={60} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500, paddingBottom: '20px' }}/>
              <Area type="monotone" dataKey="A Fazer (Real)" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorReal)" activeDot={{ r: 6, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="Melhor Cenário (3 itens/semana)" stroke="var(--success)" strokeWidth={2.5} strokeDasharray="6 6" fill="transparent" />
              <Area type="monotone" dataKey="Pior Cenário (1 item/semana)" stroke="var(--danger)" strokeWidth={2.5} strokeDasharray="6 6" fill="transparent" />
              {Object.keys(chartData[chartData.length-1] || {}).filter(k => k.startsWith('Tendência Real')).map(key => (
                <Area key={key} type="monotone" dataKey={key} stroke="var(--warning)" strokeWidth={3} strokeDasharray="4 4" fill="transparent" activeDot={{ r: 5 }} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <motion.div className="glass-card main-chart" variants={itemVariants}>
          <div className="chart-header">
            <h3 className="chart-title">Performance & Throughput</h3>
          </div>
          <div style={{ width: '100%', height: 340 }}>
            <ResponsiveContainer>
              <ComposedChart data={weeklyPerformance} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                <YAxis yAxisId="left" orientation="left" stroke="var(--primary)" tick={{fontSize: 11}} axisLine={false} tickLine={false} dx={-5} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--warning)" tick={{fontSize: 11}} axisLine={false} tickLine={false} dx={5} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}/>
                <Bar yAxisId="left" dataKey="Vazão Total" fill="var(--primary)" barSize={36} radius={[6, 6, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="Lead Time (Méd)" stroke="var(--warning)" strokeWidth={3} dot={{ r: 5, strokeWidth: 2, fill: 'white' }} activeDot={{ r: 7 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="glass-card main-chart" variants={itemVariants} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-header">
            <h3 className="chart-title">Saúde e Balanço (Semanal)</h3>
          </div>
          <div style={{ flex: 1, minHeight: 200 }}>
            <ResponsiveContainer>
              <BarChart data={weeklyPerformance.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fontSize: 10}} axisLine={false} tickLine={false} dy={8} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }} cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '10px' }} />
                <Bar dataKey="Entradas" fill="var(--text-muted)" name="Demandas" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Saídas" fill="var(--success)" name="Entregas" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>Saldo da Última Semana:</span>
              <span style={{ 
                fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em',
                color: weeklyPerformance[weeklyPerformance.length-1].Saldo > 0 ? 'var(--danger)' : 'var(--success)' 
              }}>
                {weeklyPerformance[weeklyPerformance.length-1].Saldo > 0 ? '+' : ''}{weeklyPerformance[weeklyPerformance.length-1].Saldo}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div className="glass-card main-chart" variants={itemVariants} style={{ marginTop: '1.5rem', overflow: 'hidden' }}>
        <h3 className="chart-title" style={{ marginBottom: '1.5rem' }}>Detalhamento Dinâmico</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ padding: '1.2rem 1rem', textAlign: 'left' }}>Identificador</th>
                <th style={{ padding: '1.2rem 1rem', textAlign: 'left' }}>Tipo</th>
                <th style={{ padding: '1.2rem 1rem', textAlign: 'left' }}>Resumo da Entrega</th>
                <th style={{ padding: '1.2rem 1rem', textAlign: 'left' }}>Status Atual</th>
                <th style={{ padding: '1.2rem 1rem', textAlign: 'left' }}>Data Criação</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.slice(0, 10).map((item) => (
                <tr key={item.Key} style={{ transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.backgroundColor='rgba(0,0,0,0.01)'} onMouseOut={e => e.currentTarget.style.backgroundColor='transparent'}>
                  <td style={{ padding: '1.2rem 1rem', fontWeight: 600, color: 'var(--primary)' }}>{item.Key}</td>
                  <td style={{ padding: '1.2rem 1rem' }}>
                    <span style={{ background: 'rgba(0,0,0,0.04)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{item.Type}</span>
                  </td>
                  <td style={{ padding: '1.2rem 1rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{item.Summary as string}</td>
                  <td style={{ padding: '1.2rem 1rem' }}>
                    <span style={{ 
                      padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
                      backgroundColor: item.Status.includes('DONE') || item.Status.includes('CONCLUIDO') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: item.Status.includes('DONE') || item.Status.includes('CONCLUIDO') ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {item.Status}
                    </span>
                  </td>
                  <td style={{ padding: '1.2rem 1rem', color: 'var(--text-muted)', fontWeight: 500 }}>{item.Created ? formatDate(excelToJSDate(item.Created)!) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default App;
