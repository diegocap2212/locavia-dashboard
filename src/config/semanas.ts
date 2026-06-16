/**
 * Semanas (cadência semanal das análises — substitui a quinzena no SMDashboard).
 * Semana ISO começando na segunda-feira (alinha com a lógica dos hooks: weekStartsOn:1 / getMon).
 * O `id` é a segunda-feira em YYYY-MM-DD — usado como chave de período do comentário (Redis v3).
 */
export interface SemanaConfig {
  id: string;        // segunda-feira YYYY-MM-DD
  label: string;     // rótulo amigável
  startDate: string; // segunda-feira YYYY-MM-DD
  endDate: string;   // domingo YYYY-MM-DD
}

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ddmm = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;

const mondayOf = (d: Date): Date => {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - (day === 0 ? 6 : day - 1));
  x.setHours(0, 0, 0, 0);
  return x;
};

// Janela do projeto (cobre o histórico carregado e algumas semanas à frente).
const PROJECT_START = new Date(2025, 8, 1);  // 2025-09-01
const PROJECT_END = new Date(2026, 11, 31);  // 2026-12-31

function buildSemanas(): SemanaConfig[] {
  const out: SemanaConfig[] = [];
  const cur = mondayOf(PROJECT_START);
  while (cur <= PROJECT_END) {
    const end = new Date(cur);
    end.setDate(end.getDate() + 6);
    out.push({
      id: toISO(cur),
      label: `Semana ${ddmm(cur)} a ${ddmm(end)}`,
      startDate: toISO(cur),
      endDate: toISO(end),
    });
    cur.setDate(cur.getDate() + 7);
  }
  return out;
}

export const SEMANAS: SemanaConfig[] = buildSemanas();

export function getSemanas(): SemanaConfig[] {
  return SEMANAS;
}

export function getSemanaById(id: string): SemanaConfig | undefined {
  return SEMANAS.find(s => s.id === id);
}

/** Semana atual (segunda-feira de hoje); se fora do range, a última semana <= hoje. */
export function getAutomaticActiveSemana(): string {
  const todayMonISO = toISO(mondayOf(new Date()));
  const exact = SEMANAS.find(s => s.id === todayMonISO);
  if (exact) return exact.id;
  const past = SEMANAS.filter(s => s.id <= todayMonISO);
  return past.length ? past[past.length - 1].id : SEMANAS[SEMANAS.length - 1].id;
}

/** Segunda-feira (id de semana) que contém uma data YYYY-MM-DD qualquer. */
export function semanaIdForDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return getAutomaticActiveSemana();
  return toISO(mondayOf(d));
}
