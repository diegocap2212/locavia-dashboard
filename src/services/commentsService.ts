import type { CommentsData, MetricComment } from '../types/comments';

/**
 * Cadência da análise — define em qual hash do Redis o comentário vive:
 *   'quinzena' → locavia_dashboard_comments_v2 (legado: Locavia/BF-CEM)
 *   'semana'   → locavia_dashboard_comments_v3_semana (SMDashboard, cadência semanal)
 * Migração não-destrutiva: os dois coexistem; o v2 antigo segue legível.
 */
export type Cadence = 'quinzena' | 'semana';

export async function getComments(cadence: Cadence = 'quinzena'): Promise<CommentsData> {
  try {
    const response = await fetch(`/api/comments?cadence=${cadence}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error('Failed to fetch comments from backend:', e);
  }
  return {};
}

/**
 * Salva UM comentário de forma atômica e isolada (HSET de um único campo no backend).
 * `periodId` é o id do período: quinzenaId (cadência quinzena) ou semanaId (cadência semana).
 */
export async function saveComment(
  squadId: string,
  releaseId: string,
  periodId: string,
  metricId: string,
  comment: MetricComment,
  cadence: Cadence = 'quinzena'
): Promise<{ ok: boolean; updatedAt?: string }> {
  try {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Mantém o nome de campo `quinzenaId` no payload (contrato do backend); o valor é o id do período.
      body: JSON.stringify({ squadId, releaseId, quinzenaId: periodId, metricId, cadence, ...comment }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Failed to save comment:', err);
      return { ok: false };
    }
    const data = await response.json().catch(() => ({}));
    return { ok: true, updatedAt: data.updatedAt };
  } catch (e) {
    console.error('Failed to save comment to backend:', e);
    return { ok: false };
  }
}

export function exportComments(comments: CommentsData) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(comments, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "comments.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
