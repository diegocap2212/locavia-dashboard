/**
 * Paleta central dos gráficos — Design System Venice (by blite).
 * Fiel ao Figma "Venice - DS - Sistemas": séries Eco Green + roxo/magenta
 * de data-viz (Chart/*). Mantém a semântica de feedback (vermelho = risco/bug,
 * âmbar = andamento).
 *
 * grid/axis usam neutro slate translúcido → legível tanto em cards claros
 * (light) quanto escuros (dark), sem precisar thre+ar o tema em cada chart.
 */
export const CHART = {
  primary: '#3D6B4F', // série principal — Forest Green (brand)
  forest: '#59926F',  // série de apoio escura — Green 600
  sage: '#7BB88A',    // série de apoio clara — Green 500
  mint: '#A8E6B8',    // entregue/concluído — Green 300
  amber: '#F59E0B',   // em andamento/aviso — Warning
  red: '#EF4444',     // bug/risco — Error
  neutral: '#64748B', // série neutra/criadas — Neutral 500
  violet: '#8B5CF6',  // série data-viz roxa (Figma Chart)
  magenta: '#FF2993', // série data-viz magenta (Figma Chart)
  teal: '#2BB892',    // série teal de apoio
  grid: 'rgba(100,116,139,0.20)', // grade (neutro slate translúcido)
  axis: 'rgba(100,116,139,0.85)', // ticks dos eixos
} as const;

/** Cores por tipo de item (usado em Vazão e no donut de entrega por tipo). */
export const TYPE_COLORS: Record<string, string> = {
  'História': '#3D6B4F', // Forest Green (brand)
  'Bug': CHART.red,
  'Tarefa': '#7BB88A',   // verde claro — Green 500
  'Spike': CHART.violet, // roxo de data-viz
  'Outros': CHART.neutral,
};

// ── Tema ESCURO branded para o card de destaque (CFD) ──
export const CHART_DARK = {
  bg: '#0A0F1A',
  surface: 'linear-gradient(180deg, #111827 0%, #0A0F1A 100%)',
  grid: 'rgba(255,255,255,0.08)',
  axis: 'rgba(255,255,255,0.55)',
  text: 'rgba(255,255,255,0.92)',
  textMuted: 'rgba(255,255,255,0.55)',
  // bandas vivas sobre o fundo escuro
  done: '#A8E6B8',   // concluído — Green 300
  wip: '#F0C66B',    // em andamento (âmbar)
  todo: '#7BB88A',   // a fazer — Green 500
} as const;
