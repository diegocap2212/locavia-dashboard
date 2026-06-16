export interface RefreshStatus {
  status: 'queued' | 'in_progress' | 'completed' | 'unknown';
  conclusion?: 'success' | 'failure' | null;
  createdAt?: string;
  url?: string;
  error?: string;
}

/** Dispara o sync do Jira (workflow_dispatch via /api/refresh). */
export async function triggerRefresh(): Promise<{ ok: boolean; alreadyRunning?: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/refresh', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error || `HTTP ${res.status}` };
    return { ok: true, alreadyRunning: data?.alreadyRunning, message: data?.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Consulta o status da última execução do workflow de sync. */
export async function getRefreshStatus(): Promise<RefreshStatus> {
  try {
    const res = await fetch('/api/refresh', { method: 'GET' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { status: 'unknown', error: data?.error || `HTTP ${res.status}` };
    return data as RefreshStatus;
  } catch (e) {
    return { status: 'unknown', error: e instanceof Error ? e.message : String(e) };
  }
}
