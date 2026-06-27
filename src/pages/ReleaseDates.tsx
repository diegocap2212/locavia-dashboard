import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, RefreshCw, Save } from 'lucide-react';
import PageHero from '../components/PageHero';
import Button from '../components/ui/Button';
import releaseConfig from '../config/release-config.json';
import { getReleaseDates, saveReleaseDate, type ReleaseDateRecord } from '../services/releaseDatesService';

const activeReleases = releaseConfig.releases.filter(r => r.active !== false && r.id !== 'DEFAULT');

/** ISO (com hora) → "YYYY-MM-DD" para preencher <input type="date">. */
const isoToDateInput = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const fmtUpdated = (iso: string | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

interface RowState {
  startDate: string;
  targetDate: string;
  note: string;
  updatedBy: string;
}

const inputStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border-default)',
  borderRadius: 8,
  padding: '7px 10px',
  fontSize: '0.85rem',
  color: 'var(--text-main)',
  fontFamily: 'inherit',
  width: '100%',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-tertiary)',
  marginBottom: 4, display: 'block',
};

const ReleaseDates: React.FC = () => {
  const [records, setRecords] = useState<Record<string, ReleaseDateRecord>>({});
  const [drafts, setDrafts] = useState<Record<string, RowState>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Defaults vindos do config (data-alvo estática) — usados quando ainda não há registro no Redis.
  const configDefaults = useMemo(() => {
    const map: Record<string, string> = {};
    activeReleases.forEach(r => { map[r.id] = isoToDateInput(r.deadline); });
    return map;
  }, []);

  useEffect(() => {
    let alive = true;
    getReleaseDates()
      .then(data => {
        if (!alive) return;
        setRecords(data);
        const initial: Record<string, RowState> = {};
        activeReleases.forEach(r => {
          const rec = data[r.id];
          initial[r.id] = {
            startDate: isoToDateInput(rec?.startDate),
            targetDate: rec?.targetDate ? isoToDateInput(rec.targetDate) : configDefaults[r.id],
            note: rec?.note ?? '',
            updatedBy: rec?.updatedBy ?? '',
          };
        });
        setDrafts(initial);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [configDefaults]);

  const update = (id: string, patch: Partial<RowState>) =>
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleSave = async (id: string) => {
    const d = drafts[id];
    if (!d) return;
    setSavingId(id);
    setSavedId(null);
    const { ok, record } = await saveReleaseDate({
      releaseId: id,
      startDate: d.startDate || null,
      targetDate: d.targetDate || null,
      note: d.note,
      updatedBy: d.updatedBy,
    });
    setSavingId(null);
    if (ok && record) {
      setRecords(prev => ({ ...prev, [id]: record }));
      setSavedId(id);
      setTimeout(() => setSavedId(s => (s === id ? null : s)), 2500);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Locavia · Planejamento"
        title="Datas das Releases"
        subtitle="Defina o início e a data-alvo de cada release. As metas alimentam o status (no prazo / em risco / atrasado) do cone."
        leading={<CalendarDays size={28} color="var(--accent-strong)" />}
      />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 2.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <RefreshCw className="animate-spin" size={28} color="var(--primary)" />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {activeReleases.map(r => {
              const d = drafts[r.id] ?? { startDate: '', targetDate: '', note: '', updatedBy: '' };
              const rec = records[r.id];
              const isSaving = savingId === r.id;
              const isSaved = savedId === r.id;
              return (
                <div key={r.id} className="premium-card" style={{ padding: '1.25rem 1.5rem', borderLeft: '3px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{r.id}</span>
                      <p style={{ margin: '2px 0 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{r.displayName}</p>
                    </div>
                    {rec?.updatedAt && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        Última edição {rec.updatedBy ? `por ${rec.updatedBy} ` : ''}em {fmtUpdated(rec.updatedAt)}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div>
                      <label style={labelStyle}>Início (kickoff)</label>
                      <input type="date" style={inputStyle} value={d.startDate} onChange={e => update(r.id, { startDate: e.target.value })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Data-alvo (meta)</label>
                      <input type="date" style={inputStyle} value={d.targetDate} onChange={e => update(r.id, { targetDate: e.target.value })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Responsável</label>
                      <input type="text" style={inputStyle} placeholder="seu nome" value={d.updatedBy} onChange={e => update(r.id, { updatedBy: e.target.value })} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Observação</label>
                      <input type="text" style={inputStyle} placeholder="ex.: dependência externa, congelamento de escopo…" value={d.note} onChange={e => update(r.id, { note: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <Button
                      variant={isSaved ? 'accent' : 'primary'}
                      size="sm"
                      onClick={() => handleSave(r.id)}
                      disabled={isSaving}
                      icon={isSaving ? <RefreshCw className="animate-spin" size={15} /> : isSaved ? <Check size={15} /> : <Save size={15} />}
                    >
                      {isSaving ? 'Salvando…' : isSaved ? 'Salvo' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default ReleaseDates;
