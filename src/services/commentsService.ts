import defaultComments from '../config/comments.json';
import type { CommentsData } from '../types/comments';

export async function getComments(): Promise<CommentsData> {
  try {
    const response = await fetch('/api/comments');
    if (response.ok) {
      const data = await response.json();
      return { ...defaultComments, ...data };
    }
  } catch (e) {
    console.error('Failed to fetch comments from backend, using default config:', e);
  }
  return defaultComments as CommentsData;
}

export async function saveComments(comments: CommentsData): Promise<void> {
  try {
    await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comments),
    });
  } catch (e) {
    console.error('Failed to save comments to backend:', e);
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
