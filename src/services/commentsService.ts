import defaultComments from '../config/comments.json';
import type { CommentsData } from '../types/comments';

const LOCAL_STORAGE_KEY = 'locavia_dashboard_comments';

export function getComments(): CommentsData {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const local = stored ? JSON.parse(stored) : {};
    return { ...defaultComments, ...local };
  } catch (e) {
    console.error('Failed to parse stored comments, using default config:', e);
    return defaultComments as CommentsData;
  }
}

export function saveComments(comments: CommentsData) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(comments));
  } catch (e) {
    console.error('Failed to save comments in localStorage:', e);
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
