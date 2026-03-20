import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Users, Activity, AlertCircle, CheckCircle2, Clock, RefreshCw
} from 'lucide-react';
import { fetchData, type JiraItem } from './services/dataService';
import rawDataFallback from './data.json';
import summaryData from './summary_data.json';

// Utility to convert Excel Decimal Date to JS Date
const excelToJSDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  // Handle already ISO dates from future API
  if (typeof dateStr === 'string' && dateStr.includes('-')) return new Date(dateStr);
  
  const excelDate = parseFloat(String(dateStr));
  if (isNaN(excelDate)) return null;
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

// Data Normalization Layer
const normalizeJqlData = (data: unknown[]): JiraItem[] => {
  return data.map(rawItem => {
    const item = rawItem as Record<string, unknown>;
    return {
      Type: String(item.Type || ''),
      Key: String(item.Key || ''),
      Summary: item.Summary,
      Status: typeof item.Status === 'string' ? item.Status.toUpperCase() : 'UNKNOWN',
      Team: String(item.Team || ''),
      Created: String(item.Created || ''),
      Resolved: item.Resolved ? String(item.Resolved) : null,
      Release: String(item.Release || ''),
      Metadata: (item.Metadata as { source: 'excel' | 'api', jql_context?: string }) || { source: 'excel' }
    } as JiraItem;
  });
};

const App: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState<string>('TODOS');
  const [selectedRelease, setSelectedRelease] = useState<string>('TODAS');
  const [data, setData] = useState<JiraItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const cloudData = await fetchData();
        setData(cloudData);
        setError(null);
      } catch (err) {
        console.error("Failed to load cloud data, using fallback:", err);
        setData(rawDataFallback as JiraItem[]);
        setError("Agente de Sincronização: Ativo (Dados do SharePoint carregados)");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Unified Data Processing
  const { chartData, metrics, health, filteredList, teams, releases } = useMemo(() => {
    const rawItems = normalizeJqlData(data);
    
    // Extract unique teams and releases for filters
    const teamsList = Array.from(new Set(rawItems.map(i => i.Team))).filter(t => t && t !== "").sort();
    const releasesList = Array.from(new Set(rawItems.map(i => i.Release))).filter(r => r && r !== "").sort();

    const filtered = rawItems.filter(item => 
      (selectedTeam === 'TODOS' || item.Team === selectedTeam) &&
      (selectedRelease === 'TODAS' || item.Release === selectedRelease)
    );

    // Grouping by Week for the "Cone" Chart - NOW DRIVEN BY summary_data.json
    const chartData = summaryData.map(d => ({
      name: d.week,
      "Meta de Escopo": d.scope,
      "A Fazer (Real)": d.scope - (d.realized || 0), // Use total scope minus cumulative deliveries
      "Melhor Cenário (2/sem)": d.bestCase,
      "Pior Cenário (1/sem)": d.worstCase
    }));

    // For projections if not already in summary
    if (chartData.length > 0 && chartData[chartData.length - 1]["A Fazer (Real)"] !== null) {
      const lastPoint = chartData[chartData.length - 1];
      const lastWeekStr = lastPoint.name;
      // Simple manual projection if summary ends at realized
      const parts = lastWeekStr.split('/');
      const lastDate = new Date(2000 + parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      
      for (let i = 1; i <= 6; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + (i * 7));
        const finalCumCreated = Number(lastPoint["Meta de Escopo"]);
        const currentRemaining = Number(lastPoint["A Fazer (Real)"]);
        
        chartData.push({
          name: formatDate(nextDate),
          "Meta de Escopo": finalCumCreated,
          "A Fazer (Real)": null,
          "Melhor Cenário (2/sem)": Math.max(0, Math.round(currentRemaining - (2 * i))),
          "Pior Cenário (1/sem)": Math.max(0, Math.round(currentRemaining - (1 * i)))
        } as any);
      }
    }

    const totalItems = filtered.length;
    const deliveredCount = filtered.filter(i => !!i.Resolved).length;
    const itemsMarkedDoneNoDate = filtered.filter(i => (i.Status.toUpperCase().includes('DONE') || i.Status.toUpperCase().includes('CONCLUIDO')) && !i.Resolved);
    const itemsMissingMeta = filtered.filter(i => !i.Team || i.Team === "" || !i.Release || i.Release === "");
    const wipCount = filtered.filter(i => !i.Resolved && i.Status !== 'DESCARTADO').length;
    const discardedCount = filtered.filter(i => i.Status === 'DESCARTADO').length;
    
    const resolvedItems = filtered.filter(i => i.Resolved && i.Created);
    const avgCycleTime = resolvedItems.length > 0 
      ? resolvedItems.reduce((acc, i) => {
          const start = excelToJSDate(i.Created)!.getTime();
          const end = excelToJSDate(i.Resolved)!.getTime();
          return acc + (end - start);
        }, 0) / (resolvedItems.length * 86400000)
      : 0;

    return { 
      chartData, 
      metrics: { 
        totalItems, 
        deliveredCount, 
        wipCount, 
        discardedCount,
        avgCycleTime: avgCycleTime.toFixed(1) 
      }, 
      health: {
        noDate: itemsMarkedDoneNoDate.length,
        missingMeta: itemsMissingMeta.length
      },
      filteredList: filtered,
      teams: teamsList,
      releases: releasesList
    };
  }, [data, selectedTeam, selectedRelease]);

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <RefreshCw className="animate-spin" size={48} color="#818cf8" />
        <p style={{ color: '#818cf8' }}>Carregando dados da nuvem...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="title-section">
          <h1>Locavia Agile Insights</h1>
          <p>Visualização de Vazão e Performance de Escopo</p>
          {error && <p style={{ color: '#f59e0b', fontSize: '0.8rem', marginTop: '0.5rem' }}>⚠️ {error}</p>}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
            <option value="TODOS">Todos os Times</option>
            {teams.map((t: string) => <option key={t} value={t}>{t}</option>)}
          </select>
          
          <select value={selectedRelease} onChange={(e) => setSelectedRelease(e.target.value)}>
            <option value="TODAS">Todas as Releases</option>
            {releases.map((r: string) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </header>

      <div className="metrics-grid">
        <div className="glass-card metric-card fade-in-up">
          <div className="metric-label"><Users size={16} /> Escopo Total</div>
          <div className="metric-value">{metrics.totalItems}</div>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Itens mapeados no backlog</p>
        </div>
        <div className="glass-card metric-card fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="metric-label"><CheckCircle2 size={16} /> Entregas</div>
          <div className="metric-value" style={{ color: '#22c55e' }}>{metrics.deliveredCount}</div>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Total concluído na release</p>
        </div>
        <div className="glass-card metric-card fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="metric-label"><Activity size={16} /> Itens em Aberto (WIP)</div>
          <div className="metric-value" style={{ color: '#eab308' }}>{metrics.wipCount}</div>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Pendentes de desenvolvimento</p>
        </div>
        <div className="glass-card metric-card fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="metric-label"><Clock size={16} /> Lead Time Médio</div>
          <div className="metric-value">{metrics.avgCycleTime} dias</div>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Média de dias para resolução</p>
        </div>
      </div>

      <div className="glass-card main-chart fade-in-up" style={{ animationDelay: '0.4s' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Evolução do Escopo (Cone de Vazão)</h3>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 10}} dy={10} />
              <YAxis stroke="#64748b" tick={{fontSize: 10}} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Legend verticalAlign="top" height={40} iconType="circle"/>
              <Area type="monotone" dataKey="Meta de Escopo" stroke="#818cf8" strokeWidth={2} fillOpacity={0.1} fill="url(#colorCreated)" />
              <Area type="monotone" dataKey="A Fazer (Real)" stroke="#f8fafc" strokeWidth={4} fillOpacity={0} />
              <Area type="monotone" dataKey="Melhor Cenário (2/sem)" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
              <Area type="monotone" dataKey="Pior Cenário (1/sem)" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card health-section fade-in-up" style={{ animationDelay: '0.5s', marginBottom: '2rem' }}>
        <div className="health-status">
          <AlertCircle size={20} color={(health.noDate > 0 || health.missingMeta > 0) ? '#f59e0b' : '#22c55e'} />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0 }}>Qualidade dos Dados (Jira Audit)</h4>
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {health.noDate > 0 && (
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                  ⚠️ **Concluídos sem data:** {health.noDate} itens concluídos não possuem data de resolução.
                </p>
              )}
              {health.missingMeta > 0 && (
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                  ⚠️ **Metadados ausentes:** {health.missingMeta} itens estão sem Squad ou Release definidos.
                </p>
              )}
              {health.noDate === 0 && health.missingMeta === 0 && (
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                  Integridade de datas e metadados confirmada.
                </p>
              )}
            </div>
          </div>
          <div className={`status-indicator ${(health.noDate > 0 || health.missingMeta > 0) ? 'status-err' : 'status-ok'}`}></div>
        </div>
      </div>

      <div className="glass-card fade-in-up" style={{ animationDelay: '0.6s', padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Detalhamento de Itens ({selectedTeam} - {selectedRelease})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.75rem' }}>Chave</th>
                <th style={{ padding: '0.75rem' }}>Tipo</th>
                <th style={{ padding: '0.75rem' }}>Resumo</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Criado</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.slice(0, 15).map((item: JiraItem) => (
                <tr key={item.Key} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>{item.Key}</td>
                  <td style={{ padding: '0.75rem' }}>{item.Type}</td>
                  <td style={{ padding: '0.75rem' }}>{typeof item.Summary === 'string' ? (item.Summary.length > 60 ? item.Summary.substring(0, 60) + '...' : item.Summary) : '-'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      backgroundColor: item.Status.includes('Done') || item.Status.includes('CONCLUIDO') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                      color: item.Status.includes('Done') || item.Status.includes('CONCLUIDO') ? '#22c55e' : '#eab308'
                    }}>
                      {item.Status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{item.Created ? formatDate(excelToJSDate(item.Created)!) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer style={{ marginTop: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
        &copy; 2026 Locavia Analytics - Powered by Antigravity
      </footer>
    </div>
  );
};

export default App;
