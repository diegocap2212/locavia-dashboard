import type { WeeklyFlowDataPoint } from '../hooks/useSMDashboardData';
import type { CFDPoint } from '../cfd/computeCFD';

/**
 * Granularidade de visualização dos gráficos temporais.
 * IMPORTANTE: isto é re-agregação das séries JÁ calculadas semanalmente — não altera
 * a geração de semanas do cone nem as métricas-fonte (invariante do CLAUDE.md: não mexer
 * no stepDays/lógica do cone sem validar contra a planilha).
 */
export type Granularity = 'semana' | 'quinzena' | 'mes';

export const GRANULARITY_LABEL: Record<Granularity, string> = {
  semana: 'Semanal',
  quinzena: 'Quinzenal',
  mes: 'Mensal',
};

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Chave de bin: por mês-calendário (mes), por par de semanas (quinzena), ou semana (semana). */
function binKeyFor(weekStart: Date, weekIndex: number, g: Granularity): string {
  if (g === 'mes') return `${weekStart.getFullYear()}-${String(weekStart.getMonth()).padStart(2, '0')}`;
  if (g === 'quinzena') return `q${Math.floor(weekIndex / 2)}`;
  return `w${weekIndex}`;
}

function binLabel(weekStart: Date, g: Granularity, fallback: string): string {
  if (g === 'mes') return `${MONTHS_PT[weekStart.getMonth()]}/${String(weekStart.getFullYear()).slice(2)}`;
  return fallback; // semana/quinzena usam o rótulo da 1ª semana do bin (ex.: "14/05")
}

/**
 * Re-agrega a série de fluxo semanal (vazão por tipo + lead time + entradas/saídas).
 * Vazão e contagens são somadas; o lead time médio é ponderado pelo throughput do bin.
 */
export function regroupFlow(weekly: WeeklyFlowDataPoint[], g: Granularity): WeeklyFlowDataPoint[] {
  if (g === 'semana' || weekly.length === 0) return weekly;

  const bins = new Map<string, WeeklyFlowDataPoint & { _ltWeightedSum: number; _ltWeight: number }>();
  const order: string[] = [];

  weekly.forEach((w, i) => {
    const key = binKeyFor(w.weekStart, i, g);
    let bin = bins.get(key);
    if (!bin) {
      bin = {
        weekLabel: binLabel(w.weekStart, g, w.weekLabel),
        weekStart: w.weekStart,
        throughput: 0,
        byType: {},
        leadTimeAvg: null,
        entradas: 0,
        saidas: 0,
        saldo: 0,
        _ltWeightedSum: 0,
        _ltWeight: 0,
      };
      bins.set(key, bin);
      order.push(key);
    }
    bin.throughput += w.throughput;
    bin.entradas += w.entradas;
    bin.saidas += w.saidas;
    bin.saldo += w.saldo;
    for (const [type, n] of Object.entries(w.byType)) {
      bin.byType[type] = (bin.byType[type] || 0) + n;
    }
    // Lead time ponderado pelo nº de itens resolvidos na semana (throughput).
    if (w.leadTimeAvg !== null && w.throughput > 0) {
      bin._ltWeightedSum += w.leadTimeAvg * w.throughput;
      bin._ltWeight += w.throughput;
    }
  });

  return order.map(key => {
    const b = bins.get(key)!;
    const { _ltWeightedSum, _ltWeight, ...rest } = b;
    return {
      ...rest,
      leadTimeAvg: _ltWeight > 0 ? Math.round(_ltWeightedSum / _ltWeight) : null,
    };
  });
}

/**
 * Re-agrega o CFD. Como as bandas são ACUMULADAS, cada bin assume o valor da ÚLTIMA
 * semana contida nele (o estado ao fim do período), não a soma.
 */
export function regroupCFD(points: CFDPoint[], g: Granularity): CFDPoint[] {
  if (g === 'semana' || points.length === 0) return points;

  const bins = new Map<string, CFDPoint>();
  const order: string[] = [];

  points.forEach((p, i) => {
    const key = binKeyFor(p.weekStart, i, g);
    if (!bins.has(key)) order.push(key);
    // Sobrescreve com a última semana do bin (estado acumulado ao fim do período).
    bins.set(key, {
      weekLabel: binLabel(p.weekStart, g, p.weekLabel),
      weekStart: p.weekStart,
      'A Fazer': p['A Fazer'],
      'Em andamento': p['Em andamento'],
      'Concluído': p['Concluído'],
    });
  });

  return order.map(key => bins.get(key)!);
}
