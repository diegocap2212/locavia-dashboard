import { useState, useEffect, useMemo } from 'react';
import type { DashboardItem } from '../types/jira';
import type { SMConfig } from '../config/sm-config';
import { startOfWeek, endOfWeek, isWithinInterval, addDays, subDays } from 'date-fns';
import { fetchData } from '../services/dataService';
import { excelToJSDate } from './useDashboardData';
import { computeCFD } from '../cfd/computeCFD';

// Safe date parser to handle Jira timezone offsets correctly in all browsers
const parseDate = (d: string | null | undefined) => {
  if (!d) return new Date(0);
  const parsed = excelToJSDate(d);
  return parsed && !isNaN(parsed.getTime()) ? parsed : new Date(0);
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
  pointsCommitted: number;
  pointsDelivered: number;
}

export interface WeeklyFlowDataPoint {
  weekLabel: string;
  weekStart: Date;
  throughput: number;
  byType: Record<string, number>;
  leadTimeAvg: number | null;
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

const isSameDay = (d1: Date, d2: Date) => 
  d1.getFullYear() === d2.getFullYear() && 
  d1.getMonth() === d2.getMonth() && 
  d1.getDate() === d2.getDate();

export function useSMDashboardData(
  smConfig: SMConfig, 
  selectedTeamId: string, 
  daysAgo: number = 60, 
  selectedRelease: string = 'ALL',
  customStartDate?: string,
  customEndDate?: string
) {
  const [rawData, setRawData] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const items = await fetchData();
        if (alive) { setRawData(items as unknown as DashboardItem[]); setError(null); }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
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

    const periodStart = customStartDate ? new Date(customStartDate) : subDays(new Date(), daysAgo);
    const periodEnd = customEndDate ? new Date(customEndDate) : new Date();

    // Filter to issues matching selected release
    const releaseFilteredItems = filteredItems.filter(item => {
      return selectedRelease === 'ALL' || item.Release === selectedRelease;
    });

    // Filter to issues relevant to the period (created <= periodEnd and (not resolved or resolved >= periodStart))
    const activeItems = releaseFilteredItems.filter(item => {
      const created = parseDate(item.Created);
      const resolved = item.Resolved ? parseDate(item.Resolved) : null;
      if (created > periodEnd) return false;
      if (resolved && resolved < periodStart) return false;
      return true;
    });

    // Helper to normalize issue types
    const normalizeType = (t: string): string => {
      const lower = t.toLowerCase();
      if (['story', 'história', 'historia'].includes(lower)) return 'História';
      if (['bug', 'defeito'].includes(lower)) return 'Bug';
      if (['task', 'tarefa'].includes(lower)) return 'Tarefa';
      if (lower === 'spike') return 'Spike';
      return 'Outros';
    };

    // Calculate weekly metrics over complete history to compute correct backlog (transbordo)
    const weeks: WeeklyConeMetrics[] = [];
    
    // Find the earliest created issue date in the dataset to start calculations
    const earliestItemDate = releaseFilteredItems.reduce((acc, item) => {
      const created = parseDate(item.Created);
      return created.getTime() > 0 && created < acc ? created : acc;
    }, new Date());
    
    let currStart = startOfWeek(earliestItemDate.getTime() > 0 ? earliestItemDate : new Date(2024, 11, 1), { weekStartsOn: 1 });
    const periodEndLimit = endOfWeek(periodEnd, { weekStartsOn: 1 });

    const featuresTotal = releaseFilteredItems.length;

    let previousAFazer = 0; // Transbordo carry-over
    let prevDescartadosCommitted = 0;
    let prevPlanejados = 0;
    let prevNaoPlanejados = 0;
    let prevFuraFila = 0;
    let prevRealizado = 0;

    while (currStart <= periodEndLimit) {
      const currEnd = endOfWeek(currStart, { weekStartsOn: 1 });
      const weekLabel = `${currStart.getDate().toString().padStart(2, '0')}/${(currStart.getMonth() + 1).toString().padStart(2, '0')}`;
      
      let planejadosCount = 0;
      let descartadosCommittedCount = 0;
      let naoPlanejadosCount = 0;
      let bugsCount = 0;
      let realizadoCount = 0;
      let descartadosCount = 0;
      let novosCount = 0;
      let weekPointsCommitted = 0;
      let weekPointsDelivered = 0;
      const weekLeadTimes: number[] = [];

      releaseFilteredItems.forEach(item => {
        const created = parseDate(item.Created);
        const resolved = (item.Resolved ? parseDate(item.Resolved) : null) || (item.StatusCategory === 'DONE' && item.UpdatedAt ? parseDate(item.UpdatedAt) : null);
        const commit = item.CommitmentDate ? parseDate(item.CommitmentDate) : null;
        
        const isCreatedInWeek = isWithinInterval(created, { start: currStart, end: currEnd });
        const isResolvedInWeek = resolved && isWithinInterval(resolved, { start: currStart, end: currEnd });
        const isBug = item.Type.toLowerCase() === 'bug';

        // Planejados (G)
        if (commit) {
          const isCommitOnFirstDay = isSameDay(commit, currStart);
          if (isCommitOnFirstDay && !isBug) {
            planejadosCount++;
          }
          
          const isCommitInWeek = isWithinInterval(commit, { start: currStart, end: currEnd });
          const isDescartadoInWeek = (item.Status === 'CANCELADO' || item.Status === 'DESCARTADO') && isResolvedInWeek;
          if (isCommitInWeek && isDescartadoInWeek) {
            descartadosCommittedCount++;
          }
        }

        // Não Planejados (H)
        if (commit && !isBug) {
          const isCommitInWeek = isWithinInterval(commit, { start: currStart, end: currEnd });
          const isCommitOnFirstDay = isSameDay(commit, currStart);
          if (isCommitInWeek && !isCommitOnFirstDay) {
            naoPlanejadosCount++;
          }
        }

        // Bugs (I)
        if (commit && isBug) {
          const isCommitInWeek = isWithinInterval(commit, { start: currStart, end: currEnd });
          if (isCommitInWeek) {
            bugsCount++;
          }
        }

        // Pontos comprometidos: qualquer item com CommitmentDate na semana
        // (espelha "Entrada (Total)" = planejados + não planejados + fura-fila).
        if (commit && isWithinInterval(commit, { start: currStart, end: currEnd })) {
          weekPointsCommitted += item.StoryPoints || 0;
        }

        // Realizado (J)
        if (item.StatusCategory === 'DONE' && isResolvedInWeek) {
          realizadoCount++;
          if (item.LeadTime !== null && item.LeadTime !== undefined) weekLeadTimes.push(item.LeadTime);
        }

        // Pontos entregues: itens DONE resolvidos na semana, exceto cancelados/descartados (espelha "Realizadas").
        if (item.StatusCategory === 'DONE' && isResolvedInWeek && item.Status !== 'CANCELADO' && item.Status !== 'DESCARTADO') {
          weekPointsDelivered += item.StoryPoints || 0;
        }

        // Descartados (K)
        if ((item.Status === 'CANCELADO' || item.Status === 'DESCARTADO') && isResolvedInWeek) {
          descartadosCount++;
        }

        // Novos
        if (isCreatedInWeek && !isBug) {
          novosCount++;
        }
      });

      const descartados = descartadosCount;
      const realizado = Math.max(0, realizadoCount - descartados);
      const planejados = planejadosCount - descartadosCommittedCount;
      const naoPlanejados = naoPlanejadosCount;
      const furaFila = bugsCount;
      const novos = novosCount;

      let transbordo = 0;
      if (weeks.length > 0) {
        transbordo = Math.max(0, prevPlanejados + previousAFazer + prevNaoPlanejados + prevFuraFila - prevRealizado) - prevDescartadosCommitted;
        transbordo = Math.max(0, transbordo);
      }

      // Static Burndown: totalFeatures minus resolved before current week start
      const resolvedBeforeStart = releaseFilteredItems.filter(i => {
        const resolved = (i.Resolved ? parseDate(i.Resolved) : null) || (i.StatusCategory === 'DONE' && i.UpdatedAt ? parseDate(i.UpdatedAt) : null);
        return i.StatusCategory === 'DONE' && resolved && resolved < currStart;
      }).length;

      const aFazer = Math.max(0, featuresTotal - resolvedBeforeStart);
      const leadTimeMed = weekLeadTimes.length ? weekLeadTimes.reduce((a,b) => a+b, 0) / weekLeadTimes.length : null;

      weeks.push({
        weekStart: currStart,
        weekLabel,
        featuresTotal,
        transbordo,
        planejados,
        naoPlanejados,
        furaFila,
        realizado,
        descartados,
        novos,
        aFazer,
        leadTimeMed,
        pointsCommitted: weekPointsCommitted,
        pointsDelivered: weekPointsDelivered
      });

      previousAFazer = transbordo;
      prevPlanejados = planejados;
      prevNaoPlanejados = naoPlanejados;
      prevFuraFila = furaFila;
      prevRealizado = realizado;
      prevDescartadosCommitted = descartadosCommittedCount;

      currStart = addDays(currStart, 7);
    }

    // Filter weekly buckets to selected period
    const startOfWeekLimit = startOfWeek(periodStart, { weekStartsOn: 1 });
    const endOfWeekLimit = endOfWeek(periodEnd, { weekStartsOn: 1 });
    const filteredWeeks = weeks.filter(w => w.weekStart >= startOfWeekLimit && w.weekStart <= endOfWeekLimit);

    // Calculate weekly flow trend points over complete history
    const weeklyFlowData: WeeklyFlowDataPoint[] = weeks.map(w => {
      const wStart = w.weekStart;
      const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });

      // Items resolved this week (DONE)
      const resolvedThisWeek = releaseFilteredItems.filter(item => {
        const resolved = (item.Resolved ? parseDate(item.Resolved) : null) || (item.StatusCategory === 'DONE' && item.UpdatedAt ? parseDate(item.UpdatedAt) : null);
        return item.StatusCategory === 'DONE' && resolved && isWithinInterval(resolved, { start: wStart, end: wEnd });
      });

      // Items created this week
      const createdThisWeek = releaseFilteredItems.filter(item => {
        const created = parseDate(item.Created);
        return isWithinInterval(created, { start: wStart, end: wEnd });
      });

      // By type breakdown
      const byType: Record<string, number> = { 'História': 0, 'Bug': 0, 'Tarefa': 0, 'Spike': 0, 'Outros': 0 };
      resolvedThisWeek.forEach(item => {
        const nType = normalizeType(item.Type);
        byType[nType] = (byType[nType] || 0) + 1;
      });

      // Lead times for the week
      const wLeadTimes = resolvedThisWeek.filter(i => i.LeadTime !== null && i.LeadTime !== undefined).map(i => i.LeadTime as number);

      return {
        weekLabel: w.weekLabel,
        weekStart: wStart,
        throughput: resolvedThisWeek.length,
        byType,
        leadTimeAvg: wLeadTimes.length ? Math.round(wLeadTimes.reduce((a,b) => a+b, 0) / wLeadTimes.length) : null,
        entradas: createdThisWeek.length,
        saidas: resolvedThisWeek.length,
        saldo: createdThisWeek.length - resolvedThisWeek.length,
      };
    });

    // Filter weekly flow trend points to selected period
    const filteredWeeklyFlowData = weeklyFlowData.filter(w => w.weekStart >= startOfWeekLimit && w.weekStart <= endOfWeekLimit);

    // ── CFD (Cumulative Flow Diagram) — saída ADITIVA ──
    // Usa o MESMO recorte (releaseFilteredItems) e as MESMAS semanas dos demais gráficos.
    // O acumulado é calculado sobre todo o histórico e depois recortado ao período visível,
    // para que as bandas reflitam corretamente tudo que já foi concluído antes da janela.
    const cfdResult = computeCFD(releaseFilteredItems, weeks);
    const cfdData = cfdResult.points.filter(p => p.weekStart >= startOfWeekLimit && p.weekStart <= endOfWeekLimit);

    // Global KPIs constrained to the selected period
    const doneItems = releaseFilteredItems.filter(i => {
      const resolved = i.Resolved ? parseDate(i.Resolved) : null;
      return i.StatusCategory === 'DONE' && resolved && resolved >= periodStart && resolved <= periodEnd && i.LeadTime !== null && i.LeadTime !== undefined;
    });
    const sortedLeadTimes = doneItems.map(i => i.LeadTime as number).sort((a,b) => a-b);
    
    const throughput = doneItems.length;
    const wip = activeItems.filter(i => i.StatusCategory === 'IN_PROGRESS').length;
    const globalAFazer = filteredWeeks.length > 0 ? filteredWeeks[filteredWeeks.length-1].aFazer : 0;
    
    const leadTimeAvg = sortedLeadTimes.length ? sortedLeadTimes.reduce((a,b) => a+b, 0) / sortedLeadTimes.length : null;
    
    const leadTimeP85 = percentile(sortedLeadTimes, 0.85);
    const leadTimeP15 = percentile(sortedLeadTimes, 0.15);

    // ── Issue Type Breakdown (Donut) ──
    const issueTypeBreakdown: { name: string; value: number; color: string }[] = [];
    const typeColors: Record<string, string> = {
      'História': '#15803A', 'Bug': '#E5484D', 'Tarefa': '#5FE389', 'Spike': '#9EB8A0', 'Outros': '#82928A'
    };
    const typeCounts: Record<string, number> = {};
    doneItems.forEach(i => {
      const nType = normalizeType(i.Type);
      typeCounts[nType] = (typeCounts[nType] || 0) + 1;
    });
    Object.entries(typeCounts).sort((a,b) => b[1]-a[1]).forEach(([name, value]) => {
      issueTypeBreakdown.push({ name, value, color: typeColors[name] || '#94A3B8' });
    });

    // ── Lead Time Histograms ──
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

    // ── Pontos (Story Points) no período ──
    // Totais derivados das semanas filtradas para bater 1:1 com os gráficos.
    const pointsDeliveredTotal = filteredWeeks.reduce((acc, w) => acc + w.pointsDelivered, 0);
    const pointsCommittedTotal = filteredWeeks.reduce((acc, w) => acc + w.pointsCommitted, 0);
    // Cobertura de estimativa: % dos itens entregues no período que têm StoryPoints preenchido.
    const deliveredInPeriod = releaseFilteredItems.filter(i => {
      const resolved = (i.Resolved ? parseDate(i.Resolved) : null) || (i.StatusCategory === 'DONE' && i.UpdatedAt ? parseDate(i.UpdatedAt) : null);
      return i.StatusCategory === 'DONE' && resolved && resolved >= periodStart && resolved <= periodEnd && i.Status !== 'CANCELADO' && i.Status !== 'DESCARTADO';
    });
    const deliveredWithPoints = deliveredInPeriod.filter(i => i.StoryPoints !== null && i.StoryPoints !== undefined).length;
    const pointsCoverage = deliveredInPeriod.length > 0 ? Math.round((deliveredWithPoints / deliveredInPeriod.length) * 100) : 0;

    return {
      items: activeItems,
      weeks: filteredWeeks,
      weeklyFlowData: filteredWeeklyFlowData,
      cfdData,
      cfdCoverage: cfdResult.startDateCoverage,
      issueTypeBreakdown,
      leadTimeHistogram,
      kpis: {
        throughput,
        leadTimeAvg: leadTimeAvg ? Math.round(leadTimeAvg) : null,
        leadTimeP85: leadTimeP85 ? Math.round(leadTimeP85) : null,
        leadTimeP15: leadTimeP15 ? Math.round(leadTimeP15) : null,
        wip,
        aFazer: globalAFazer,
        pointsDelivered: pointsDeliveredTotal,
        pointsCommitted: pointsCommittedTotal,
        pointsCoverage
      },
      debug: {
        raw: rawData.length,
        filtered: filteredItems.length,
        active: activeItems.length
      }
    };
  }, [rawData, smConfig, selectedTeamId, daysAgo, selectedRelease, customStartDate, customEndDate]);

  return { data, loading, error, availableReleases };
}
