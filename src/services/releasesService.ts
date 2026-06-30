/**
 * Releases criadas pela LM em runtime — persistidas no Redis via /api/releases.
 * Somam-se às releases estáticas do release-config.json (a lista efetiva é montada no
 * useDashboardData). Uma release criada aparece no seletor na hora; o cone só renderiza
 * quando houver itens no Jira com o label dela.
 */
export interface CreatedRelease {
  id: string;
  displayName: string;
  deadline: string;            // ISO — data-alvo/meta
  cone: 'locavia' | 'bf-cem';
  generation: 'gen1' | 'gen2';
  percentileWindow: number;
  active: boolean;
  createdAt: string;
  createdBy?: string;
}

export type CreatedReleasesMap = Record<string, CreatedRelease>;

export async function getCreatedReleases(): Promise<CreatedRelease[]> {
  try {
    const res = await fetch('/api/releases', { credentials: 'same-origin' });
    if (res.ok) {
      const map = (await res.json()) as CreatedReleasesMap;
      return Object.values(map);
    }
  } catch (e) {
    console.error('Falha ao buscar releases criadas:', e);
  }
  return [];
}

export interface CreateReleaseInput {
  id: string;
  displayName: string;
  deadline: string;            // "YYYY-MM-DD" ou ISO
  cone: 'locavia' | 'bf-cem';
  generation: 'gen1' | 'gen2';
  percentileWindow: number;
  createdBy?: string;
}

export async function createRelease(
  input: CreateReleaseInput
): Promise<{ ok: boolean; record?: CreatedRelease; error?: string }> {
  try {
    const res = await fetch('/api/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: (data && data.error) || 'Falha ao criar release.' };
    }
    return { ok: true, record: data.record };
  } catch (e) {
    console.error('Falha ao criar release:', e);
    return { ok: false, error: 'Erro de rede ao criar release.' };
  }
}
