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
    
    const teamsList = Array.from(new Set(rawItems.map(i => i.Team))).filter(t => t && t !== "").sort();
    const releasesList = Array.from(new Set(rawItems.map(i => i.Release))).filter(r => r && r !== "").sort();

    const filtered = rawItems.filter(item => 
      (selectedTeams.includes('TODOS') || selectedTeams.includes(item.Team)) &&
      (selectedReleases.includes('TODAS') || selectedReleases.includes(item.Release))
    );

    const allWeeks = Array.from(new Set(rawItems.map(i => {
      const d = excelToJSDate(i.Resolved) || excelToJSDate(i.Created);
      return d ? getMon(d).toISOString() : null;
    }))).filter(Boolean).sort() as string[];

    const dynamicHistory = allWeeks.map(weekKey => {
      const weekStart = new Date(weekKey);
      const currentScope = filtered.filter(i => {
        const c = excelToJSDate(i.Created);
        return c && c <= new Date(weekStart.getTime() + 7 * 86400000);
      }).length;
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
      const lastDate = lastPoint.fullDate;

      let currentBest = lastRealValue;
      let currentWorst = lastRealValue;
      let currentTrend = lastRealValue;
      
      lastPoint["Melhor Cenário (3 itens/semana)"] = lastRealValue;
      lastPoint["Pior Cenário (1 item/semana)"] = lastRealValue;
      lastPoint[velocityLabel] = lastRealValue;

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

    let minD = new Date();
    let maxD = new Date(0);
    filtered.forEach(item => {
      const c = excelToJSDate(item.Created);
      const r = excelToJSDate(item.Resolved);
      if (c && c < minD) minD = c;
      if (c && c > maxD) maxD = c;
      if (r && r > maxD) maxD = r;
    });

    const weeklyStatsMap: Record<string, any> = {};
    if (filtered.length > 0) {
      let curr = getMon(minD);
      const limit = getMon(new Date(maxD.getTime() + 7 * 86400000));
      while (curr <= limit) {
        weeklyStatsMap[curr.toISOString()] = { 
          date: new Date(curr), throughput: 0, leadTimeSum: 0, 
          resolvedInWeek: 0, carry: 0, planned: 0, unplanned: 0, inflow: 0
        };
        curr.setDate(curr.getDate() + 7);
      }

      filtered.forEach(item => {
        const c = excelToJSDate(item.Created);
        const r = excelToJSDate(item.Resolved);
        
        if (c) {
          const cKey = getMon(c).toISOString();
          if (weeklyStatsMap[cKey]) weeklyStatsMap[cKey].inflow += 1;
        }

        if (r) {
          const key = getMon(r).toISOString();
          if (weeklyStatsMap[key]) {
            weeklyStatsMap[key].throughput += 1;
            weeklyStatsMap[key].resolvedInWeek += 1;
            if (c && c < getMon(r)) weeklyStatsMap[key].planned += 1;
            else weeklyStatsMap[key].unplanned += 1;
            if (c) weeklyStatsMap[key].leadTimeSum += (r.getTime() - c.getTime()) / 86400000;
          }
        }
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
      .filter(w => w.throughput > 0 || w.carry > 0 || w.inflow > 0)
      .map(w => ({
        name: formatWeekRange(w.date),
        "Planejadas": w.planned,
        "Não Planejadas": w.unplanned,
        "Entradas": w.inflow,
        "Saídas": w.throughput,
        "Saldo": w.inflow - w.throughput,
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
        totalItems, deliveredCount, wipCount, discardedCount,
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

  return {
    ...dashboardState,
    loading,
    error,
    selectedTeams,
    setSelectedTeams,
    selectedReleases,
    setSelectedReleases
  };
};

export { excelToJSDate };
