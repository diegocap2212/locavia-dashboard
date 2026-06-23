import { useState, useMemo, useEffect } from 'react';
import { fetchData, type JiraItem } from '../services/dataService';
import rawDataFallback from '../data.json';
import releaseConfig from '../config/release-config.json';
import { computeCone, type ConeItem, type ConeParams } from '../cone/computeCone';

export interface ChartDataPoint {
  name: string;
  "A Fazer (Real)": number | null;
  fullDate: Date;
  scope?: number;
  delivered?: number;
  aFazer?: number;
  [key: string]: string | number | Date | null | undefined;
}

export interface WeeklyPerformancePoint {
  name: string;
  "Saídas": number;
  "História": number;
  "Bug": number;
  "Tarefa": number;
  "Spike": number;
  "Entradas": number;
  "Saldo": number;
  "Vazão Total": number;
  "Lead Time (Méd)": number;
  date: Date;
}

// Statuses to exclude for Locavia Principal (Matches spreadsheet logic)
const LOCAVIA_EXCLUDED_STATUSES = [
  '1. BACKLOG',
  'BACKLOG',
  'SPRINT BACKLOG',
  'EM REFINAMENTO',
  'REFINANDO',
  'A REFINAR',
  'SANEAMENTO',
  'ESPERANDO',
  'DESCARTADO',
  'CANCELADO',
  'NOGO',
];

// Statuses that the official CONE ignores or treats as "Already Delivered" in its temporal view
const BF_CEM_EXCLUDED_STATUSES = [
  '1. BACKLOG',
  'BACKLOG',
  'SPRINT BACKLOG',
  'EM REFINAMENTO',
  'REFINANDO',
  'A REFINAR',
  'SANEAMENTO',
  'ESPERANDO',
  'DESCARTADO',
  'CANCELADO',
  'NOGO',
];

const LOCAVIA_RELEASES = new Set(['O4R1', 'O4R2', 'O4R3']);
const BF_CEM_RELEASES = new Set(['BAF', 'BAF-QW', 'CEM', 'CEM-R1', 'CEM-R2']);
// Times capturados pela Jornada (Mapeados para alinhamento com os times de BI e Estoque/Mob na planilha)
const BF_CEM_JORNADA_TEAMS = new Set([
  'Compras e Estoque',
  'Mobilização',
  'Relatórios de BI',
  'Construção do Data Lake',
  'Evoluções / Buy a Feature',
  'PARATI'
]); 


export type ConeType = 'locavia' | 'bf-cem';

export interface ReleaseSummary {
  total: number;
  done: number;
  remaining: number;
  velTrend: number;
  velBest: number;
  velWorst: number;
  entregaMelhor: Date | null;
  entregaPior: Date | null;
}

export interface ReleaseConeData {
  releaseId: string;
  displayName: string;
  chartData: ChartDataPoint[];
  bLabel: string;
  wLabel: string;
  vLabel: string;
  summary: ReleaseSummary;
}

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
  if (s.includes('-')) {
    // Fix Safari invalid date issues:
    // 1. Convert "YYYY-MM-DD HH:MM:SS" to "YYYY-MM-DDTHH:MM:SS"
    let safeStr = s.replace(' ', 'T');
    // 2. Fix timezone offsets without colons (e.g. "-0300" -> "-03:00")
    safeStr = safeStr.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
    const d = new Date(safeStr);
    if (!isNaN(d.getTime())) return d;
    return new Date(s); // fallback
  }
  
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
      const [first, second, y] = parts;
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
    let release = String(item.Release || 'OUTROS').toUpperCase();

    // Hot-fix for O4R2 Variations (Matching Field Mapper logic)
    if (release.includes('ONDA 4') && release.includes('RELEASE 2')) release = 'O4R2';
    if (release.includes('WAVE 4') && release.includes('RELEASE 2')) release = 'O4R2';
    if (release.includes('ASSINECAR')) release = 'O4R2'; // Found in WhatsApp raw data
    if (release.includes('ONDA 4') && release.includes('RELEASE 1')) release = 'O4R1';
    if (release.includes('WAVE 4') && release.includes('RELEASE 1')) release = 'O4R1';

    return {
      Type: String(item.Type || ''),
      Key: String(item.Key || ''),
      Summary: item.Summary,
      Status: typeof item.Status === 'string' ? item.Status.toUpperCase() : 'UNKNOWN',
      StatusCategory: (item.StatusCategory as 'TODO' | 'IN_PROGRESS' | 'DONE') || 'TODO',
      Team: String(item.Team || ''),
      Created: String(item.Created || ''),
      Resolved: item.Resolved ? String(item.Resolved) : null,
      UpdatedAt: item.UpdatedAt ? String(item.UpdatedAt) : String(item.Created || ''),
      Release: release,
      Metadata: (item.Metadata as { source: 'excel' | 'api', jql_context?: string }) || { source: 'excel' }
    } as JiraItem;
  });
};

export const useDashboardData = (coneType: ConeType = 'locavia') => {
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

    // Pre-filter by cone type
    const coneReleases = coneType === 'locavia' ? LOCAVIA_RELEASES : BF_CEM_RELEASES;
    const coneItems = rawItems.filter(i =>
      coneReleases.has(i.Release) ||
      (coneType === 'bf-cem' && i.Release === 'OUTROS' && BF_CEM_JORNADA_TEAMS.has(i.Team))
    );

    // 1. Meta Data (Teams/Releases) — scoped to this cone
    const teamsList = Array.from(new Set(coneItems.map(i => i.Team))).filter(t => t && t !== "").sort();
    const releasesList = Array.from(new Set(coneItems.map(i => i.Release))).filter(r => r && r !== "").sort();

    // 2. Base Filter (squad/release/exclusions, but NOT date restricted for history accuracy)
    const baseFiltered = coneItems.filter(item => {
      const teamMatch = selectedTeams.includes('TODOS') || selectedTeams.includes(item.Team);
      const releaseMatch = selectedReleases.includes('TODAS') || selectedReleases.includes(item.Release);
      if (!teamMatch || !releaseMatch) return false;

      // Saneamento/Cone Filter: Match official CONE logic
      const excludedStatuses = coneType === 'locavia' ? LOCAVIA_EXCLUDED_STATUSES : BF_CEM_EXCLUDED_STATUSES;
      if (excludedStatuses.includes(item.Status)) return false;
      return true;
    });

    // 2b. Date filtered subset for table views
    const filtered = baseFiltered.filter(item => {
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

    // 3. Determine the parameters for computeCone and construct chartData
    let coneStartDate: Date;
    let coneTargetDate: Date;
    let requiredVelocity = 8;
    let percentileWindow = 8;

    if (coneType === 'locavia') {
      coneStartDate = new Date('2025-10-06T00:00:00Z');
      coneTargetDate = new Date('2026-04-27T00:00:00Z');
      
      const teamVelocities: Record<string, number> = {
        'Portal de Vendas Assistidas': 8,
        'Faturamento': 8,
        'Contratos / Multas / Ressarcimento / Manutenção': 8,
        'Portal de Auto Atendimento': 8,
        'Crédito e Proposta': 6,
        'Pós Venda Salesforce': 5,
        'Atendimento WhatsApp': 8,
        'Relatórios de BI': 8
      };
      
      const teamDeadlines: Record<string, string> = {
        'Relatórios de BI': '2026-05-15T00:00:00Z'
      };

      if (selectedTeams.length === 1 && !selectedTeams.includes('TODOS')) {
        const teamName = selectedTeams[0];
        requiredVelocity = teamVelocities[teamName] ?? 8;
        percentileWindow = 8;
        if (teamDeadlines[teamName]) {
          coneTargetDate = new Date(teamDeadlines[teamName]);
        }
      } else if (selectedTeams.includes('TODOS')) {
        requiredVelocity = Object.values(teamVelocities).reduce((a, b) => a + b, 0); // 59
      } else {
        requiredVelocity = selectedTeams.reduce((acc, t) => acc + (teamVelocities[t] ?? 8), 0);
      }
    } else {
      // bf-cem (gen2)
      coneStartDate = new Date('2025-11-24T00:00:00Z');
      coneTargetDate = new Date('2026-05-25T00:00:00Z');
      requiredVelocity = 60;
      percentileWindow = 10;

      if (selectedTeams.length === 1 && !selectedTeams.includes('TODOS')) {
        const teamName = selectedTeams[0];
        if (teamName === 'Compras e Estoque') {
          requiredVelocity = 29;
          coneTargetDate = new Date('2026-05-15T00:00:00Z');
        } else if (teamName === 'Mobilização') {
          coneStartDate = new Date('2026-03-02T00:00:00Z');
          requiredVelocity = 10;
          coneTargetDate = new Date('2026-05-15T00:00:00Z');
        } else if (teamName === 'Evoluções / Buy a Feature') {
          coneStartDate = new Date('2026-03-02T00:00:00Z');
          requiredVelocity = 6;
          coneTargetDate = new Date('2026-05-15T00:00:00Z');
        }
      } else if (selectedReleases.includes('BAF')) {
        coneStartDate = new Date('2025-11-24T00:00:00Z');
        coneTargetDate = new Date('2026-06-30T00:00:00Z');
        requiredVelocity = 6;
      }
    }

    // Map rawItems to ConeItem[]
    const typedConeItems: ConeItem[] = rawItems.map(item => {
      const labels = (item.Labels || []) as string[];
      const team = item.Team || null;
      
      const jornadas: string[] = [];
      if (labels.includes('COMPRAS') || (team && team.includes('Compras'))) jornadas.push('COMPRAS');
      if (labels.includes('ESTOQUE') || (team && team.includes('Estoque'))) jornadas.push('ESTOQUE');
      if (labels.includes('MOB') || (team && team.includes('Mobilização'))) jornadas.push('MOB');
      if (labels.includes('LAKE-DOMINIO') || (team && team.includes('BI')) || (team && team.includes('Relatórios'))) jornadas.push('LAKE-DOMINIO');

      const createdDate = excelToJSDate(item.Created) || new Date();
      const resolvedDate = excelToJSDate(item.Resolved);
      
      const committedDate = item.CommitmentDate ? excelToJSDate(item.CommitmentDate as string) : null;
      const startDateVal = item.StartDate ? excelToJSDate(item.StartDate as string) : null;

      return {
        key: item.Key,
        type: item.Type,
        status: item.Status,
        team: team,
        jornadas: jornadas,
        releases: item.Release ? [item.Release] : [],
        created: createdDate,
        committed: committedDate,
        startDate: startDateVal,
        resolved: resolvedDate,
        flagged: labels.includes('IMPEDIDO') || labels.includes('Impediment') ? 'Impediment' : null
      };
    });

    const params: ConeParams = {
      generation: coneType === 'locavia' ? 'gen1' : 'gen2',
      team: (selectedTeams.length === 1 && !selectedTeams.includes('TODOS')) ? selectedTeams[0] : undefined,
      release: (selectedReleases.length === 1 && !selectedReleases.includes('TODAS')) ? selectedReleases[0] : undefined,
      startDate: coneStartDate,
      targetDate: coneTargetDate,
      stepDays: 7,
      requiredVelocity,
      percentileWindow,
      dataRef: new Date()
    };

    const coneResult = computeCone(typedConeItems, params);
    
    // Define labels for projections using computed velocities
    const velBest = coneResult.velBest;
    const velWorst = coneResult.velWorst;
    const velTrend = coneResult.velTrend;
    const reqVel = params.requiredVelocity;

    const bLabel = `Melhor Caso (${velBest.toFixed(1)}/sem)`;
    const wLabel = `Pior Caso (${velWorst.toFixed(1)}/sem)`;
    const vLabel = `Tendência (${velTrend.toFixed(1)}/sem)`;
    const reqLabel = `Velocidade Necessária (${reqVel.toFixed(1)}/sem)`;

    const chartData: ChartDataPoint[] = coneResult.weeks.map(wk => {
      const isPast = wk.concluido !== null;
      
      const point: ChartDataPoint = {
        name: formatDate(wk.week),
        "A Fazer (Real)": isPast ? wk.melhor : null,
        fullDate: wk.week,
        scope: wk.planejados !== null ? (wk.planejados + (wk.transbordo || 0) + (wk.naoPlanejados || 0) + (wk.bugs || 0)) : undefined,
        delivered: wk.concluido !== null ? wk.concluido : undefined,
        aFazer: wk.melhor !== null ? wk.melhor : undefined,
        [bLabel]: wk.melhor,
        [wLabel]: wk.pior,
        [vLabel]: wk.tendencia,
        [reqLabel]: wk.necessaria
      };

      return point;
    }).filter(d => {
      // Filter based on selected date range
      const isDateMatch = (!startDate || d.fullDate >= new Date(startDate)) && (!endDate || d.fullDate <= new Date(endDate));
      // Show if date matches AND it either has real data or is after current week start
      return isDateMatch && (d["A Fazer (Real)"] !== null || d.fullDate >= getMon(new Date())) && d.fullDate >= new Date(2024, 11, 1);
    });

    // 5. Temporal Matrix Data (Heatmap)
    const minD = filtered.length > 0 ? filtered.reduce((m, i) => { const d = excelToJSDate(i.Created); return (d && d < m) ? d : m; }, new Date()) : new Date(2025, 0, 1);
    const maxDeadline = releaseConfig.releases
      .filter(r => coneReleases.has(r.id))
      .map(r => new Date(r.deadline))
      .reduce((a, b) => a > b ? a : b, new Date());
    
    let matrixMinDate = new Date(2025, 0, 1);
    if (minD > matrixMinDate) matrixMinDate = minD;
    
    const matrixWeeks: { key: string; label: string; date: Date }[] = [];
    const curMatrixWeek = getMon(matrixMinDate);
    // Limit to 6 weeks in the future from now to avoid clutter
    const SIX_WEEKS_MS = 6 * 7 * 86400000;
    const matrixFutureLimit = new Date(Date.now() + SIX_WEEKS_MS);
    const endMatrixWeek = new Date(Math.min(matrixFutureLimit.getTime(), maxDeadline.getTime() + 7 * 86400000));
    
    // Ensure we at least show until the current week
    if (endMatrixWeek < new Date()) {
      endMatrixWeek.setTime(Date.now());
    }
    
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
            const doneAt = i.StatusCategory === 'DONE'
              ? (i.Resolved ? excelToJSDate(i.Resolved) : excelToJSDate(i.UpdatedAt))
              : null;
            if (!c || c >= wEnd) return false;
            if (!doneAt || doneAt >= wEnd) return true;
            return false;
         }).length : null;
         
         return { weekKey: w.key, meta, execucao, isPast };
      });
      
      return { groupName: teamName, releaseName: topReleaseId, totalItems: totalTeamItems, deadline, cells };
    });
    
    matrixRows.sort((a, b) => b.totalItems - a.totalItems);
    
    const temporalMatrixData = { weeks: matrixWeeks, rows: matrixRows };

    // 5. Weekly Performance (Throughput/LeadTime) — calculated on baseFiltered for history
    const weeklyStats: WeeklyPerformancePoint[] = [];
    if (baseFiltered.length > 0) {
      const minDate = baseFiltered.reduce((m, i) => {
        const d = excelToJSDate(i.Created);
        return (d && d < m) ? d : m;
      }, new Date());
      const curr = getMon(minDate);
      const now = new Date();
      while (curr <= now || weeklyStats.length < 5) {
        const wStart = new Date(curr);
        const wEnd = new Date(curr.getTime() + 7 * 86400000);
        
        const resolved = baseFiltered.filter(i => {
           const r = i.Resolved ? excelToJSDate(i.Resolved) : excelToJSDate(i.UpdatedAt);
           return i.StatusCategory === 'DONE' && r && r >= wStart && r < wEnd;
        });
        const inflow = baseFiltered.filter(i => {
           const c = excelToJSDate(i.Created);
           return c && c >= wStart && c < wEnd;
        }).length;

        const leadTimeSum = resolved.reduce((acc, i) => {
           const c = excelToJSDate(i.Created);
           const r = i.Resolved ? excelToJSDate(i.Resolved) : excelToJSDate(i.UpdatedAt);
           return acc + ((r?.getTime() ?? 0) - (c?.getTime() ?? r?.getTime() ?? 0)) / 86400000;
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

    // Filter weeklyStats to selected period
    const filteredWeeklyStats = weeklyStats.filter(w => {
      const wEnd = new Date(w.date.getTime() + 7 * 86400000);
      const isStartOk = !startDate || wEnd >= new Date(startDate);
      const isEndOk = !endDate || w.date <= new Date(endDate);
      return isStartOk && isEndOk;
    });

    // 6. Final Metrics
    const currentExclusions = coneType === 'locavia' ? LOCAVIA_EXCLUDED_STATUSES : BF_CEM_EXCLUDED_STATUSES;
    return { 
      chartData, 
      weeklyPerformance: filteredWeeklyStats.slice(-18),
      metrics: {
        totalItems: filtered.length,
        deliveredCount: filtered.filter(i => i.StatusCategory === 'DONE').length,
        wipCount: filtered.filter(i =>
          i.StatusCategory !== 'DONE' &&
          !currentExclusions.includes(i.Status.toUpperCase())
        ).length,
        avgLeadTime: (() => {
          const doneItems = filtered.filter(i => i.StatusCategory === 'DONE' && i.Created);
          const totalMs = doneItems.reduce((acc, i) => {
            const end = i.Resolved ? excelToJSDate(i.Resolved) : excelToJSDate(i.UpdatedAt);
            const start = excelToJSDate(i.Created);
            return acc + (end && start ? end.getTime() - start.getTime() : 0);
          }, 0);
          return (totalMs / (Math.max(1, doneItems.length) * 86400000)).toFixed(1);
        })(),
      },
      filteredList: filtered,
      teams: teamsList,
      releases: releasesList,
      temporalMatrixData
    };
  }, [data, selectedTeams, selectedReleases, startDate, endDate, coneType]);

  const releaseCones = useMemo((): ReleaseConeData[] => {
    if (!data.length) return [];

    const rawItems = normalizeJqlData(data);
    const today = new Date();
    const farFuture = new Date(today.getTime() + 2 * 365 * 86400000);

    // Map ALL items to ConeItem[] once — computeCone filters by release internally
    const allTypedItems: ConeItem[] = rawItems.map(item => {
      const labels = (item.Labels || []) as string[];
      const team = item.Team || null;
      const jornadas: string[] = [];
      if (labels.includes('COMPRAS') || (team && team.includes('Compras'))) jornadas.push('COMPRAS');
      if (labels.includes('ESTOQUE') || (team && team.includes('Estoque'))) jornadas.push('ESTOQUE');
      if (labels.includes('MOB') || (team && team.includes('Mobilização'))) jornadas.push('MOB');
      if (labels.includes('LAKE-DOMINIO') || (team && team.includes('BI')) || (team && team.includes('Relatórios'))) jornadas.push('LAKE-DOMINIO');
      const createdDate = excelToJSDate(item.Created) || new Date();
      const resolvedDate = excelToJSDate(item.Resolved);
      const committedDate = item.CommitmentDate ? excelToJSDate(item.CommitmentDate as string) : null;
      const startDateVal = item.StartDate ? excelToJSDate(item.StartDate as string) : null;
      return {
        key: item.Key,
        type: item.Type,
        status: item.Status,
        team,
        jornadas,
        releases: item.Release ? [item.Release] : [],
        created: createdDate,
        committed: committedDate,
        startDate: startDateVal,
        resolved: resolvedDate,
        flagged: labels.includes('IMPEDIDO') || labels.includes('Impediment') ? 'Impediment' : null
      };
    });

    // Source of truth: active releases from config (excludes DEFAULT and inactive entries)
    const activeReleases = releaseConfig.releases.filter(r => r.active !== false && r.id !== 'DEFAULT');

    return activeReleases.flatMap((relConf): ReleaseConeData[] => {
      const releaseId = relConf.id;
      const generation = (relConf.generation || 'gen1') as 'gen1' | 'gen2';
      const percentileWindow = relConf.percentileWindow || 8;
      const EXCLUDED = generation === 'gen1' ? LOCAVIA_EXCLUDED_STATUSES : BF_CEM_EXCLUDED_STATUSES;

      // Items for this specific release (used for anchor date and summary stats)
      const releaseItems = allTypedItems.filter(it => it.releases.includes(releaseId));
      if (!releaseItems.length) return [];

      const activeItems = releaseItems.filter(it => !EXCLUDED.includes(it.status));
      if (!activeItems.length) return [];

      const anchorDates = activeItems
        .map(it => it.committed || it.created)
        .filter((d): d is Date => d !== null);
      if (!anchorDates.length) return [];

      const anchor = anchorDates.reduce((min, d) => (d < min ? d : min));
      const releaseStartDate = getMon(anchor);

      const params: ConeParams = {
        generation,
        release: releaseId,
        startDate: releaseStartDate,
        targetDate: farFuture,
        stepDays: 7,
        requiredVelocity: 1,
        percentileWindow,
        dataRef: today
      };

      // Pass ALL items — computeCone filters by release via matchesScope
      const result = computeCone(allTypedItems, params);
      const { velBest, velWorst, velTrend } = result;

      const bLabel = `Melhor (${velBest.toFixed(1)}/sem)`;
      const wLabel = `Pior (${velWorst.toFixed(1)}/sem)`;
      const vLabel = `Tendência (${velTrend.toFixed(1)}/sem)`;

      const horizon = result.entregaPior
        ? new Date(result.entregaPior.getTime() + 4 * 7 * 86400000)
        : new Date(today.getTime() + 78 * 7 * 86400000);

      const chartData: ChartDataPoint[] = result.weeks
        .filter(wk => wk.week >= releaseStartDate && wk.week <= horizon)
        .map(wk => ({
          name: formatDate(wk.week),
          'A Fazer (Real)': wk.concluido !== null ? wk.melhor : null,
          fullDate: wk.week,
          [bLabel]: wk.melhor,
          [wLabel]: wk.pior,
          [vLabel]: wk.tendencia,
        }));

      const done = activeItems.filter(it => it.resolved != null).length;
      const total = activeItems.length;

      return [{
        releaseId,
        displayName: relConf.displayName,
        chartData,
        bLabel,
        wLabel,
        vLabel,
        summary: {
          total,
          done,
          remaining: total - done,
          velTrend,
          velBest,
          velWorst,
          entregaMelhor: result.entregaMelhor,
          entregaPior: result.entregaPior,
        }
      }];
    });
  }, [data]);

  return {
    ...dashboardState,
    releaseCones,
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
