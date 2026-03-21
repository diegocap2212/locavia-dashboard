import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Bar, ComposedChart, Line, BarChart
} from 'recharts';
import { 
  Users, Activity, AlertCircle, CheckCircle2, Clock, RefreshCw, ChevronDown
} from 'lucide-react';
import { fetchData, type JiraItem } from './services/dataService';
import rawDataFallback from './data.json';

const getMon = (d: Date) => {
  const mon = new Date(d);
  mon.setDate(mon.getDate() - (mon.getDay() === 0 ? 6 : mon.getDay() - 1));
  mon.setHours(0,0,0,0);
  return mon;
};

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

const formatWeekRange = (date: Date) => {
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  
  const f = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${f(start)} - ${f(end)}`;
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
  const [selectedTeams, setSelectedTeams] = useState<string[]>(['TODOS']);
  const [selectedReleases, setSelectedReleases] = useState<string[]>(['TODAS']);
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
  const { chartData, weeklyPerformance, metrics, health, filteredList, teams, releases } = useMemo(() => {
    const rawItems = normalizeJqlData(data);
    
    // Extract unique teams and releases for filters
    const teamsList = Array.from(new Set(rawItems.map(i => i.Team))).filter(t => t && t !== "").sort();
    const releasesList = Array.from(new Set(rawItems.map(i => i.Release))).filter(r => r && r !== "").sort();

    const filtered = rawItems.filter(item => 
      (selectedTeams.includes('TODOS') || selectedTeams.includes(item.Team)) &&
      (selectedReleases.includes('TODAS') || selectedReleases.includes(item.Release))
    );

    // Grouping by Week for the "Cone" Chart - DYNAMIC BASED ON FILTERED DATA
    // We'll generate the burndown points based on the actual weeks present in the data
    const allWeeks = Array.from(new Set(rawItems.map(i => {
      const d = excelToJSDate(i.Resolved) || excelToJSDate(i.Created);
      return d ? getMon(d).toISOString() : null;
    }))).filter(Boolean).sort() as string[];

    const dynamicHistory = allWeeks.map(weekKey => {
      const weekStart = new Date(weekKey);
      
      // Items that belong to the scope (created before or during this week)
      const currentScope = filtered.filter(i => {
        const c = excelToJSDate(i.Created);
        return c && c <= new Date(weekStart.getTime() + 7 * 86400000);
      }).length;

      // Items resolved up to this week
      const resolvedCount = filtered.filter(i => {
        const r = excelToJSDate(i.Resolved);
        return r && r <= new Date(weekStart.getTime() + 7 * 86400000);
      }).length;

      const aFazer = Math.max(0, currentScope - resolvedCount);
      const isPast = weekStart <= new Date();

      return {
        name: formatDate(weekStart),
        "A Fazer (Real)": isPast ? aFazer : null,
        fullDate: weekStart,
        scope: currentScope,
        delivered: resolvedCount,
        aFazer
      };
    }).filter(d => d["A Fazer (Real)"] !== null || d.fullDate >= getMon(new Date()));

    let lastRealValue = dynamicHistory.filter(d => d["A Fazer (Real)"] !== null).pop()?.aFazer || 0;
    const chartData = [...dynamicHistory];
    if (chartData.length > 0) {
      // Calculate Real Velocity (delivered items / weeks elapsed since first delivery)
      const firstDelivery = filtered.reduce((min, item) => {
        const r = excelToJSDate(item.Resolved);
        return (r && r < min) ? r : min;
      }, new Date());
      const now = new Date();
      const weeksElapsed = Math.max(1, Math.ceil((now.getTime() - firstDelivery.getTime()) / (7 * 86400000)));
      const itemsDelivered = filtered.filter(i => !!i.Resolved).length;
      const velocity = itemsDelivered / weeksElapsed;
      const velocityLabel = `Tendência Real (${velocity.toFixed(1)} itens/semana)`;

      const lastPoint: any = chartData[chartData.length - 1];
      const lastWeekStr = lastPoint.name;
      const parts = lastWeekStr.split('/');
      const lastDate = new Date(2000 + parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));

      let currentBest = lastRealValue;
      let currentWorst = lastRealValue;
      let currentTrend = lastRealValue;
      
      // Set the "fork" point in the last historical week
      lastPoint["Melhor Cenário (3 itens/semana)"] = lastRealValue;
      lastPoint["Pior Cenário (1 item/semana)"] = lastRealValue;
      lastPoint[velocityLabel] = lastRealValue;

      // Extend projections
      for (let i = 1; i <= 20; i++) {
        currentBest = Math.max(0, currentBest - 3);
        currentWorst = Math.max(0, currentWorst - 1);
        currentTrend = Math.max(0, currentTrend - velocity);

        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + (i * 7));

        const newPoint: any = {
          name: formatDate(nextDate),
          "A Fazer (Real)": null,
          "Melhor Cenário (3 itens/semana)": currentBest,
          "Pior Cenário (1 item/semana)": currentWorst
        };
        newPoint[velocityLabel] = currentTrend;
        chartData.push(newPoint);

        if (currentBest === 0 && currentWorst === 0 && currentTrend === 0) break;
      }
    }

    // --- NEW: Weekly Performance & Transbordos based on filtered items ---
    // --- NEW: Weekly Performance & Transbordos based on filtered items ---

    let minD = new Date();
    let maxD = new Date(0);
    filtered.forEach(item => {
      const c = excelToJSDate(item.Created);
      const r = excelToJSDate(item.Resolved);
      if (c && c < minD) minD = c;
      if (c && c > maxD) maxD = c;
      if (r && r > maxD) maxD = r;
    });

    const weeklyStatsMap: Record<string, { 
      date: Date, 
      throughput: number, 
      leadTimeSum: number, 
      resolvedInWeek: number, 
      carry: number, 
      planned: number, 
      unplanned: number,
      inflow: number 
    }> = {};
    if (filtered.length > 0) {
      let curr = getMon(minD);
      const limit = getMon(new Date(maxD.getTime() + 7 * 86400000));
      while (curr <= limit) {
        weeklyStatsMap[curr.toISOString()] = { 
          date: new Date(curr), 
          throughput: 0, 
          leadTimeSum: 0, 
          resolvedInWeek: 0, 
          carry: 0,
          planned: 0,
          unplanned: 0,
          inflow: 0
        };
        curr.setDate(curr.getDate() + 7);
      }

      filtered.forEach(item => {
        const c = excelToJSDate(item.Created);
        const r = excelToJSDate(item.Resolved);
        
        // Track Inflow (Created in week)
        if (c) {
          const createWeekStart = getMon(c);
          const cKey = createWeekStart.toISOString();
          if (weeklyStatsMap[cKey]) {
            weeklyStatsMap[cKey].inflow += 1;
          }
        }

        if (r) {
          const weekStart = getMon(r);
          const key = weekStart.toISOString();
          if (weeklyStatsMap[key]) {
            weeklyStatsMap[key].throughput += 1;
            weeklyStatsMap[key].resolvedInWeek += 1;
            
            // Heuristic: Planned if created before the week it was resolved (sprint)
            if (c && c < weekStart) {
              weeklyStatsMap[key].planned += 1;
            } else {
              weeklyStatsMap[key].unplanned += 1;
            }

            if (c) weeklyStatsMap[key].leadTimeSum += (r.getTime() - c.getTime()) / 86400000;
          }
        }
        // Carryover: item open at end of each week
        Object.keys(weeklyStatsMap).forEach(key => {
          const wStart = new Date(key);
          const wEnd = new Date(wStart.getTime() + 7 * 86400000);
          if (c && c < wEnd && (!r || r >= wEnd)) {
            weeklyStatsMap[key].carry += 1;
          }
        });
      });
    }

    const weeklyPerformance = Object.values(weeklyStatsMap)
      .sort((a,b) => a.date.getTime() - b.date.getTime())
      .filter(w => w.throughput > 0 || w.carry > 0 || w.inflow > 0) // Only show weeks with activity
      .map(w => ({
        name: formatWeekRange(w.date),
        "Planejadas": w.planned,
        "Não Planejadas": w.unplanned,
        "Entradas": w.inflow,
        "Saídas": w.throughput,
        "Saldo": w.inflow - w.throughput, // Positive = backlow grew, Negative = backlog shrank
        "Vazão Total": w.throughput,
        "Lead Time (Méd)": w.resolvedInWeek > 0 ? parseFloat((w.leadTimeSum / w.resolvedInWeek).toFixed(1)) : 0,
        "Transbordos": w.carry
      }));

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
      weeklyPerformance,
      metrics: { 
        totalItems, 
        deliveredCount, 
        wipCount, 
        discardedCount,
        avgCycleTime: avgCycleTime.toFixed(1),
        totalCarryover: weeklyPerformance.length > 0 ? weeklyPerformance[weeklyPerformance.length - 1]["Transbordos"] : 0
      }, 
      health: {
        noDate: itemsMarkedDoneNoDate.length,
        missingMeta: itemsMissingMeta.length
      },
      filteredList: filtered,
      teams: teamsList,
      releases: releasesList
    };
  }, [data, selectedTeams, selectedReleases]);

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
          <MultiSelect 
            label="Filtrar por Time" 
            options={teams} 
            selected={selectedTeams} 
            onChange={setSelectedTeams}
            allLabel="TODOS"
          />
          <MultiSelect 
            label="Filtrar por Release" 
            options={releases} 
            selected={selectedReleases} 
            onChange={setSelectedReleases}
            allLabel="TODAS"
          />
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
              <Area type="monotone" dataKey="A Fazer (Real)" stroke="#f8fafc" strokeWidth={4} fillOpacity={0} />
              <Area type="monotone" dataKey="Melhor Cenário (3 itens/semana)" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
              <Area type="monotone" dataKey="Pior Cenário (1 item/semana)" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
              {/* Dynamic Trend Line */}
              {Object.keys(chartData[chartData.length-1] || {}).filter(k => k.startsWith('Tendência Real')).map(key => (
                <Area key={key} type="monotone" dataKey={key} stroke="#eab308" strokeWidth={3} strokeDasharray="3 3" fill="transparent" />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="metrics-grid" style={{ marginTop: '2rem' }}>
        <div className="glass-card main-chart fade-in-up" style={{ animationDelay: '0.45s', flex: 2 }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Vazão Semanal e Lead Time (Performance do Time)</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <ComposedChart data={weeklyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 10}} />
                <YAxis yAxisId="left" orientation="left" stroke="#818cf8" label={{ value: 'Vazão', angle: -90, position: 'insideLeft', style: {fill: '#818cf8', fontSize: 10} }} />
                <YAxis yAxisId="right" orientation="right" stroke="#eab308" label={{ value: 'Lead Time (dias)', angle: 90, position: 'insideRight', style: {fill: '#eab308', fontSize: 10} }} />
                <Legend />
                <Bar yAxisId="left" dataKey="Vazão Total" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="Lead Time (Méd)" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card fade-in-up" style={{ animationDelay: '0.5s', flex: 1.2 }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Saúde do Fluxo Semanal (Balanço)</h3>
          <div style={{ height: 200, width: '100%', marginBottom: '1rem' }}>
            <ResponsiveContainer>
              <BarChart data={weeklyPerformance.slice(-8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 9}} />
                <YAxis stroke="#64748b" tick={{fontSize: 9}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Entradas" fill="#f43f5e" name="Demandas (Entrada)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saídas" fill="#22c55e" name="Entregas (Saída)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Saldo da Semana (Novos - Produzidos):</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: weeklyPerformance[weeklyPerformance.length-1].Saldo > 0 ? '#f43f5e' : '#22c55e' 
              }}>
                {weeklyPerformance[weeklyPerformance.length-1].Saldo > 0 ? '+' : ''}{weeklyPerformance[weeklyPerformance.length-1].Saldo}
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              {weeklyPerformance[weeklyPerformance.length-1].Saldo > 0 
                ? 'Backlog aumentou' 
                : (weeklyPerformance[weeklyPerformance.length-1].Saldo < 0 ? 'Backlog reduziu' : 'Fluxo equilibrado')}
              {' • '}
              {weeklyPerformance[weeklyPerformance.length-1].Planejadas} planejado / {weeklyPerformance[weeklyPerformance.length-1]["Não Planejadas"]} urgente entregues
            </div>
          </div>
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
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Detalhamento de Itens (Filtro Ativo)</h3>
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

// --- Custom Components ---

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
      if (next.includes(val)) {
        next = next.filter(v => v !== val);
      } else {
        next.push(val);
      }
      if (next.length === 0) next = [allLabel];
      onChange(next);
    }
  };

  return (
    <div className="multi-select-container" style={{ position: 'relative', minWidth: '220px' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>{label}</label>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="glass-card"
        style={{ 
          width: '100%', padding: '0.6rem 0.8rem', display: 'flex', justifyContent: 'space-between', 
          alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'white'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
          {selected.includes(allLabel) ? `Todas (${options.length})` : 
           (selected.length === 1 ? selected[0] : `${selected.length} selecionados`)}
        </span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      
      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div className="glass-card fade-in" style={{ 
            position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 50,
            maxHeight: '250px', overflowY: 'auto', padding: '0.5rem',
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <div 
              onClick={() => { toggle(allLabel); setIsOpen(false); }}
              style={{ 
                padding: '0.5rem 0.6rem', cursor: 'pointer', borderRadius: '6px', 
                background: selected.includes(allLabel) ? 'rgba(56, 189, 248, 0.1)' : 'transparent', 
                display: 'flex', alignItems: 'center', marginBottom: '2px', fontSize: '0.85rem'
              }}
            >
              <div style={{ 
                width: '14px', height: '14px', border: '1px solid #38bdf8', borderRadius: '3px', 
                marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: selected.includes(allLabel) ? '#38bdf8' : 'transparent'
              }}>
                {selected.includes(allLabel) && <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '1px' }} />}
              </div>
              {allLabel === 'TODOS' ? 'Todos os Times' : 'Todas as Releases'}
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
            {options.map(opt => (
              <div 
                key={opt}
                onClick={() => toggle(opt)}
                style={{ 
                  padding: '0.5rem 0.6rem', cursor: 'pointer', borderRadius: '6px', 
                  background: selected.includes(opt) ? 'rgba(56, 189, 248, 0.1)' : 'transparent', 
                  display: 'flex', alignItems: 'center', marginBottom: '2px', fontSize: '0.85rem'
                }}
              >
                <div style={{ 
                  width: '14px', height: '14px', border: '1px solid #38bdf8', borderRadius: '3px', 
                  marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: selected.includes(opt) ? '#38bdf8' : 'transparent'
                }}>
                  {selected.includes(opt) && <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '1px' }} />}
                </div>
                {opt}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default App;
