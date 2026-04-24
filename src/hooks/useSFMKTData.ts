import { useMemo, useState } from 'react';
import type {
  SFMKTItem,
  SFMKTDashboardData,
  SprintMetrics,
  AssigneeMetrics,
  DataQualitySummary,
} from '../types/sfmkt';
import rawData from '../../sfmkt_data.json';

const data = rawData as SFMKTDashboardData;

// ────────────────────────────────────────────────────────────────────────────
// Period helpers
// ────────────────────────────────────────────────────────────────────────────

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

// ────────────────────────────────────────────────────────────────────────────
// Main hook
// ────────────────────────────────────────────────────────────────────────────

export type PeriodFilter = '60d' | '120d';

export function useSFMKTData() {
  const [period, setPeriod] = useState<PeriodFilter>('60d');

  const cutoffDate = useMemo(() => {
    return period === '60d' ? subDays(new Date(), 60) : subDays(new Date(), 120);
  }, [period]);

  // All items within the selected window (based on created date)
  const items = useMemo<SFMKTItem[]>(() => {
    return data.items.filter(i => new Date(i.created) >= cutoffDate);
  }, [cutoffDate]);

  // Done items within window
  const doneItems = useMemo(() => items.filter(i => i.statusCategory === 'DONE'), [items]);
  const inProgressItems = useMemo(() => items.filter(i => i.statusCategory === 'IN_PROGRESS'), [items]);
  const todoItems = useMemo(() => items.filter(i => i.statusCategory === 'TODO'), [items]);

  // ── KPI: Lead Time ────────────────────────────────────────────────────────
  const leadTimes = doneItems.map(i => i.leadTimeDays).filter((v): v is number => v !== null);
  const avgLeadTime = leadTimes.length
    ? Math.round(leadTimes.reduce((s, v) => s + v, 0) / leadTimes.length)
    : null;
  const medianLeadTime = median(leadTimes);

  // ── KPI: Cycle Time ───────────────────────────────────────────────────────
  const cycleTimes = doneItems.map(i => i.cycleTimeDays).filter((v): v is number => v !== null);
  const avgCycleTime = cycleTimes.length
    ? Math.round(cycleTimes.reduce((s, v) => s + v, 0) / cycleTimes.length)
    : null;
  const medianCycleTime = median(cycleTimes);

  // ── Throughput: weekly ────────────────────────────────────────────────────
  const weeklyThroughput = useMemo(() => {
    const weeks: Record<string, { week: string; total: number; byType: Record<string, number>; avgLeadTime: number | null }> = {};

    for (const item of doneItems) {
      const resolved = item.resolved;
      if (!resolved) continue;
      const d = new Date(resolved);
      // Get Monday of that week
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      const key = monday.toISOString().slice(0, 10);
      const label = `${monday.getDate().toString().padStart(2,'0')}/${(monday.getMonth()+1).toString().padStart(2,'0')}`;

      if (!weeks[key]) {
        weeks[key] = { week: label, total: 0, byType: {}, avgLeadTime: null };
      }
      weeks[key].total++;
      weeks[key].byType[item.type] = (weeks[key].byType[item.type] || 0) + 1;
    }

    // Compute avgLeadTime per week
    const weekLeadTimes: Record<string, number[]> = {};
    for (const item of doneItems) {
      const resolved = item.resolved;
      if (!resolved || item.leadTimeDays === null) continue;
      const d = new Date(resolved);
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      const key = monday.toISOString().slice(0, 10);
      if (!weekLeadTimes[key]) weekLeadTimes[key] = [];
      weekLeadTimes[key].push(item.leadTimeDays);
    }
    for (const key of Object.keys(weeks)) {
      const lts = weekLeadTimes[key];
      if (lts && lts.length) {
        weeks[key].avgLeadTime = Math.round(lts.reduce((s, v) => s + v, 0) / lts.length);
      }
    }

    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        name: v.week,
        Entregues: v.total,
        'Lead Time Méd': v.avgLeadTime,
        ...v.byType,
      }));
  }, [doneItems]);

  // ── Sprint Metrics ────────────────────────────────────────────────────────
  const sprintMetrics = useMemo<SprintMetrics[]>(() => {
    const sprintMap: Record<string, {
      name: string; id: number | null; state: 'active' | 'closed' | 'future';
      issues: SFMKTItem[];
    }> = {};

    for (const item of items) {
      if (!item.sprint) continue;
      const key = item.sprint;
      if (!sprintMap[key]) {
        sprintMap[key] = {
          name: item.sprint,
          id: item.sprintId,
          state: item.sprintState || 'closed',
          issues: [],
        };
      }
      sprintMap[key].issues.push(item);
    }

    return Object.values(sprintMap)
      .map(s => {
        const sprintDone = s.issues.filter(i => i.statusCategory === 'DONE');
        const lts = sprintDone.map(i => i.leadTimeDays).filter((v): v is number => v !== null);
        const cts = sprintDone.map(i => i.cycleTimeDays).filter((v): v is number => v !== null);
        const byType: Record<string, number> = {};
        for (const i of sprintDone) {
          byType[i.type] = (byType[i.type] || 0) + 1;
        }
        const dqIssues = s.issues.filter(i => !Object.values(i.dq).some(v => v));
        const score = s.issues.length ? Math.round((dqIssues.length / s.issues.length) * 100) : 100;
        return {
          sprintName: s.name,
          sprintId: s.id,
          startDate: null,
          endDate: null,
          state: s.state,
          throughput: sprintDone.length,
          throughputByType: byType,
          avgLeadTimeDays: lts.length ? Math.round(lts.reduce((a,b) => a+b,0)/lts.length) : null,
          medianLeadTimeDays: median(lts),
          avgCycleTimeDays: cts.length ? Math.round(cts.reduce((a,b) => a+b,0)/cts.length) : null,
          wipAtEnd: s.issues.filter(i => i.statusCategory === 'IN_PROGRESS').length,
          dataQualityScore: score,
        };
      })
      .sort((a, b) => (a.sprintId || 0) - (b.sprintId || 0));
  }, [items]);

  // ── Assignee Metrics ──────────────────────────────────────────────────────
  const assigneeMetrics = useMemo<AssigneeMetrics[]>(() => {
    const map: Record<string, SFMKTItem[]> = {};
    for (const item of items) {
      const key = item.assignee || '(Sem assignee)';
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return Object.entries(map)
      .map(([assignee, issues]) => {
        const resolved = issues.filter(i => i.statusCategory === 'DONE');
        const lts = resolved.map(i => i.leadTimeDays).filter((v): v is number => v !== null);
        const cts = resolved.map(i => i.cycleTimeDays).filter((v): v is number => v !== null);
        const byType: Record<string, number> = {};
        for (const i of issues) byType[i.type] = (byType[i.type] || 0) + 1;
        const dqOk = issues.filter(i => !Object.values(i.dq).some(v => v));
        return {
          assignee,
          totalIssues: issues.length,
          resolvedIssues: resolved.length,
          wipIssues: issues.filter(i => i.statusCategory === 'IN_PROGRESS').length,
          avgLeadTimeDays: lts.length ? Math.round(lts.reduce((a,b)=>a+b,0)/lts.length) : null,
          avgCycleTimeDays: cts.length ? Math.round(cts.reduce((a,b)=>a+b,0)/cts.length) : null,
          typeBreakdown: byType,
          dataQualityScore: issues.length ? Math.round((dqOk.length / issues.length) * 100) : 100,
        };
      })
      .sort((a, b) => b.totalIssues - a.totalIssues);
  }, [items]);

  // ── Lead Time Histogram ───────────────────────────────────────────────────
  const leadTimeHistogram = useMemo(() => {
    const buckets = [
      { label: '1-5d', min: 1, max: 5 },
      { label: '6-10d', min: 6, max: 10 },
      { label: '11-20d', min: 11, max: 20 },
      { label: '21-30d', min: 21, max: 30 },
      { label: '31-60d', min: 31, max: 60 },
      { label: '>60d', min: 61, max: Infinity },
    ];
    return buckets.map(b => ({
      name: b.label,
      count: doneItems.filter(i => i.leadTimeDays !== null && i.leadTimeDays >= b.min && i.leadTimeDays <= b.max).length,
    }));
  }, [doneItems]);

  // ── Data Quality Summary ──────────────────────────────────────────────────
  const dataQuality = useMemo<DataQualitySummary>(() => {
    const total = items.length;
    const done = doneItems.length;
    const inProg = inProgressItems.length;

    const doneWithoutRes = doneItems.filter(i => i.dq.missingResolutionDate).length;
    const noAssignee = items.filter(i => i.dq.missingAssignee).length;
    const noCycle = doneItems.filter(i => i.dq.doneWithoutCycleData).length;
    const noSprint = items.filter(i => i.dq.noSprint).length;
    const stale = items.filter(i => i.dq.staleTodo).length;
    const longLead = doneItems.filter(i => i.dq.suspiciouslyLongLead).length;

    // Score: start at 100, deduct per issue
    // Weighted: missing resolution = big problem, no assignee = medium, etc.
    const penaltyPoints = (doneWithoutRes * 3) + (noAssignee * 1.5) + (noCycle * 2) + (noSprint * 1) + (stale * 1) + (longLead * 0.5);
    const maxPenalty = total * 3;
    const overallScore = total ? Math.max(0, Math.round(100 - (penaltyPoints / maxPenalty) * 100)) : 100;

    const pct = (n: number, d: number) => d ? Math.round((n / d) * 100) : 0;

    return {
      totalIssues: total,
      doneWithoutResolutionDate: doneWithoutRes,
      inProgressWithoutAssignee: inProgressItems.filter(i => i.dq.missingAssignee).length,
      doneWithoutCycleData: noCycle,
      withoutSprint: noSprint,
      staleTodo: stale,
      suspiciouslyLongLead: longLead,
      pctDoneWithoutResolutionDate: pct(doneWithoutRes, done),
      pctInProgressWithoutAssignee: pct(inProgressItems.filter(i => i.dq.missingAssignee).length, inProg || 1),
      pctDoneWithoutCycleData: pct(noCycle, done),
      pctWithoutSprint: pct(noSprint, total),
      pctStaleTodo: pct(stale, total),
      pctSuspiciouslyLongLead: pct(longLead, done),
      overallScore,
    };
  }, [items, doneItems, inProgressItems]);

  // ── Lead Time scatter (for scatter chart) ────────────────────────────────
  const leadTimeScatter = useMemo(() => {
    return doneItems
      .filter(i => i.resolved && i.leadTimeDays !== null)
      .map(i => ({
        key: i.key,
        summary: i.summary.slice(0, 60),
        type: i.type,
        assignee: i.assignee || '(Sem assignee)',
        date: i.resolved!.slice(0, 10),
        leadTime: i.leadTimeDays!,
        cycleTime: i.cycleTimeDays,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [doneItems]);

  return {
    // Raw
    allItems: items,
    doneItems,
    inProgressItems,
    todoItems,
    syncedAt: data.synced_at,
    totalFetched: data.total_fetched,

    // Period filter
    period,
    setPeriod,

    // KPIs
    kpis: {
      totalItems: items.length,
      throughput: doneItems.length,
      wip: inProgressItems.length,
      backlog: todoItems.length,
      avgLeadTime,
      medianLeadTime,
      avgCycleTime,
      medianCycleTime,
    },

    // Charts
    weeklyThroughput,
    sprintMetrics,
    assigneeMetrics,
    leadTimeHistogram,
    leadTimeScatter,
    dataQuality,
  };
}
