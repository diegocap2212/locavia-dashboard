import React, { useState, useEffect } from 'react';
import { Edit3, Save, AlertCircle, CheckCircle, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { getComments, saveComment, type Cadence } from '../services/commentsService';
import { getQuinzenaById } from '../config/quinzenas';

interface Props {
  squadId: string;
  releaseId: string;
  quinzenaId: string;          // id do período (quinzenaId ou semanaId, conforme a cadência)
  metricId: string;
  metricLabel: string;
  cadence?: Cadence;           // 'quinzena' (default) | 'semana'
  periodLabel?: string;        // rótulo do período; se ausente, busca pela quinzena
  placeholderGap?: string;
  placeholderAction?: string;
}

export const MetricCommentEditor: React.FC<Props> = ({
  squadId,
  releaseId,
  quinzenaId,
  metricId,
  metricLabel,
  cadence = 'quinzena',
  periodLabel,
  placeholderGap = "Identifique qual foi o gargalo neste período...",
  placeholderAction = "Proponha a solução ágil e planos de ação do time..."
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [gap, setGap] = useState('');
  const [action, setAction] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | undefined>(undefined);

  const periodDisplayLabel = periodLabel ?? getQuinzenaById(quinzenaId)?.label;

  // Carrega a análise do alvo atual. O reset ao trocar de alvo é feito por remontagem
  // (prop `key` no call-site), então aqui não há setState síncrono no corpo do effect —
  // só a escrita assíncrona quando a busca resolve.
  useEffect(() => {
    let isMounted = true;
    getComments(cadence).then(data => {
      if (!isMounted) return;
      const comment = data[squadId]?.[releaseId]?.[quinzenaId]?.[metricId] || { gap: '', action: '' };
      setGap(comment.gap || '');
      setAction(comment.action || '');
      setUpdatedAt(comment.updatedAt);
    });
    return () => { isMounted = false; };
  }, [squadId, releaseId, quinzenaId, metricId, cadence]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(false);

    // Escrita atômica e isolada: o backend faz HSET apenas neste campo.
    // Não há mais read-modify-write do blob inteiro, então editores
    // concorrentes na mesma página não se sobrescrevem.
    const res = await saveComment(squadId, releaseId, quinzenaId, metricId, { gap, action }, cadence);

    setIsSaving(false);
    if (res.ok) {
      setUpdatedAt(res.updatedAt);
      setIsEditing(false);
    } else {
      setSaveError(true);
    }
  };

  return (
    <div className="premium-card" style={{ padding: '1.25rem', marginTop: '1rem', border: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Análise Qualitativa — {metricLabel}
          </h4>
          {periodDisplayLabel && (
            <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              {periodDisplayLabel}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              background: isEditing ? 'var(--success-light)' : 'var(--bg-color)',
              color: isEditing ? 'var(--success)' : 'var(--text-muted)',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            {isSaving ? (
              <>Salvando...</>
            ) : isEditing ? (
              <>
                <Save size={12} /> Salvar Análise
              </>
            ) : (
              <>
                <Edit3 size={12} /> Registrar Diagnóstico
              </>
            )}
          </button>
          {saveError && (
            <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>
              Erro ao salvar. Verifique a conexão e tente novamente.
            </span>
          )}
        </div>
      </div>

      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} className="text-red-500" /> Diagnóstico (Gap identificado)
            </label>
            <textarea
              value={gap}
              onChange={(e) => setGap(e.target.value)}
              placeholder={placeholderGap}
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '0.85rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-main)',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} className="text-emerald-500" /> Plano de Ação (Solução proposta)
            </label>
            <textarea
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder={placeholderAction}
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '0.85rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-main)',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.08)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
              🔴 Diagnóstico
            </span>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
              {gap || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhum diagnóstico registrado pelo Scrum Master para esta métrica.</span>}
            </p>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.08)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
              🟢 Plano de Ação
            </span>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
              {action || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhum plano de ação registrado pelo Scrum Master para esta métrica.</span>}
            </p>
          </div>
          {updatedAt && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              <CalendarClock size={11} /> Última edição em {format(new Date(updatedAt), 'dd/MM/yyyy HH:mm')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
