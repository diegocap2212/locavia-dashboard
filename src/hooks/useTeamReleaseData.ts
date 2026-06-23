import { useState, useEffect, useMemo } from 'react';
import { fetchData, type JiraItem } from '../services/dataService';
import releaseConfig from '../config/release-config.json';
import { excelToJSDate } from './useDashboardData';
import { normalizeReleaseId } from '../lib/normalizeRelease';

export interface ReleaseBreakdown {
  releaseId: string;
  displayName: string;
  isOfficial: boolean; // existe no release-config (clicável → /release/:id)
  total: number;
  delivered: number;
  wip: number;
  avgLeadTime: number; // dias
}

export interface TeamTotals {
  total: number;
  delivered: number;
  wip: number;
  avgLeadTime: number;
}

export interface TeamReleaseData {
  totals: TeamTotals;
  releases: ReleaseBreakdown[];
}

const EXCLUDED_WIP_STATUSES = new Set([
  '1. BACKLOG', 'BACKLOG', 'SPRINT BACKLOG', 'EM REFINAMENTO', 'REFINANDO',
  'A REFINAR', 'SANEAMENTO', 'ESPERANDO', 'DESCARTADO', 'CANCELADO', 'NOGO',
]);

const leadTimeDays = (item: JiraItem): number | null => {
  const start = excelToJSDate(item.Created);
  const end = item.Resolved ? excelToJSDate(item.Resolved) : excelToJSDate(item.UpdatedAt);
  if (!start || !end) return null;
  return (end.getTime() - start.getTime()) / 86400000;
};

const officialOrder: string[] = releaseConfig.releases
  .filter(r => r.id !== 'DEFAULT')
  .map(r => r.id);
const officialName: Record<string, string> = Object.fromEntries(
  releaseConfig.releases.map(r => [r.id, r.displayName])
);

export const useTeamReleaseData = (teamId: string) => {
  const [data, setData] = useState<JiraItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const cloud = await fetchData();
        setData(cloud);
      } catch (err) {
        console.error('Falha ao carregar dados de /api/data:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const result = useMemo<TeamReleaseData>(() => {
    const target = teamId.trim().toUpperCase();
    const items = data.filter(i => (i.Team || '').trim().toUpperCase() === target);

    // agrupa por release
    const byRelease = new Map<string, JiraItem[]>();
    for (const it of items) {
      const rel = normalizeReleaseId(it.Release);
      if (!byRelease.has(rel)) byRelease.set(rel, []);
      byRelease.get(rel)!.push(it);
    }

    const computeAgg = (list: JiraItem[]) => {
      const total = list.length;
      const delivered = list.filter(i => i.StatusCategory === 'DONE').length;
      const wip = list.filter(i => i.StatusCategory !== 'DONE' && !EXCLUDED_WIP_STATUSES.has((i.Status || '').toUpperCase())).length;
      const done = list.filter(i => i.StatusCategory === 'DONE');
      const lts = done.map(leadTimeDays).filter((d): d is number => d !== null);
      const avgLeadTime = lts.length ? lts.reduce((a, b) => a + b, 0) / lts.length : 0;
      return { total, delivered, wip, avgLeadTime };
    };

    const releases: ReleaseBreakdown[] = Array.from(byRelease.entries()).map(([releaseId, list]) => {
      const agg = computeAgg(list);
      return {
        releaseId,
        displayName: officialName[releaseId] ?? releaseId,
        isOfficial: officialOrder.includes(releaseId),
        ...agg,
      };
    });

    // ordena: oficiais (na ordem do config) primeiro, depois o resto por nº de itens
    releases.sort((a, b) => {
      const ia = officialOrder.indexOf(a.releaseId);
      const ib = officialOrder.indexOf(b.releaseId);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return b.total - a.total;
    });

    const totals = computeAgg(items);
    return { totals, releases };
  }, [data, teamId]);

  return { ...result, loading };
};
