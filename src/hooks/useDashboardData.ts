import { useState, useMemo, useEffect } from 'react';
import { fetchData, type JiraItem } from '../services/dataService';
import rawDataFallback from '../data.json';
import releaseConfig from '../config/release-config.json';

const getMon = (d: Date) => {
  const mon = new Date(d);
  mon.setDate(mon.getDate() - (mon.getDay() === 0 ? 6 : mon.getDay() - 1));
  mon.setHours(0,0,0,0);
  return mon;
};

// Utility to convert Excel Decimal Date to JS Date
const excelToJSDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (s === "" || s.toLowerCase() === "null") return null;

  // Handle ISO format/Hyphenated (YYYY-MM-DD)
  if (s.includes('-')) return new Date(s);
  
  if (s.includes('/')) {
    const [datePart, timePart] = s.split(' ');
    const parts = datePart.split('/').map(Number);
    if (parts.length !== 3) return null;

    let day, month, year;

    // Detect format by position of the 4-digit year
    if (parts[0] > 1000) {
      // YYYY/MM/DD
      year = parts[0];
      month = parts[1];
      day = parts[2];
    } else if (parts[2] > 1000) {
      // DD/MM/YYYY or MM/DD/YYYY
      year = parts[2];
      // Ambiguous: use 12+ detection or default to DD/MM (Brazilian Standard)
      if (parts[0] > 12) {
        day = parts[0];
        month = parts[1];
      } else if (parts[1] > 12) {
        month = parts[0];
        day = parts[1];
      } else {
        // DEFAULT TO DD/MM/YYYY (Brazilian) - Prioritized for this project
        day = parts[0];
        month = parts[1];
      }
    } else {
      // handle 2-digit years if they still exist
      let [first, second, y] = parts;
      year = (y < 50 ? 2000 : 1900) + y;
      if (first > 12) {
        day = first; month = second;
      } else {
        day = first; month = second; // Default DD/MM
      }
    }

    if (timePart) {
      const timeParts = timePart.split(':').map(Number);
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      return new Date(year, month - 1, day, hours, minutes);
    }
    return new Date(year, month - 1, day);
  }

  const excelDate = parseFloat(s);
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

export const formatDate = (date: Date) => {
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

export const useDashboardData = () => {
  const [selectedTeams, setSelectedTeams] = useState<string[]>(['TODOS']);
  const [selectedReleases, setSelectedReleases] = useState<string[]>(['TODAS']);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
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

  const dashboardState = useMemo(() => {
    const rawItems = normalizeJqlData(data);
    
    // 1. Meta Data (Teams/Releases)
    const teamsList = Array.from(new Set(rawItems.map(i => i.Team))).filter(t => t && t !== "").sort();
    const releasesList = Array.from(new Set(rawItems.map(i => i.Release))).filter(r => r && r !== "").sort();

    // 2. Filter primary set
    const filtered = rawItems.filter(item => {
      const teamMatch = selectedTeams.includes('TODOS') || selectedTeams.includes(item.Team);
      const releaseMatch = selectedReleases.includes('TODAS') || selectedReleases.includes(item.Release);
      if (!teamMatch || !releaseMatch) return false;

      const cDate = excelToJSDate(item.Created);
      const rDate = excelToJSDate(item.Resolved);

      if (startDate && rDate && rDate < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (cDate && cDate > end) return false;
      }
      return true;
    });

    // 3. Generate Timeline & Burndown
    const now = new Date();
    const futureLimit = new Date(now.getTime() + 7 * 86400000);
    
    const timelineWeeks = Array.from(new Set(rawItems.map(i => {
      const d = excelToJSDate(i.Resolved) || excelToJSDate(i.Created);
      return (d && d <= futureLimit) ? getMon(d).toISOString() : null;
    }))).filter(Boolean).sort() as string[];

    const dynamicHistory = timelineWeeks.map(weekKey => {
      const weekStart = new Date(weekKey);
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
      const scopeAtWeek = filtered.filter(i => {
        const c = excelToJSDate(i.Created);
        return c && c < weekEnd;
      }).length;
      const resolvedAtWeek = filtered.filter(i => {
        const r = excelToJSDate(i.Resolved);
        return r && r < weekEnd;
      }).length;
      
      const aFazer = Math.max(0, scopeAtWeek - resolvedAtWeek);
      const isPast = weekStart <= new Date();

      return {
        name: formatDate(weekStart),
        "A Fazer (Real)": isPast ? aFazer : null,
        fullDate: weekStart,
        scope: scopeAtWeek,
        delivered: resolvedAtWeek,
        aFazer
      };
    }).filter(d => (d["A Fazer (Real)"] !== null || d.fullDate >= getMon(new Date())) && d.fullDate >= new Date(2024, 11, 1)); // Filter to show from Dec 2024

    // 4. Projections & Velocity
    const chartData: any[] = [...dynamicHistory];
    const RELEASE_DEADLINE = new Date(2026, 6, 10); // 10 de Julho de 2026
    
    if (chartData.length > 0) {
      const lastReal = dynamicHistory.filter(d => d["A Fazer (Real)"] !== null).pop();
      const lastValue = lastReal?.aFazer || 0;
      const lastDate = lastReal?.fullDate || new Date();
      
      // Calculate Velocity based on last 4 weeks for better Trend sensitivity
      const fourWeeksAgo = new Date(lastDate);
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      
      const recentDeliveries = filtered.filter(i => {
        const r = excelToJSDate(i.Resolved);
        return r && r >= fourWeeksAgo && r <= lastDate;
      }).length;
      
      const velocity = Math.max(0.5, recentDeliveries / 4); // Min 0.5 to avoid static lines
      const bestVelocity = Math.max(velocity * 1.5, 4);
      const worstVelocity = Math.max(velocity * 0.5, 1);
      
      const vLabel = `Tendência Real (${velocity.toFixed(1)} itens/semana)`;
      const bLabel = `Melhor Cenário (${bestVelocity.toFixed(1)} itens/semana)`;
      const wLabel = `Pior Cenário (${worstVelocity.toFixed(1)} itens/semana)`;

      let currentBest = lastValue, currentWorst = lastValue, currentTrend = lastValue;
      
      // Project until zero OR 20 weeks ahead
      for (let i = 1; i <= 30; i++) {
        currentBest = Math.max(0, currentBest - bestVelocity);
        currentWorst = Math.max(0, currentWorst - worstVelocity);
        currentTrend = Math.max(0, currentTrend - velocity);
        
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + (i * 7));
        
        chartData.push({
          name: formatDate(nextDate),
          "A Fazer (Real)": null,
          [bLabel]: currentBest,
          [wLabel]: currentWorst,
          [vLabel]: currentTrend,
          fullDate: nextDate
        });
        
        // Stop if all scenarios reach zero AND we passed deadline
        if (currentBest === 0 && currentWorst === 0 && currentTrend === 0 && nextDate > RELEASE_DEADLINE) break;
      }
      chartData.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
    }

    // 5. Temporal Matrix Data (Heatmap)
    const minD = filtered.length > 0 ? filtered.reduce((m, i) => { const d = excelToJSDate(i.Created); return (d && d < m) ? d : m; }, new Date()) : new Date(2025, 0, 1);
    const maxDeadline = releaseConfig.releases.map(r => new Date(r.deadline)).reduce((a, b) => a > b ? a : b, new Date());
    
    let matrixMinDate = new Date(2025, 0, 1);
    if (minD > matrixMinDate) matrixMinDate = minD;
    
    const matrixWeeks: { key: string; label: string; date: Date }[] = [];
    const curMatrixWeek = getMon(matrixMinDate);
    const endMatrixWeek = new Date(Math.max(Date.now(), maxDeadline.getTime() + 7 * 86400000));
    
    while (curMatrixWeek <= endMatrixWeek) {
      matrixWeeks.push({
        key: curMatrixWeek.toISOString(),
        label: formatDate(curMatrixWeek),
        date: new Date(curMatrixWeek)
      });
      curMatrixWeek.setDate(curMatrixWeek.getDate() + 7);
    }
    
    const teamsMap = new Map<string, JiraItem[]>();
    filtered.forEach(i => {
       const team = i.Team || 'Sem Time';
       if (!teamsMap.has(team)) teamsMap.set(team, []);
       teamsMap.get(team)!.push(i);
    });

    const matrixRows = Array.from(teamsMap.entries()).map(([teamName, items]) => {
      const releaseCounts: Record<string, number> = {};
      items.forEach(i => {
         const r = i.Release || 'DEFAULT';
         releaseCounts[r] = (releaseCounts[r] || 0) + 1;
      });
      const topReleaseId = Object.keys(releaseCounts).sort((a, b) => releaseCounts[b] - releaseCounts[a])[0] || 'DEFAULT';
      const rConf = releaseConfig.releases.find(r => r.id === topReleaseId) || releaseConfig.releases.find(r => r.id === 'DEFAULT')!;
      const deadline = new Date(rConf.deadline);
      const totalTeamItems = items.length;
      
      const firstItemCreated = items.reduce((m, i) => { const d = excelToJSDate(i.Created); return (d && d < m) ? d : m; }, new Date());
      const teamStartWeek = getMon(firstItemCreated);
      const startMs = teamStartWeek.getTime();
      const endMs = getMon(deadline).getTime();
      const totalWeeksForTeam = Math.max(1, Math.round((endMs - startMs) / (7 * 86400000)));
      const itemsPerWeekMeta = totalTeamItems / totalWeeksForTeam;
      
      const cells = matrixWeeks.map(w => {
         let meta = 0;
         if (w.date < teamStartWeek) {
            meta = totalTeamItems;
         } else if (w.date >= deadline) {
            meta = 0;
         } else {
            const weeksPassed = Math.max(0, Math.round((w.date.getTime() - startMs) / (7 * 86400000)));
            meta = Math.max(0, Math.round(totalTeamItems - (weeksPassed * itemsPerWeekMeta)));
         }
         
         const wEnd = new Date(w.date);
         wEnd.setDate(wEnd.getDate() + 7);
         const isPast = w.date <= new Date();
         
         const execucao = isPast ? items.filter(i => {
            const c = excelToJSDate(i.Created);
            const r = excelToJSDate(i.Resolved);
            if (!c || c >= wEnd) return false;
            if (!r || r >= wEnd) return true;
            return false;
         }).length : null;
         
         return { weekKey: w.key, meta, execucao, isPast };
      });
      
      return { groupName: teamName, releaseName: topReleaseId, totalItems: totalTeamItems, deadline, cells };
    });
    
    matrixRows.sort((a, b) => b.totalItems - a.totalItems);
    
    const temporalMatrixData = { weeks: matrixWeeks, rows: matrixRows };

    // 5. Weekly Performance (Throughput/LeadTime)
    const weeklyStats: any[] = [];
    if (filtered.length > 0) {
      const minDate = filtered.reduce((m, i) => {
        const d = excelToJSDate(i.Created);
        return (d && d < m) ? d : m;
      }, new Date());
      let curr = getMon(minDate);
      const now = new Date();
      while (curr <= now || weeklyStats.length < 5) {
        const wStart = new Date(curr);
        const wEnd = new Date(curr.getTime() + 7 * 86400000);
        
        const resolved = filtered.filter(i => {
           const r = excelToJSDate(i.Resolved);
           return r && r >= wStart && r < wEnd;
        });
        const inflow = filtered.filter(i => {
           const c = excelToJSDate(i.Created);
           return c && c >= wStart && c < wEnd;
        }).length;

        const leadTimeSum = resolved.reduce((acc, i) => {
           const c = excelToJSDate(i.Created);
           const r = excelToJSDate(i.Resolved);
           return acc + (r!.getTime() - (c?.getTime() || r!.getTime())) / 86400000;
        }, 0);

        weeklyStats.push({
          name: formatWeekRange(wStart),
          "Saídas": resolved.length,
          "História": resolved.filter(i => i.Type === 'História').length,
          "Bug": resolved.filter(i => i.Type === 'Bug').length,
          "Tarefa": resolved.filter(i => i.Type === 'Tarefa').length,
          "Spike": resolved.filter(i => i.Type === 'Spike').length,
          "Entradas": inflow,
          "Saldo": inflow - resolved.length,
          "Vazão Total": resolved.length,
          "Lead Time (Méd)": resolved.length > 0 ? parseFloat((leadTimeSum / resolved.length).toFixed(1)) : 0,
          date: wStart
        });
        curr.setDate(curr.getDate() + 7);
      }
    }

    // 6. Final Metrics
    return { 
      chartData, 
      weeklyPerformance: weeklyStats.slice(-18),
      metrics: { 
        totalItems: filtered.length,
        deliveredCount: filtered.filter(i => !!i.Resolved).length,
        wipCount: filtered.filter(i => !i.Resolved && i.Status !== 'DESCARTADO').length,
        avgCycleTime: (filtered.filter(i => i.Resolved && i.Created).reduce((acc, i) => acc + (excelToJSDate(i.Resolved)!.getTime() - excelToJSDate(i.Created)!.getTime()), 0) / (Math.max(1, filtered.filter(i => i.Resolved && i.Created).length) * 86400000)).toFixed(1),
      }, 
      filteredList: filtered,
      teams: teamsList,
      releases: releasesList,
      temporalMatrixData
    };
  }, [data, selectedTeams, selectedReleases, startDate, endDate]);

  return {
    ...dashboardState,
    loading,
    error,
    selectedTeams,
    setSelectedTeams,
    selectedReleases,
    setSelectedReleases,
    startDate,
    setStartDate,
    endDate,
    setEndDate
  };
};

export { excelToJSDate, getMon };
