import { endOfWeek } from 'date-fns';
import type { DashboardItem } from '../types/jira';
import { excelToJSDate } from '../hooks/useDashboardData';

/**
 * CFD (Cumulative Flow Diagram) — transform ISOLADO.
 *
 * Esta função NÃO altera nenhuma métrica existente: ela apenas lê os itens já
 * filtrados (mesmo recorte time/release/período dos demais gráficos do SM) e
 * deriva, para cada semana, a contagem ACUMULADA em três bandas de status.
 *
 * Bandas (estado de cada item ao FIM da semana t):
 *   - Concluído    = resolved <= t
 *   - Em andamento = started <= t  e  (sem resolução ou resolved > t)
 *   - A Fazer      = created <= t   e  ainda não começou nem concluiu
 *
 * Fidelidade (status de verdade): `Created` e `Resolved` (= resolutiondate) são
 * confiáveis. `StartDate` é esparso (~61% no dataset atual), então usamos um
 * fallback honesto: StartDate → CommitmentDate → (sem sinal de início, o item
 * vai direto de "A Fazer" para "Concluído"). `startDateCoverage` expõe quanto da
 * banda "Em andamento" se apoia em data real vs. inferida, para a UI alertar.
 */

const parseDate = (d: string | null | undefined): Date | null => {
  if (!d) return null;
  const p = excelToJSDate(d);
  return p && !isNaN(p.getTime()) ? p : null;
};

export interface CFDPoint {
  weekLabel: string;
  weekStart: Date;
  'A Fazer': number;
  'Em andamento': number;
  'Concluído': number;
}

export interface CFDResult {
  points: CFDPoint[];
  /** Fração [0..1] de itens com StartDate explícito (qualidade da banda "Em andamento"). */
  startDateCoverage: number;
  totalItems: number;
}

interface PreparedItem {
  created: Date;
  started: Date | null;
  resolved: Date | null;
  hasExplicitStart: boolean;
}

export function computeCFD(
  items: DashboardItem[],
  weeks: { weekStart: Date; weekLabel: string }[]
): CFDResult {
  const prepared: PreparedItem[] = [];
  let withExplicitStart = 0;

  for (const item of items) {
    const created = parseDate(item.Created);
    if (!created) continue; // sem data de criação não há como posicionar o item

    // Mesma regra de "resolved" usada no resto do hook do SM (Resolved → fallback UpdatedAt p/ DONE).
    const resolved =
      parseDate(item.Resolved) ??
      (item.StatusCategory === 'DONE' ? parseDate(item.UpdatedAt) : null);

    const explicitStart = parseDate(item.StartDate);
    if (explicitStart) withExplicitStart++;

    // Fallback honesto p/ a banda "Em andamento": StartDate → CommitmentDate → resolved (sem sinal).
    const started = explicitStart ?? parseDate(item.CommitmentDate) ?? resolved;

    prepared.push({ created, started, resolved, hasExplicitStart: !!explicitStart });
  }

  const totalItems = prepared.length;
  const startDateCoverage = totalItems > 0 ? withExplicitStart / totalItems : 0;

  const points: CFDPoint[] = weeks.map(w => {
    const t = endOfWeek(w.weekStart, { weekStartsOn: 1 }).getTime();
    let done = 0;
    let inProgress = 0;
    let todo = 0;

    for (const p of prepared) {
      if (p.created.getTime() > t) continue; // ainda não entrou no sistema
      const resolvedMs = p.resolved ? p.resolved.getTime() : null;
      const startedMs = p.started ? p.started.getTime() : null;

      if (resolvedMs !== null && resolvedMs <= t) {
        done++;
      } else if (startedMs !== null && startedMs <= t) {
        inProgress++;
      } else {
        todo++;
      }
    }

    return {
      weekLabel: w.weekLabel,
      weekStart: w.weekStart,
      'A Fazer': todo,
      'Em andamento': inProgress,
      'Concluído': done,
    };
  });

  return { points, startDateCoverage, totalItems };
}
