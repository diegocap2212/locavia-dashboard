/**
 * Andamento (vivo) dos projetos — persistido no Redis via /api/project-status.
 * A estrutura das fases vem de src/config/projects.ts; aqui só trafega o status editável.
 */
export type PhaseStatus = 'nao_iniciada' | 'em_andamento' | 'em_risco' | 'concluida';

export interface PhaseProgress {
  status: PhaseStatus;
  progress: number;      // 0..100
  note: string;
  updatedAt: string;     // ISO (servidor)
  updatedBy?: string;
}

/** { [projectId]: { [phaseId]: PhaseProgress } } */
export type ProjectStatusMap = Record<string, Record<string, PhaseProgress>>;

export async function getProjectStatus(): Promise<ProjectStatusMap> {
  try {
    const res = await fetch('/api/project-status', { credentials: 'same-origin' });
    if (res.ok) return (await res.json()) as ProjectStatusMap;
  } catch (e) {
    console.error('Falha ao buscar andamento dos projetos:', e);
  }
  return {};
}

export async function savePhaseProgress(input: {
  projectId: string;
  phaseId: string;
  status: PhaseStatus;
  progress: number;
  note?: string;
  updatedBy?: string;
}): Promise<{ ok: boolean; record?: PhaseProgress }> {
  try {
    const res = await fetch('/api/project-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      console.error('Falha ao salvar andamento:', await res.json().catch(() => ({})));
      return { ok: false };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, record: data.record };
  } catch (e) {
    console.error('Falha ao salvar andamento:', e);
    return { ok: false };
  }
}
