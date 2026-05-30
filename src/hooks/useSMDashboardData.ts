import { useState, useEffect, useMemo } from 'react';
import type { DashboardItem } from '../types/jira';
import type { SMConfig } from '../config/sm-config';
import { parseISO, startOfWeek, endOfWeek, isWithinInterval, addDays, subDays } from 'date-fns';
import importedData from '../data.json';

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

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function useSMDashboardData(smConfig: SMConfig, selectedTeamId: string, daysAgo: number = 60) {
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

  const data = useMemo(() => {
    if (!rawData.length) return null;

    // Filter by SM and team
    const teamsToInclude = selectedTeamId === 'ALL' 
      ? smConfig.teams 
      : smConfig.teams.filter(t => t.carCode === selectedTeamId);

    const filteredItems = rawData.filter(item => {
      // Logic from mapJiraIssueToDashboardItem ensures Team/Prefix is populated
      return teamsToInclude.some(t => 
        t.teamFieldValues.includes(item.Team) || 
        t.keyPrefixes.some(prefix => item.Key.startsWith(prefix))
      );
    });

    const now = new Date();
    const periodStart = subDays(now, daysAgo);

    // Filter to issues relevant to the period (created or updated or resolved in period)
    const activeItems = filteredItems.filter(item => {
      const created = parseISO(item.Created);
      const updated = parseISO(item.UpdatedAt);
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
        const created = parseISO(item.Created);
        const resolved = item.Resolved ? parseISO(item.Resolved) : null;
        const commit = item.CommitmentDate ? parseISO(item.CommitmentDate) : null;
        
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
      const featuresTotal = activeItems.filter(i => parseISO(i.Created) <= currEnd).length;

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

    return {
      items: activeItems,
      weeks,
      kpis: {
        throughput,
        leadTimeAvg: leadTimeAvg ? Math.round(leadTimeAvg) : null,
        leadTimeP85: leadTimeP85 ? Math.round(leadTimeP85) : null,
        leadTimeP15: leadTimeP15 ? Math.round(leadTimeP15) : null,
        cycleTimeAvg: cycleTimeAvg ? Math.round(cycleTimeAvg) : null,
        cycleTimeMedian: cycleTimeMedian ? Math.round(cycleTimeMedian) : null,
        wip,
        aFazer: globalAFazer
      }
    };
  }, [rawData, smConfig, selectedTeamId, daysAgo]);

  return { data, loading, error };
}
