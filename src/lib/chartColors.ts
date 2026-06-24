/**
 * Paleta central dos gráficos — marca Venice.
 * Substitui os hex hard-coded espalhados pelos componentes de chart.
 * Mantém a semântica de feedback (vermelho = risco, âmbar = andamento).
 */
// Paleta TRADICIONAL para as séries dos gráficos (azul/verde/âmbar/vermelho/cinza).
// O verde da marca (Venice) fica reservado para o Cone/hero — aqui é só sotaque pontual.
export const CHART = {
  primary: '#3B82F6', // série principal — azul tradicional
  violet: '#8B5CF6',  // pontos/velocidade — violet tradicional
  mint: '#22C55E',    // entregue/concluído/sucesso — verde
  amber: '#F59E0B',   // em andamento/aviso
  red: '#EF4444',     // bug/risco
  neutral: '#94A3B8', // série neutra/criadas
  grid: '#E2E8F0',    // grade
  axis: '#94A3B8',    // ticks dos eixos
} as const;

/** Cores por tipo de item (usado em Vazão e no donut de entrega por tipo). */
export const TYPE_COLORS: Record<string, string> = {
  'História': CHART.primary,
  'Bug': CHART.red,
  'Tarefa': CHART.mint,
  'Spike': CHART.violet,
  'Outros': CHART.neutral,
};

// ── Tema ESCURO (navy do header) para o card de destaque (CFD) ──
export const CHART_DARK = {
  bg: '#0A0F1A',
  surface: 'linear-gradient(180deg, #16223a 0%, #0e1726 100%)',
  grid: 'rgba(255,255,255,0.08)',
  axis: 'rgba(255,255,255,0.55)',
  text: 'rgba(255,255,255,0.92)',
  textMuted: 'rgba(255,255,255,0.55)',
  // bandas vivas sobre o navy
  done: '#22D3A5',   // concluído (mint vibrante)
  wip: '#FBBF24',    // em andamento (âmbar vibrante)
  todo: '#60A5FA',   // a fazer (azul claro)
} as const;
