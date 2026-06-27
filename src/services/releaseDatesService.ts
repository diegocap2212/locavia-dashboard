/**
 * Datas das releases editáveis pela LM — persistidas no Redis via /api/release-dates.
 * Source of truth para data-alvo (meta) e início; sobrepõem o release-config.json estático.
 */
export interface ReleaseDateRecord {
  startDate: string | null;   // YYYY-MM-DD — início/kickoff (opcional)
  targetDate: string | null;  // YYYY-MM-DD — data-alvo/meta (opcional)
  note: string;
  updatedAt: string;          // ISO (servidor)
  updatedBy?: string;
}

export type ReleaseDatesMap = Record<string, ReleaseDateRecord>;

export async function getReleaseDates(): Promise<ReleaseDatesMap> {
  try {
    const res = await fetch('/api/release-dates', { credentials: 'same-origin' });
    if (res.ok) return (await res.json()) as ReleaseDatesMap;
  } catch (e) {
    console.error('Falha ao buscar datas de release:', e);
  }
  return {};
}

export async function saveReleaseDate(input: {
  releaseId: string;
  startDate: string | null;
  targetDate: string | null;
  note?: string;
  updatedBy?: string;
}): Promise<{ ok: boolean; record?: ReleaseDateRecord }> {
  try {
    const res = await fetch('/api/release-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      console.error('Falha ao salvar data de release:', await res.json().catch(() => ({})));
      return { ok: false };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, record: data.record };
  } catch (e) {
    console.error('Falha ao salvar data de release:', e);
    return { ok: false };
  }
}
