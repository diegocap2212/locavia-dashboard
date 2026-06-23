/**
 * Paleta central dos gráficos — marca Blite/Venice.
 * Substitui os hex hard-coded espalhados pelos componentes de chart.
 * Mantém a semântica de feedback (vermelho = risco, âmbar = andamento).
 */
export const CHART = {
  primary: '#FF2993', // série principal (era #3B82F6 azul)
  violet: '#8B0CF6',  // pontos/velocidade (era #8B5CF6)
  mint: '#2BBB92',    // entregue/concluído/sucesso (era #10B981)
  amber: '#F59E0B',   // em andamento/aviso (mantém)
  red: '#EF4444',     // bug/risco (mantém)
  neutral: '#94A3B8', // série neutra/criadas (mantém)
  grid: '#E2E8F0',    // grade (mantém)
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
