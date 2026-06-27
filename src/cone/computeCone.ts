// computeCone.ts
// Motor de cálculo do Cone — FUNÇÃO PURA.
// Sem React, sem fetch, sem Date.now(). Recebe itens + parâmetros + data_ref,
// devolve as semanas com classificadores e as 3 trajetórias do burndown.
// É isto que se audita célula-a-célula contra o Excel (ver audit).
//
// Reproduz as 5 regras de 01_REGRAS_Excel_vs_App.md.

// ----------------------------- Tipos -----------------------------

/** Item já normalizado a partir do Jira (labels multivalor explodidos em arrays). */
export interface ConeItem {
  key: string;                 // ex. "RM-4303"
  type: string;                // "História" | "Tarefa" | "Bug" | "Spike" | ...
  status: string;              // status bruto do Jira
  team: string | null;         // Campo personalizado (Time)
  jornadas: string[];          // R2.jornada explodido: ["MOB"] em vez de "MOB;;;;;;"
  releases: string[];          // idem para release: ["CEM-R1"]
  created: Date;               // Criado
  committed: Date | null;      // Data de Comprometimento (dtc)
  startDate: Date | null;      // Start date
  resolved: Date | null;       // Resolvido  <-- chave da Regra 1
  flagged?: string | null;     // "Impediment" | null
}

export type Generation = 'gen1' | 'gen2';

/** Parâmetros do recorte — equivalem ao cabeçalho C2..C10 de uma aba Cone. */
export interface ConeParams {
  generation: Generation;
  // filtros combináveis (Regra: 6 padrões de recorte = subconjunto destes 3)
  team?: string;               // C2 quando recorte por time
  jornada?: string;            // C2 quando recorte por jornada
  jornadasUnion?: string[];    // caso LET (Compras+Estoque+Mob), sem dupla contagem
  release?: string;            // C3
  // calendário
  startDate: Date;             // C5 — primeira sprint da release (âncora)
  targetDate: Date;            // C6 — data-alvo
  stepDays: number;            // C10 — normalmente 7
  // velocidade
  requiredVelocity: number;    // C9 — número fixo digitado à mão
  percentileWindow: number;    // N semanas (8 padrão; 10 em algumas abas BAF)
  /**
   * Como derivar a faixa (velBest/velWorst):
   * - 'percentile' (default): PERCENTILE_CONT direto da amostra recente, piso 1, arredondado.
   *   É o método AUDITADO contra o Excel — não mexer no caminho do dashboard principal.
   * - 'bootstrap': reamostragem (Monte Carlo determinístico) do throughput observado para
   *   estimar a distribuição da velocidade média. Com poucas semanas, a variância natural do
   *   bootstrap abre a faixa (P85≠P15); com muitas semanas ela se estreita. Usado no cone
   *   executivo da home para que TODA release tenha melhor/pior cenário, não só as maduras.
   */
  bandMethod?: 'percentile' | 'bootstrap';
  // Regra 5: "hoje" congelado para auditar contra um print do Excel
  dataRef: Date;
}

export interface ConeWeek {
  week: Date;
  // classificadores (null = semana futura, guarda TODAY da gen2)
  transbordo: number | null;   // F
  planejados: number | null;   // G
  naoPlanejados: number | null;// H
  bugs: number | null;         // I
  concluido: number | null;    // J
  descartados: number | null;  // K
  novos: number | null;        // L (gen2)
  saldo: number | null;        // M = L - K - J (gen2)
  impedidos: number | null;    // N (gen2)
  // trajetórias do cone
  melhor: number | null;       // C  (−P85)
  pior: number | null;         // D  (−P15)
  necessaria: number | null;   // E  (−C9)
  tendencia?: number | null;   // EXTRA: −P50 (não existe no Excel; Regra 4)
  descartadosDtc?: number;     // EXTRA: descartados por DTC para gen1
}

export interface ConeResult {
  backlogInicial: number;      // C4
  velBest: number;             // C7 (P85, piso 1)
  velWorst: number;            // C8 (P15, piso 1)
  velTrend: number;            // P50 extra
  weeks: ConeWeek[];
  entregaMelhor: Date | null;  // 1ª semana em que C cruza 0
  entregaPior: Date | null;    // idem para D
}

// ------------------------- Utilitários ---------------------------

/** Trunca para meia-noite UTC — equivale ao INT(datetime) do Excel. */
const intDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const addDays = (d: Date, n: number) => {
  const res = new Date(d);
  res.setUTCDate(res.getUTCDate() + n);
  return res;
};

/**
 * PERCENTILE_CONT do Excel (interpolação linear entre ranks).
 * NÃO é o percentil discreto. Replica PERCENTILE(array, p) clássico.
 */
export function percentileCont(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const v = [...values].sort((a, b) => a - b);
  if (v.length === 1) return v[0];
  const rank = p * (v.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return v[lo];
  return v[lo] + (rank - lo) * (v[hi] - v[lo]);
}

/** Velocidade: percentil das últimas N semanas COM dado real, piso 1, arredondado. */
function velocityFromThroughput(throughput: number[], p: number, windowN: number): number {
  const recent = throughput.slice(-windowN);     // últimas N com dado real
  const pc = percentileCont(recent, p);
  return Math.round(pc < 1 ? 1 : pc);            // IF(<1,1,..) + ROUND(..,0)
}

/** PRNG determinístico (mulberry32) — bootstrap reproduzível entre renders, sem Math.random. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Faixa de velocidade via bootstrap (Monte Carlo determinístico) do throughput recente.
 * Reamostra as semanas com reposição N_trials vezes, calcula a média de cada trial e tira
 * P85/P50/P15 da distribuição das médias. Amostra curta → médias muito variáveis → faixa larga;
 * amostra longa → faixa estreita. Piso 1; mantém fração (a projeção cruza zero entre semanas).
 * Seed derivada da própria amostra → resultado estável a cada render (não pisca).
 */
function bootstrapVelocityBand(
  throughput: number[],
  windowN: number,
): { best: number; worst: number; trend: number } {
  const recent = throughput.slice(-windowN);
  // Piso baixo (não 1): times lentos entregam <1/semana e o piso-1 colapsaria a faixa
  // (P85 e P15 cairiam ambos para 1). 0.1 evita divisão-por-zero/projeção infinita sem mentir
  // sobre o ritmo. (O método percentil auditado segue com piso 1 em velocityFromThroughput.)
  const floorEps = (x: number) => (x < 0.1 ? 0.1 : x);
  if (recent.length === 0) return { best: 0.1, worst: 0.1, trend: 0.1 };
  if (recent.length === 1) {
    const v = floorEps(recent[0]);
    return { best: v, worst: v, trend: v };
  }

  // seed determinística a partir dos valores da amostra
  let seed = (recent.length * 2654435761) >>> 0;
  for (let i = 0; i < recent.length; i++) {
    seed = (seed ^ (Math.round(recent[i] * 1000) * (i + 1))) >>> 0;
  }
  const rng = mulberry32(seed);

  const TRIALS = 2000;
  const n = recent.length;
  const means = new Array<number>(TRIALS);
  for (let t = 0; t < TRIALS; t++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += recent[Math.floor(rng() * n)];
    means[t] = sum / n;
  }
  means.sort((a, b) => a - b);

  // arredonda a 1 casa para casar com a exibição (.toFixed(1)) sem colapsar valores próximos
  const round1 = (x: number) => Math.round(x * 10) / 10;
  return {
    best: floorEps(round1(percentileCont(means, 0.85))),   // ritmo alto → otimista
    worst: floorEps(round1(percentileCont(means, 0.15))),  // ritmo baixo → pessimista
    trend: floorEps(round1(percentileCont(means, 0.50))),
  };
}

// ----------------------- Filtro de recorte -----------------------

/** Aplica o recorte combinável (time × jornada × release). Substitui o curinga *…* do Excel. */
function matchesScope(it: ConeItem, p: ConeParams): boolean {
  if (p.team && it.team !== p.team) return false;
  if (p.release && !it.releases.includes(p.release)) return false;
  if (p.jornada && !it.jornadas.includes(p.jornada)) return false;
  if (p.jornadasUnion && !p.jornadasUnion.some(j => it.jornadas.includes(j))) return false;
  return true;
}

const isBug = (it: ConeItem) => it.type.toUpperCase() === 'BUG';
const isDiscarded = (it: ConeItem) => it.status.toUpperCase() === 'DESCARTADO';

/** Regra 1: concluído = tem data de resolução E não foi descartado. */
const isResolved = (it: ConeItem) => it.resolved != null && !isDiscarded(it);

// --------------------------- Motor -------------------------------

export function computeCone(items: ConeItem[], p: ConeParams): ConeResult {
  const scoped = items.filter(it => matchesScope(it, p));
  const start = intDay(p.startDate);
  const ref = intDay(p.dataRef);

  // C4 — backlog inicial. Regra 3: gen2 filtra criado < início; gen1 conta tudo.
  const backlogInicial = p.generation === 'gen2'
    ? scoped.filter(it => intDay(it.created) < start).length
    : scoped.length;

  // monta o calendário semanal até a data-alvo (+ folga p/ projeção cruzar zero)
  const weeks: ConeWeek[] = [];
  for (let w = new Date(start); intDay(w) <= intDay(p.targetDate) || weeks.length < 55; w = addDays(w, p.stepDays)) {
    weeks.push(blankWeek(w));
  }

  // ---- classificadores por semana (só passado/presente; futuro = null) ----
  const throughput: number[] = []; // J real das semanas já ocorridas, p/ percentil
  for (const wk of weeks) {
    const wStart = intDay(wk.week);
    const wEnd = addDays(wStart, p.stepDays);

    // Regra 5: guarda TODAY — semana futura fica vazia
    const isFuture = wStart > ref;
    if (isFuture) continue; // mantém tudo null

    const isFirstWeek = wStart.getTime() === start.getTime();

    // inWeek normal para Criado, StartDate, Committed
    const inWeek = (d: Date | null) => d != null && intDay(d) >= wStart && intDay(d) < wEnd;
    
    // inWeek para Resolvido (J) e Descartado (K)
    const inWeekJ = (d: Date | null) => {
      if (d == null) return false;
      const t = intDay(d);
      if (p.generation === 'gen2' && isFirstWeek) {
        return t < wEnd;
      }
      return t >= wStart && t < wEnd;
    };

    const inWeekK = (d: Date | null) => {
      if (d == null) return false;
      const t = intDay(d);
      return t >= wStart && t < wEnd;
    };

    const day1 = (d: Date | null) => d != null && intDay(d).getTime() === wStart.getTime();
    const day2to7 = (d: Date | null) => d != null && intDay(d) > wStart && intDay(d) < wEnd;

    // G — planejados: comprometido no dia 1, não-bug (+ start date no dia 1 sem dtc)
    wk.planejados = scoped.filter(it =>
      !isBug(it) && (day1(it.committed) || (it.committed == null && day1(it.startDate)))
    ).length;

    // H — não planejados: comprometido dias 2–7, não-bug
    wk.naoPlanejados = scoped.filter(it =>
      !isBug(it) && (day2to7(it.committed) || (it.committed == null && day2to7(it.startDate)))
    ).length;

    // I — bugs criados na semana
    wk.bugs = scoped.filter(it => isBug(it) && inWeek(it.created)).length;

    // J — concluído na janela da semana (Regra 1 + janela fechada padronizada)
    wk.concluido = scoped.filter(it => isResolved(it) && inWeekJ(it.resolved)).length;

    // K — descartados na semana
    const discCount = scoped.filter(it => isDiscarded(it) && inWeekK(it.resolved)).length;
    wk.descartados = p.generation === 'gen1' ? -discCount : discCount;

    // Descartados por data de comprometimento (DTC) na semana (para transbordo do gen1)
    const inWeekDtc = (d: Date | null) => d != null && intDay(d) >= wStart && intDay(d) < wEnd;
    wk.descartadosDtc = p.generation === 'gen1'
      ? scoped.filter(it => isDiscarded(it) && inWeekDtc(it.committed)).length
      : 0;

    // L — novos itens (scope creep) não-bug criados na semana (gen2)
    wk.novos = p.generation === 'gen2'
      ? scoped.filter(it => !isBug(it) && inWeek(it.created)).length
      : 0;

    // F — transbordo: WIP que entrou e não fechou
    wk.transbordo = null; // calculado no passo recursivo abaixo

    // M — saldo (gen2)
    wk.saldo = p.generation === 'gen2'
      ? (wk.novos ?? 0) - (wk.descartados ?? 0) - (wk.concluido ?? 0)
      : null;

    // N — impedidos agora (gen2): flagged, sem resolução, semana corrente
    wk.impedidos = (p.generation === 'gen2' && wStart <= ref && ref < wEnd)
      ? scoped.filter(it => it.flagged === 'Impediment' && it.resolved == null && !isDiscarded(it)).length
      : null;

    if (wk.concluido != null) throughput.push(wk.concluido);
  }

  // ---- velocidades (Regra 4) ----
  let velBest: number, velWorst: number, velTrend: number;
  if (p.bandMethod === 'bootstrap') {
    const band = bootstrapVelocityBand(throughput, p.percentileWindow);
    velBest = band.best; velWorst = band.worst; velTrend = band.trend;
  } else {
    velBest = velocityFromThroughput(throughput, 0.85, p.percentileWindow);
    velWorst = velocityFromThroughput(throughput, 0.15, p.percentileWindow);
    velTrend = velocityFromThroughput(throughput, 0.50, p.percentileWindow);
  }

  // ---- transbordo e burndown recursivos (Regra 2) ----
  let prevC: number | null = backlogInicial;
  let prevD: number | null = backlogInicial;
  let prevE: number | null = backlogInicial;
  let prevT: number | null = backlogInicial;

  for (let i = 0; i < weeks.length; i++) {
    const wk = weeks[i];
    const isFirstWeek = i === 0;

    // F — transbordo
    if (isFirstWeek) {
      if (p.generation === 'gen2') {
        const countWip = scoped.filter(it =>
          !isBug(it) &&
          it.created != null && intDay(it.created) < start &&
          it.committed != null && intDay(it.committed) < start &&
          (it.resolved == null || intDay(it.resolved) >= start)
        ).length;
        wk.transbordo = countWip;
      } else {
        wk.transbordo = null;
      }
    } else {
      const prevWk = weeks[i - 1];
      const hasReal = prevWk.concluido !== null;
      if (hasReal) {
        const entrou = (prevWk.planejados ?? 0) + (prevWk.transbordo ?? 0) + (prevWk.naoPlanejados ?? 0) + (prevWk.bugs ?? 0);
        const j = prevWk.concluido ?? 0;
        if (p.generation === 'gen2') {
          wk.transbordo = Math.max(0, entrou - j);
        } else {
          const discDtc = prevWk.descartadosDtc ?? 0;
          wk.transbordo = Math.max(0, entrou - j - discDtc);
        }
      } else {
        wk.transbordo = null;
      }
    }

    // Trajetórias (melhor, pior, necessaria, tendencia)
    const step = (prev: number | null, vel: number, prevWk: ConeWeek): number | null => {
      if (prev === null || prev === 0) return null;
      const hasReal = prevWk.concluido !== null;
      if (!hasReal) {
        const r = prev - vel;
        return r <= 0 ? 0 : r;
      }
      let change = 0;
      if (p.generation === 'gen2') {
        const j = prevWk.concluido ?? 0;
        const k = prevWk.descartados ?? 0;
        const l = prevWk.novos ?? 0;
        const iBug = prevWk.bugs ?? 0;
        change = - j - k + l + iBug;
      } else {
        const j = prevWk.concluido ?? 0;
        const k = prevWk.descartados ?? 0; // already negative
        change = - j + k;
      }
      const r = prev + change;
      return r <= 0 ? 0 : r;
    };

    wk.melhor = isFirstWeek ? backlogInicial : step(prevC, velBest, weeks[i - 1]);
    wk.pior = isFirstWeek ? backlogInicial : step(prevD, velWorst, weeks[i - 1]);
    wk.necessaria = isFirstWeek ? backlogInicial : step(prevE, p.requiredVelocity, weeks[i - 1]);
    wk.tendencia = isFirstWeek ? backlogInicial : step(prevT, velTrend, weeks[i - 1]);

    prevC = wk.melhor;
    prevD = wk.pior;
    prevE = wk.necessaria;
    prevT = wk.tendencia;
  }

  // data de entrega = 1ª semana em que a trajetória cruza 0 (INDEX/MATCH(0,..) do Excel)
  const crossZero = (sel: (w: ConeWeek) => number | null): Date | null => {
    const hit = weeks.find(w => sel(w) === 0);
    return hit ? hit.week : null;
  };

  return {
    backlogInicial,
    velBest, velWorst, velTrend,
    weeks,
    entregaMelhor: crossZero(w => w.melhor),
    entregaPior: crossZero(w => w.pior),
  };
}

function blankWeek(week: Date): ConeWeek {
  return {
    week,
    transbordo: null, planejados: null, naoPlanejados: null, bugs: null,
    concluido: null, descartados: null, novos: null, saldo: null, impedidos: null,
    melhor: null, pior: null, necessaria: null, tendencia: null,
  };
}
