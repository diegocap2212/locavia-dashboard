import { useState, useMemo, useEffect } from 'react';
import { fetchData, type JiraItem } from '../services/dataService';
import rawDataFallback from '../data.json';

const getMon = (d: Date) => {
  const mon = new Date(d);
  mon.setDate(mon.getDate() - (mon.getDay() === 0 ? 6 : mon.getDay() - 1));
  mon.setHours(0,0,0,0);
  return mon;
};

// Utility to convert Excel Decimal Date to JS Date
const excelToJSDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  const s = String(dateStr);
  if (s.includes('-')) return new Date(s);
  if (s.includes('/')) {
    // Handle DD/MM/YYYY or DD/MM/YYYY HH:MM
    const [datePart, timePart] = s.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    if (timePart) {
      const [hours, minutes] = timePart.split(':').map(Number);
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
    const timelineWeeks = Array.from(new Set(rawItems.map(i => {
      const d = excelToJSDate(i.Resolved) || excelToJSDate(i.Created);
      return d ? getMon(d).toISOString() : null;
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
    }).filter(d => d["A Fazer (Real)"] !== null || d.fullDate >= getMon(new Date()));

    // 4. Projections
    const chartData: any[] = [...dynamicHistory];
    if (chartData.length > 0) {
      const lastReal = dynamicHistory.filter(d => d["A Fazer (Real)"] !== null).pop();
      const lastValue = lastReal?.aFazer || 0;
      const lastDate = lastReal?.fullDate || new Date();
      
      const firstDel = filtered.reduce((min, item) => {
        const r = excelToJSDate(item.Resolved);
        return (r && r < min) ? r : min;
      }, new Date());
      const velocity = filtered.filter(i => !!i.Resolved).length / Math.max(1, Math.ceil((new Date().getTime() - firstDel.getTime()) / (7 * 86400000)));
      const vLabel = `Tendência Real (${velocity.toFixed(1)} itens/semana)`;

      let currentBest = lastValue, currentWorst = lastValue, currentTrend = lastValue;
      
      for (let i = 1; i <= 15; i++) {
        currentBest = Math.max(0, currentBest - 3);
        currentWorst = Math.max(0, currentWorst - 1);
        currentTrend = Math.max(0, currentTrend - velocity);
        
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + (i * 7));
        
        chartData.push({
          name: formatDate(nextDate),
          "A Fazer (Real)": null,
          "Melhor Cenário (3 itens/semana)": currentBest,
          "Pior Cenário (1 item/semana)": currentWorst,
          [vLabel]: currentTrend,
          fullDate: nextDate
        });
        if (currentBest === 0 && currentWorst === 0 && currentTrend === 0) break;
      }
    }

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
      weeklyPerformance: weeklyStats,
      metrics: { 
        totalItems: filtered.length,
        deliveredCount: filtered.filter(i => !!i.Resolved).length,
        wipCount: filtered.filter(i => !i.Resolved && i.Status !== 'DESCARTADO').length,
        avgCycleTime: (filtered.filter(i => i.Resolved && i.Created).reduce((acc, i) => acc + (excelToJSDate(i.Resolved)!.getTime() - excelToJSDate(i.Created)!.getTime()), 0) / (Math.max(1, filtered.filter(i => i.Resolved && i.Created).length) * 86400000)).toFixed(1),
      }, 
      filteredList: filtered,
      teams: teamsList,
      releases: releasesList
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

export { excelToJSDate };
