import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle2, Activity, Clock, ChevronRight } from 'lucide-react';
import { useTeamReleaseData } from '../hooks/useTeamReleaseData';
import { KPICard } from '../components/KPICard';
import PageHero from '../components/PageHero';
import { teamLabel } from '../config/teamLabels';

const TeamDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const teamName = decodeURIComponent(teamId ?? '');
  const teamDisplay = teamLabel(teamName);

  const { totals, releases, loading } = useTeamReleaseData(teamName);

  const backButton = (
    <button
      onClick={() => navigate('/')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'var(--surface)', border: '1px solid var(--border-default)',
        borderRadius: 9, padding: '8px 12px', cursor: 'pointer',
        fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)',
      }}
      title="Voltar"
    >
      <ArrowLeft size={15} />
    </button>
  );

  return (
    <>
      <PageHero
        eyebrow="Time · LM"
        title={teamDisplay}
        subtitle="Entregas do time, organizadas por release"
        leading={backButton}
      />

      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '2rem 2.5rem' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
        ) : totals.total === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhum item encontrado para o time <strong>{teamDisplay}</strong>.
          </div>
        ) : (
          <>
            {/* Placar do time */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <KPICard title="Escopo Total" value={totals.total} subtext="itens do time" icon={Users} accent="var(--accent)" />
              <KPICard title="Entregues" value={totals.delivered} subtext="concluídos" icon={CheckCircle2} accent="var(--accent)" />
              <KPICard title="WIP" value={totals.wip} subtext="em andamento" icon={Activity} accent="var(--warn)" />
              <KPICard title="Lead Time" value={`${totals.avgLeadTime.toFixed(1)}d`} subtext="criado → resolvido" icon={Clock} accent="#F59E0B" />
            </div>

            {/* Entregas por release */}
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Entregas por Release
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {releases.map(r => {
                const pct = r.total > 0 ? Math.round((r.delivered / r.total) * 100) : 0;
                return (
                  <div
                    key={r.releaseId}
                    onClick={r.isOfficial ? () => navigate(`/release/${r.releaseId}`) : undefined}
                    className="premium-card"
                    style={{
                      padding: '1.25rem',
                      cursor: r.isOfficial ? 'pointer' : 'default',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (r.isOfficial) (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-brand)'; }}
                    onMouseLeave={e => { if (r.isOfficial) (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {r.releaseId}
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {r.displayName}
                        </p>
                      </div>
                      {r.isOfficial && <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginTop: 2 }} />}
                    </div>

                    {/* Progresso */}
                    <div style={{ background: 'var(--bg-color)', borderRadius: 999, height: 6, marginBottom: '0.6rem', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--green-400), var(--green-700))', borderRadius: 999 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.75rem' }}>
                      <span>{r.delivered}/{r.total} entregues ({pct}%)</span>
                      <span>{r.wip} WIP</span>
                    </div>

                    <div style={{ display: 'flex', gap: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1 }}>{r.total}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>itens</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-strong)', lineHeight: 1 }}>{r.avgLeadTime.toFixed(1)}d</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>lead time</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default TeamDetail;
