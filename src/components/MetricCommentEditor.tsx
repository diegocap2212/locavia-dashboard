import React, { useState, useEffect } from 'react';
import { Edit3, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { getComments, saveComment } from '../services/commentsService';

interface Props {
  squadId: string;
  releaseId: string;
  quinzenaId: string;
  metricId: string;
  metricLabel: string;
  placeholderGap?: string;
  placeholderAction?: string;
}

export const MetricCommentEditor: React.FC<Props> = ({
  squadId,
  releaseId,
  quinzenaId,
  metricId,
  metricLabel,
  placeholderGap = "Identifique qual foi o gargalo neste período...",
  placeholderAction = "Proponha a solução ágil e planos de ação do time..."
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [gap, setGap] = useState('');
  const [action, setAction] = useState('');

  // Load comments on mount and when targets change
  useEffect(() => {
    let isMounted = true;
    // Reset imediato para evitar mostrar análise do target anterior enquanto carrega
    setGap('');
    setAction('');
    setIsEditing(false);
    getComments().then(data => {
      if (!isMounted) return;
      const comment = data[squadId]?.[releaseId]?.[quinzenaId]?.[metricId] || { gap: '', action: '' };
      setGap(comment.gap || '');
      setAction(comment.action || '');
    });
    return () => { isMounted = false; };
  }, [squadId, releaseId, quinzenaId, metricId]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(false);

    // Escrita atômica e isolada: o backend faz HSET apenas neste campo.
    // Não há mais read-modify-write do blob inteiro, então editores
    // concorrentes na mesma página não se sobrescrevem.
    const ok = await saveComment(squadId, releaseId, quinzenaId, metricId, { gap, action });

    setIsSaving(false);
    if (ok) {
      setIsEditing(false);
    } else {
      setSaveError(true);
    }
  };

  return (
    <div className="premium-card" style={{ padding: '1.25rem', marginTop: '1rem', border: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Análise Qualitativa — {metricLabel}
        </h4>
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
        </div>
      )}
    </div>
  );
};
