import { useState, useEffect, useMemo } from 'react';
import type { DashboardItem } from '../types/jira';
import type { SMConfig } from '../config/sm-config';
import { startOfWeek, endOfWeek, isWithinInterval, addDays, subDays } from 'date-fns';
import importedData from '../data.json';

// Safe date parser to handle Jira timezone offsets correctly in all browsers
const parseDate = (d: string | null | undefined) => {
  if (!d) return new Date(0);
  return new Date(d);
};

export interface WeeklyConeMetrics {
  weekStart: Date;
  weekLabel: string;
  featuresTotal: number;
  transbordo: number;
  planejados: number;
  naoPlanejados: number;
  furaFila: number;
  realizado: number;
  descartados: number;
  novos: number;
  aFazer: number;
  leadTimeMed: number | null;
  cycleTimeMed: number | null;
}

export interface WeeklyFlowDataPoint {
  weekLabel: string;
  weekStart: Date;
  throughput: number;
  byType: Record<string, number>;
  leadTimeAvg: number | null;
  cycleTimeAvg: number | null;
  entradas: number;
  saidas: number;
  saldo: number;
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function useSMDashboardData(smConfig: SMConfig, selectedTeamId: string, daysAgo: number = 60, selectedRelease: string = 'ALL') {
  const [rawData, setRawData] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Simulate async loading to match the previous API, but load synchronously from the bundled import
      setRawData(importedData as unknown as DashboardItem[]);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const availableReleases = useMemo(() => {
    if (!rawData.length) return [];
    const teamsToInclude = selectedTeamId === 'ALL' 
      ? smConfig.teams 
      : smConfig.teams.filter(t => t.carCode === selectedTeamId);
    
    const teamItems = rawData.filter(item => {
      const itemTeamUpper = (item.Team || '').toUpperCase();
      return teamsToInclude.some(t => 
        t.teamFieldValues.some(val => {
          const valUpper = val.toUpperCase();
          return itemTeamUpper.includes(valUpper) || valUpper.includes(itemTeamUpper);
        }) || 
        t.keyPrefixes.some(prefix => item.Key.startsWith(prefix))
      );
    });
    const releases = teamItems.map(i => i.Release).filter(Boolean);
    return ['ALL', ...new Set(releases)].sort();
  }, [rawData, smConfig, selectedTeamId]);

  const data = useMemo(() => {
    if (!rawData.length) return null;

    // Filter by SM and team
    const teamsToInclude = selectedTeamId === 'ALL' 
      ? smConfig.teams 
      : smConfig.teams.filter(t => t.carCode === selectedTeamId);

    const filteredItems = rawData.filter(item => {
      // Logic from mapJiraIssueToDashboardItem ensures Team/Prefix is populated
      const itemTeamUpper = (item.Team || '').toUpperCase();
      return teamsToInclude.some(t => 
        t.teamFieldValues.some(val => {
          const valUpper = val.toUpperCase();
          return itemTeamUpper.includes(valUpper) || valUpper.includes(itemTeamUpper);
        }) || 
        t.keyPrefixes.some(prefix => item.Key.startsWith(prefix))
      );
    });

    const now = new Date();
    const periodStart = subDays(now, daysAgo);

    // Filter to issues matching selected release
    const releaseFilteredItems = filteredItems.filter(item => {
      return selectedRelease === 'ALL' || item.Release === selectedRelease;
    });

    // Filter to issues relevant to the period (created or updated or resolved in period)
    const activeItems = releaseFilteredItems.filter(item => {
      const created = parseDate(item.Created);
      const updated = parseDate(item.UpdatedAt);
      return created >= periodStart || updated >= periodStart;
    });

    // Generate weekly buckets (from periodStart to now)
    const weeks: WeeklyConeMetrics[] = [];
    let currStart = startOfWeek(periodStart, { weekStartsOn: 1 });
    
    // Calculate weeks up to the end of the current week
    const periodEnd = endOfWeek(now, { weekStartsOn: 1 });

    let previousAFazer = 0; // Transbordo

    while (currStart <= periodEnd) {
      const currEnd = endOfWeek(currStart, { weekStartsOn: 1 });
      const weekLabel = `${currStart.getDate().toString().padStart(2, '0')}/${(currStart.getMonth() + 1).toString().padStart(2, '0')}`;
      
      let planejados = 0;
      let naoPlanejados = 0;
      let furaFila = 0;
      let realizado = 0;
      let descartados = 0;
      let novos = 0;
      const weekLeadTimes: number[] = [];
      const weekCycleTimes: number[] = [];

      activeItems.forEach(item => {
        const created = parseDate(item.Created);
        const resolved = (item.Resolved ? parseDate(item.Resolved) : null) || (item.StatusCategory === 'DONE' && item.UpdatedAt ? parseDate(item.UpdatedAt) : null);
        const commit = item.CommitmentDate ? parseDate(item.CommitmentDate) : null;
        
        const isCreatedInWeek = isWithinInterval(created, { start: currStart, end: currEnd });
        const isResolvedInWeek = resolved && isWithinInterval(resolved, { start: currStart, end: currEnd });
        const isCommitInWeek = commit && isWithinInterval(commit, { start: currStart, end: currEnd });

        // Realizado (DONE)
        if (item.StatusCategory === 'DONE' && isResolvedInWeek) {
          realizado++;
          if (item.LeadTime !== null) weekLeadTimes.push(item.LeadTime);
          if (item.CycleTime !== null) weekCycleTimes.push(item.CycleTime);
        }

        // Descartados
        if ((item.Status === 'CANCELADO' || item.Status === 'DESCARTADO') && isResolvedInWeek) {
          descartados++;
        }

        // Planejados
        if (isCommitInWeek) {
          planejados++;
        }

        // Fura fila / Bugs
        const isBugOrUrgent = item.Type.toLowerCase() === 'bug' || item.FuraFila?.length > 0;
        if (isCreatedInWeek && isBugOrUrgent) {
          furaFila++;
        }

        // Não Planejados
        if (isCreatedInWeek && !isCommitInWeek && !isBugOrUrgent) {
          naoPlanejados++;
        }

        // Novos (Criado na semana, não é bug)
        if (isCreatedInWeek && item.Type.toLowerCase() !== 'bug') {
          novos++;
        }
      });

      // Features Totais (acumulado de criados)
      const featuresTotal = activeItems.filter(i => parseDate(i.Created) <= currEnd).length;

      const aFazer = previousAFazer + planejados + naoPlanejados + furaFila - realizado - descartados;
      
      const leadTimeMed = weekLeadTimes.length ? weekLeadTimes.reduce((a,b) => a+b, 0) / weekLeadTimes.length : null;
      const cycleTimeMed = weekCycleTimes.length ? weekCycleTimes.reduce((a,b) => a+b, 0) / weekCycleTimes.length : null;

      weeks.push({
        weekStart: currStart,
        weekLabel,
        featuresTotal,
        transbordo: previousAFazer,
        planejados,
        naoPlanejados,
        furaFila,
        realizado,
        descartados,
        novos,
        aFazer,
        leadTimeMed,
        cycleTimeMed
      });

      previousAFazer = Math.max(0, aFazer); // Prevent negative backlog
      currStart = addDays(currStart, 7);
    }

    // Global KPIs
    const doneItems = activeItems.filter(i => i.StatusCategory === 'DONE' && i.LeadTime !== null);
    const sortedLeadTimes = doneItems.map(i => i.LeadTime as number).sort((a,b) => a-b);
    const sortedCycleTimes = activeItems.filter(i => i.StatusCategory === 'DONE' && i.CycleTime !== null).map(i => i.CycleTime as number).sort((a,b) => a-b);
    
    const throughput = doneItems.length;
    const wip = activeItems.filter(i => i.StatusCategory === 'IN_PROGRESS').length;
    const globalAFazer = weeks.length > 0 ? weeks[weeks.length-1].aFazer : 0;
    
    const leadTimeAvg = sortedLeadTimes.length ? sortedLeadTimes.reduce((a,b) => a+b, 0) / sortedLeadTimes.length : null;
    const cycleTimeAvg = sortedCycleTimes.length ? sortedCycleTimes.reduce((a,b) => a+b, 0) / sortedCycleTimes.length : null;
    
    const leadTimeP85 = percentile(sortedLeadTimes, 0.85);
    const leadTimeP15 = percentile(sortedLeadTimes, 0.15);
    const cycleTimeMedian = percentile(sortedCycleTimes, 0.50);

    // ── Weekly Flow Data (for new charts) ──
    const normalizeType = (t: string): string => {
      const lower = t.toLowerCase();
      if (['story', 'história', 'historia'].includes(lower)) return 'História';
      if (['bug', 'defeito'].includes(lower)) return 'Bug';
      if (['task', 'tarefa'].includes(lower)) return 'Tarefa';
      if (lower === 'spike') return 'Spike';
      return 'Outros';
    };

    const weeklyFlowData: WeeklyFlowDataPoint[] = weeks.map(w => {
      const wStart = w.weekStart;
      const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });

      // Items resolved this week (DONE)
      const resolvedThisWeek = activeItems.filter(item => {
        const resolved = (item.Resolved ? parseDate(item.Resolved) : null) || (item.StatusCategory === 'DONE' && item.UpdatedAt ? parseDate(item.UpdatedAt) : null);
        return item.StatusCategory === 'DONE' && resolved && isWithinInterval(resolved, { start: wStart, end: wEnd });
      });

      // Items created this week
      const createdThisWeek = activeItems.filter(item => {
        const created = parseDate(item.Created);
        return isWithinInterval(created, { start: wStart, end: wEnd });
      });

      // By type breakdown
      const byType: Record<string, number> = { 'História': 0, 'Bug': 0, 'Tarefa': 0, 'Spike': 0, 'Outros': 0 };
      resolvedThisWeek.forEach(item => {
        const nType = normalizeType(item.Type);
        byType[nType] = (byType[nType] || 0) + 1;
      });

      // Lead/Cycle times for the week
      const wLeadTimes = resolvedThisWeek.filter(i => i.LeadTime !== null).map(i => i.LeadTime as number);
      const wCycleTimes = resolvedThisWeek.filter(i => i.CycleTime !== null).map(i => i.CycleTime as number);

      return {
        weekLabel: w.weekLabel,
        weekStart: wStart,
        throughput: resolvedThisWeek.length,
        byType,
        leadTimeAvg: wLeadTimes.length ? Math.round(wLeadTimes.reduce((a,b) => a+b, 0) / wLeadTimes.length) : null,
        cycleTimeAvg: wCycleTimes.length ? Math.round(wCycleTimes.reduce((a,b) => a+b, 0) / wCycleTimes.length) : null,
        entradas: createdThisWeek.length,
        saidas: resolvedThisWeek.length,
        saldo: createdThisWeek.length - resolvedThisWeek.length,
      };
    });

    // ── Issue Type Breakdown (Donut) ──
    const allDone = activeItems.filter(i => i.StatusCategory === 'DONE');
    const issueTypeBreakdown: { name: string; value: number; color: string }[] = [];
    const typeColors: Record<string, string> = {
      'História': '#3B82F6', 'Bug': '#EF4444', 'Tarefa': '#10B981', 'Spike': '#8B5CF6', 'Outros': '#94A3B8'
    };
    const typeCounts: Record<string, number> = {};
    allDone.forEach(i => {
      const nType = normalizeType(i.Type);
      typeCounts[nType] = (typeCounts[nType] || 0) + 1;
    });
    Object.entries(typeCounts).sort((a,b) => b[1]-a[1]).forEach(([name, value]) => {
      issueTypeBreakdown.push({ name, value, color: typeColors[name] || '#94A3B8' });
    });

    // ── Lead Time & Cycle Time Histograms ──
    const buckets = [
      { label: '0-5d', min: 0, max: 5 },
      { label: '6-10d', min: 6, max: 10 },
      { label: '11-15d', min: 11, max: 15 },
      { label: '16-20d', min: 16, max: 20 },
      { label: '21-30d', min: 21, max: 30 },
      { label: '31+d', min: 31, max: Infinity },
    ];
    const leadTimeHistogram = buckets.map(b => ({
      range: b.label,
      count: sortedLeadTimes.filter(v => v >= b.min && v <= b.max).length
    }));
    const cycleTimeHistogram = buckets.map(b => ({
      range: b.label,
      count: sortedCycleTimes.filter(v => v >= b.min && v <= b.max).length
    }));

    return {
      items: activeItems,
      weeks,
      weeklyFlowData,
      issueTypeBreakdown,
      leadTimeHistogram,
      cycleTimeHistogram,
      kpis: {
        throughput,
        leadTimeAvg: leadTimeAvg ? Math.round(leadTimeAvg) : null,
        leadTimeP85: leadTimeP85 ? Math.round(leadTimeP85) : null,
        leadTimeP15: leadTimeP15 ? Math.round(leadTimeP15) : null,
        cycleTimeAvg: cycleTimeAvg ? Math.round(cycleTimeAvg) : null,
        cycleTimeMedian: cycleTimeMedian ? Math.round(cycleTimeMedian) : null,
        wip,
        aFazer: globalAFazer
      },
      debug: {
        raw: rawData.length,
        filtered: filteredItems.length,
        active: activeItems.length
      }
    };
  }, [rawData, smConfig, selectedTeamId, daysAgo, selectedRelease]);

  return { data, loading, error, availableReleases };
}
