import type { CommentsData, MetricComment } from '../types/comments';

export async function getComments(): Promise<CommentsData> {
  try {
    const response = await fetch('/api/comments');
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error('Failed to fetch comments from backend:', e);
  }
  return {};
}

/**
 * Salva UM comentário de forma atômica e isolada.
 * O backend faz HSET apenas no campo correspondente — não há read-modify-write
 * do blob inteiro, então editores concorrentes não se sobrescrevem.
 */
export async function saveComment(
  squadId: string,
  releaseId: string,
  quinzenaId: string,
  metricId: string,
  comment: MetricComment
): Promise<{ ok: boolean; updatedAt?: string }> {
  try {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ squadId, releaseId, quinzenaId, metricId, ...comment }),
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
