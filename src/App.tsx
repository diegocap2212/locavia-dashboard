import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Users, Activity, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import rawData from './data.json';

// Types
interface JiraItem {
  Type: string;
  Key: string;
  Summary: string | unknown;
  Status: string;
  Team: string;
  Created: string;
  Resolved: string | null;
  Release: string;
  CustomFields?: Record<string, unknown>;
  Metadata?: {
    source: 'excel' | 'api';
    jql_context?: string;
  };
  [key: string]: unknown;
}

// Data Normalization Layer (Future-proof for JQL/XML)
const normalizeJqlData = (data: unknown[]): JiraItem[] => {
  return data.map(rawItem => {
    const item = rawItem as Record<string, unknown>;
    return {
      ...item,
      Status: typeof item.Status === 'string' ? item.Status.toUpperCase() : 'UNKNOWN',
      Metadata: (item.Metadata as { source: 'excel' | 'api', jql_context?: string }) || { source: 'excel' }
    } as JiraItem;
  });
};

// Utility to convert Excel Decimal Date to JS Date
const excelToJSDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  // Handle already ISO dates from future API
  if (dateStr.includes('-')) return new Date(dateStr);
  
  const excelDate = parseFloat(dateStr);
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const App: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState<string>('GOL');
  const [selectedRelease, setSelectedRelease] = useState<string>('O4R2');

  // Unified Data Processing with Future-Proof Layer
  const { chartData, metrics, health, filteredList } = useMemo(() => {
    const rawItems = normalizeJqlData(rawData);
    
    const filtered = rawItems.filter(item => 
      (selectedTeam === 'TODOS' || item.Team === selectedTeam) &&
      (selectedRelease === 'TODAS' || item.Release === selectedRelease)
    );

    // Grouping by Week for the "Cone" Chart
    const weeksMap: Record<string, { date: Date, created: number, resolved: number }> = {};
    
    filtered.forEach(item => {
      const createdDate = excelToJSDate(item.Created);
      const resolvedDate = excelToJSDate(item.Resolved);

      if (createdDate) {
        const monday = new Date(createdDate);
        monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));
        monday.setHours(0, 0, 0, 0);
        const key = monday.toISOString();
        if (!weeksMap[key]) weeksMap[key] = { date: monday, created: 0, resolved: 0 };
        weeksMap[key].created += 1;
      }

      if (resolvedDate) {
        const monday = new Date(resolvedDate);
        monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));
        monday.setHours(0, 0, 0, 0);
        const key = monday.toISOString();
        if (!weeksMap[key]) weeksMap[key] = { date: monday, created: 0, resolved: 0 };
        weeksMap[key].resolved += 1;
      }
    });

    const timeline = Object.values(weeksMap).sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate Average Velocity (Resolved per week) for Projection
    const totalResolvedSoFar = timeline.reduce((acc, w) => acc + w.resolved, 0);
    const avgVelocity = timeline.length > 0 ? totalResolvedSoFar / timeline.length : 0;

    // Use reduce to build chartData with cumulative values to satisfy immutability rules
    const initialAcc = {
      cumCreated: 0,
      cumResolved: 0,
      list: [] as Array<Record<string, string | number | null>>
    };

    const result = timeline.reduce((acc, w, index) => {
      const newCumCreated = acc.cumCreated + w.created;
      const newCumResolved = acc.cumResolved + w.resolved;
      return {
        cumCreated: newCumCreated,
        cumResolved: newCumResolved,
        list: [
          ...acc.list,
          {
            name: formatDate(w.date),
            "Scope (Total solicitado)": newCumCreated,
            "Deliveries (Concluído)": newCumResolved,
            "Forecast (Projeção)": index === timeline.length - 1 ? newCumResolved : null
          }
        ]
      };
    }, initialAcc);

    const chartData = result.list;
    const finalCumCreated = result.cumCreated;
    const finalCumResolved = result.cumResolved;

    // Add 4 future weeks logic...
    if (timeline.length > 0) {
      const lastWeek = timeline[timeline.length - 1].date;
      for (let i = 1; i <= 4; i++) {
        const nextWeek = new Date(lastWeek);
        nextWeek.setDate(nextWeek.getDate() + (i * 7));
        chartData.push({
          name: formatDate(nextWeek),
          "Scope (Total solicitado)": finalCumCreated,
          "Deliveries (Concluído)": null,
          "Forecast (Projeção)": Math.round(finalCumResolved + (avgVelocity * i))
        });
      }
    }

    const totalItems = filtered.length;
    const deliveredCount = filtered.filter(i => !!i.Resolved).length;
    
    // Problem 1: Done without date
    const itemsMarkedDoneNoDate = filtered.filter(i => (i.Status.toUpperCase().includes('DONE') || i.Status.toUpperCase().includes('CONCLUIDO')) && !i.Resolved);
    
    // Problem 2: Missing Metadata (Squad or Release)
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
      filteredList: filtered
    };
  }, [selectedTeam, selectedRelease]);

  const teams = Array.from(new Set((rawData as JiraItem[]).map(i => i.Team))).filter(t => t !== "").sort();
  const releases = Array.from(new Set((rawData as JiraItem[]).map(i => i.Release))).filter(r => r !== "").sort();

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="title-section">
          <h1>Locavia Agile Insights</h1>
          <p>Visualização de Vazão e Performance de Escopo</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
            <option value="TODOS">Todos os Times</option>
            {teams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          
          <select value={selectedRelease} onChange={(e) => setSelectedRelease(e.target.value)}>
            <option value="TODAS">Todas as Releases</option>
            {releases.map(r => <option key={r} value={r}>{r}</option>)}
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
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                tick={{fontSize: 10}}
                dy={10}
              />
              <YAxis 
                stroke="#64748b" 
                tick={{fontSize: 10}}
              />
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
              <Area 
                type="monotone" 
                dataKey="Scope (Total solicitado)" 
                stroke="#818cf8" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCreated)" 
              />
              <Area 
                type="monotone" 
                dataKey="Deliveries (Concluído)" 
                stroke="#22c55e" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorResolved)" 
              />
              <Area 
                type="monotone" 
                dataKey="Forecast (Projeção)" 
                stroke="#94a3b8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="transparent"
              />
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
                  ⚠️ **Concluídos sem data:** {health.noDate} itens concluídos não possuem data de resolução. Eles constam nas métricas, mas "somem" do gráfico de vazão.
                </p>
              )}
              {health.missingMeta > 0 && (
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                  ⚠️ **Metadados ausentes:** {health.missingMeta} itens estão sem Squad ou Release definidos. Isso pode causar "crashes" nos filtros do dashboard.
                </p>
              )}
              {health.noDate === 0 && health.missingMeta === 0 && (
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                  Integridade de datas e metadados confirmada. O gráfico reflete 100% da realidade.
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
              {filteredList.length > 15 && (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                    Exibindo 15 de {filteredList.length} itens. Use a API futuramente para busca completa.
                  </td>
                </tr>
              )}
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
