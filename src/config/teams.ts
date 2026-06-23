import rawData from '../data.json';

/**
 * Lista global de TODOS os times mapeados no dataset (não só os 8 dos agilistas).
 * Derivada do bundle `data.json` — sem fetch; novos times aparecem a cada deploy de sync.
 */
const teamSet = new Set<string>();
for (const item of rawData as Array<{ Team?: unknown }>) {
  const t = typeof item.Team === 'string' ? item.Team.trim() : '';
  if (t) teamSet.add(t);
}

export const ALL_TEAMS: string[] = Array.from(teamSet).sort((a, b) =>
  a.localeCompare(b, 'pt-BR')
);
