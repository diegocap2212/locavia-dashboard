import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FolderKanban, Infinity as InfinityIcon, RefreshCw, Check, Save, Pencil, X } from 'lucide-react';
import PageHero from '../components/PageHero';
import Button from '../components/ui/Button';
import { PROJECTS, getProject } from '../config/projects';
import {
  getProjectStatus, savePhaseProgress,
  type ProjectStatusMap, type PhaseStatus, type PhaseProgress,
} from '../services/projectStatusService';

const POLL_MS = 45_000;

const STATUS_META: Record<PhaseStatus, { label: string; bg: string; fg: string; dot: string }> = {
  nao_iniciada: { label: 'Não iniciada', bg: 'var(--surface-2)', fg: 'var(--text-tertiary)', dot: 'var(--border-strong)' },
  em_andamento: { label: 'Em andamento', bg: 'var(--accent-soft)', fg: 'var(--accent-strong)', dot: 'var(--accent)' },
  em_risco:     { label: 'Em risco',     bg: 'var(--warn-bg)',    fg: 'var(--warn-fg)',     dot: 'var(--warn)' },
  concluida:    { label: 'Concluída',    bg: 'var(--ok-bg)',      fg: 'var(--ok-fg)',       dot: 'var(--ok)' },
};
const STATUS_ORDER: PhaseStatus[] = ['nao_iniciada', 'em_andamento', 'em_risco', 'concluida'];

const fmtUpdated = (iso: string | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const inputStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: 8,
  padding: '7px 10px', fontSize: '0.85rem', color: 'var(--text-main)', fontFamily: 'inherit', width: '100%',
};
const labelStyle: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 4, display: 'block',
};

const StatusBadge: React.FC<{ status: PhaseStatus }> = ({ status }) => {
  const m = STATUS_META[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999,
      fontSize: '0.72rem', fontWeight: 700, background: m.bg, color: m.fg, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.dot, display: 'inline-block' }} />
      {m.label}
    </span>
  );
};

interface PhaseEditorProps {
  initial: PhaseProgress | undefined;
  onSave: (v: { status: PhaseStatus; progress: number; note: string; updatedBy: string }) => Promise<boolean>;
  onCancel: () => void;
}
const PhaseEditor: React.FC<PhaseEditorProps> = ({ initial, onSave, onCancel }) => {
  const [status, setStatus] = useState<PhaseStatus>(initial?.status ?? 'nao_iniciada');
  const [progress, setProgress] = useState<number>(initial?.progress ?? 0);
  const [note, setNote] = useState<string>(initial?.note ?? '');
  const [updatedBy, setUpdatedBy] = useState<string>(initial?.updatedBy ?? '');
  const [saving, setSaving] = useState(false);

  return (
    <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px dashed var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem', alignItems: 'end' }}>
      <div>
        <label style={labelStyle}>Status</label>
        <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as PhaseStatus)}>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Progresso (%)</label>
        <input type="number" min={0} max={100} style={inputStyle} value={progress}
          onChange={e => setProgress(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
      </div>
      <div>
        <label style={labelStyle}>Responsável</label>
        <input type="text" style={inputStyle} placeholder="seu nome" value={updatedBy} onChange={e => setUpdatedBy(e.target.value)} />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={labelStyle}>Observação / próximo passo</label>
        <input type="text" style={inputStyle} placeholder="ex.: aguardando acesso ao Confluence" value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <Button variant="tertiary" size="sm" icon={<X size={15} />} onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button
          variant="primary" size="sm" disabled={saving}
          icon={saving ? <RefreshCw className="animate-spin" size={15} /> : <Save size={15} />}
          onClick={async () => { setSaving(true); const ok = await onSave({ status, progress, note, updatedBy }); setSaving(false); if (ok) onCancel(); }}
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
};

const ProjectTracking: React.FC = () => {
  const { projectId } = useParams();
  const project = getProject(projectId) ?? PROJECTS[0];

  const [statusMap, setStatusMap] = useState<ProjectStatusMap>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = await getProjectStatus();
    setStatusMap(data);
    setLastSync(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // "Vivo": refetch ao voltar o foco/visibilidade da aba + polling leve em background.
  const editingRef = useRef(editingId);
  editingRef.current = editingId;
  useEffect(() => {
    const onFocus = () => { if (!editingRef.current) refresh(); };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    const t = setInterval(() => { if (!editingRef.current && document.visibilityState === 'visible') refresh(); }, POLL_MS);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
      clearInterval(t);
    };
  }, [refresh]);

  const phaseStatus = statusMap[project.id] ?? {};
  const progressOf = (phaseId: string): PhaseProgress | undefined => phaseStatus[phaseId];

  // Resumo do projeto: % médio e fase atual (primeira em andamento, senão primeira não concluída).
  const overall = useMemo(() => {
    const ps = project.phases.map(p => progressOf(p.id));
    const avg = Math.round(project.phases.reduce((acc, p) => {
      const r = phaseStatus[p.id];
      return acc + (r?.status === 'concluida' ? 100 : (r?.progress ?? 0));
    }, 0) / Math.max(1, project.phases.length));
    const current = project.phases.find(p => progressOf(p.id)?.status === 'em_andamento')
      ?? project.phases.find(p => (progressOf(p.id)?.status ?? 'nao_iniciada') !== 'concluida');
    const done = ps.filter(r => r?.status === 'concluida').length;
    return { avg, current, done };
  }, [statusMap, project]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (phaseId: string, v: { status: PhaseStatus; progress: number; note: string; updatedBy: string }) => {
    const { ok, record } = await savePhaseProgress({ projectId: project.id, phaseId, ...v });
    if (ok && record) {
      setStatusMap(prev => ({ ...prev, [project.id]: { ...(prev[project.id] ?? {}), [phaseId]: record } }));
      setSavedId(phaseId);
      setTimeout(() => setSavedId(s => (s === phaseId ? null : s)), 2500);
    }
    return ok;
  };

  return (
    <>
      <PageHero
        eyebrow={project.eyebrow}
        title={project.name}
        subtitle={project.headline}
        leading={<FolderKanban size={28} color="var(--accent-strong)" />}
        status={{
          label: `${overall.done}/${project.phases.length} fases · ${overall.avg}%`,
          bg: 'var(--accent-soft)', text: 'var(--accent-strong)', border: 'var(--accent-soft)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {overall.current && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Fase atual: <strong style={{ color: 'var(--text-main)' }}>{overall.current.title}</strong>
            </span>
          )}
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
            {lastSync && <>atualizado {fmtUpdated(lastSync.toISOString())}</>}
            <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={refresh}>Atualizar</Button>
          </span>
        </div>
      </PageHero>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '2rem 2.5rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Timeline de fases */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <RefreshCw className="animate-spin" size={28} color="var(--primary)" />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {project.phases.map(phase => {
              const rec = progressOf(phase.id);
              const status = rec?.status ?? 'nao_iniciada';
              const pct = status === 'concluida' ? 100 : (rec?.progress ?? 0);
              const editing = editingId === phase.id;
              const isSaved = savedId === phase.id;
              return (
                <div key={phase.id} className="premium-card" style={{ padding: '1rem 1.25rem', borderLeft: `3px solid ${STATUS_META[status].dot}` }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
                    {/* Chip do mês (navy-like, invertendo por tema) */}
                    <div style={{
                      flexShrink: 0, width: 92, borderRadius: 10, padding: '0.6rem 0.5rem',
                      background: 'var(--text-main)', color: 'var(--page)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.04em' }}>{phase.monthLabel}</span>
                      <span style={{ fontSize: '0.66rem', opacity: 0.75, fontWeight: 600 }}>Fase {phase.order}</span>
                    </div>

                    {/* Conteúdo */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>{phase.title}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{phase.description}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <StatusBadge status={status} />
                          {!editing && (
                            <Button variant="tertiary" size="sm" icon={isSaved ? <Check size={14} /> : <Pencil size={14} />} onClick={() => setEditingId(phase.id)}>
                              {isSaved ? 'Salvo' : 'Atualizar'}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      <div style={{ marginTop: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: STATUS_META[status].dot, borderRadius: 999, transition: 'width 0.5s ease' }} />
                        </div>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'monospace', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                      </div>

                      {rec?.note && !editing && (
                        <p style={{ margin: '0.6rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          “{rec.note}”
                        </p>
                      )}
                      {rec?.updatedAt && !editing && (
                        <p style={{ margin: '0.35rem 0 0', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                          Atualizado {rec.updatedBy ? `por ${rec.updatedBy} ` : ''}em {fmtUpdated(rec.updatedAt)}
                        </p>
                      )}

                      {editing && (
                        <PhaseEditor
                          initial={rec}
                          onSave={v => handleSave(phase.id, v)}
                          onCancel={() => setEditingId(null)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trilha contínua */}
        {project.continuous && (
          <aside style={{
            background: 'var(--accent-soft)', borderRadius: 16, border: '1px solid var(--border-subtle)',
            padding: '1.5rem', position: 'sticky', top: '1.5rem',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: 'var(--text-main)', color: 'var(--page)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
            }}>
              <InfinityIcon size={24} />
            </div>
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent-strong)' }}>
              {project.continuous.label}
            </p>
            <h3 style={{ margin: '0.4rem 0 0.8rem', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
              {project.continuous.title}
            </h3>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {project.continuous.description}
            </p>
          </aside>
        )}
      </div>
    </>
  );
};

export default ProjectTracking;
