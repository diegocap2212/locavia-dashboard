import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, CheckCircle2, Clock, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboardData, type ConeType, excelToJSDate, formatDate } from '../hooks/useDashboardData';
import { WeeklyVazaoChart } from '../components/WeeklyVazaoChart';
import { WeeklyLeadTimeChart } from '../components/WeeklyLeadTimeChart';
import { KPICard } from '../components/KPICard';
import PageHero, { deriveStatus } from '../components/PageHero';
import Tabs from '../components/Tabs';
import { CHART } from '../lib/chartColors';
import releaseConfig from '../config/release-config.json';

const TABS = [
  { id: 'fluxo', label: 'Fluxo' },
  { id: 'leadtime', label: 'Lead Time' },
  { id: 'backlog', label: 'Backlog' },
];

const ReleaseDetail: React.FC = () => {
  const { releaseId } = useParams<{ releaseId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('fluxo');

  const relConf = releaseConfig.releases.find(r => r.id === releaseId);
  const coneType: ConeType = relConf?.generation === 'gen2' ? 'bf-cem' : 'locavia';

  const {
    loading,
    weeklyPerformance,
    metrics,
    filteredList,
    releaseCones,
    setSelectedReleases,
  } = useDashboardData(coneType);

  useEffect(() => {
    if (releaseId) setSelectedReleases([releaseId]);
  }, [releaseId, setSelectedReleases]);

  if (!relConf) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Release não encontrada.{' '}
        <button onClick={() => navigate('/')} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Voltar
        </button>
      </div>
    );
  }

  const cone = releaseCones.find(r => r.releaseId === releaseId);
  const status = cone
    ? deriveStatus(cone.summary.remaining, cone.summary.entregaMelhor, cone.summary.entregaPior)
    : undefined;

  const backButton = (
    <button
      onClick={() => navigate('/')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: 9, padding: '8px 12px', cursor: 'pointer',
        fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)',
      }}
      title="Voltar ao cone"
    >
      <ArrowLeft size={15} />
    </button>
  );

  const subtitle = `Métricas de fluxo · ${relConf.generation === 'gen2' ? 'Gen 2 (scope-creep)' : 'Gen 1'}`;
  const lastSaldo = weeklyPerformance?.[weeklyPerformance.length - 1]?.Saldo || 0;

  return (
    <>
      <PageHero eyebrow="Release · LM" title={relConf.displayName} subtitle={subtitle} leading={backButton} status={status} />

      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '2rem 2.5rem' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
        ) : (
          <>
            {/* Placar de KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
              <KPICard title="Escopo Total" value={metrics.totalItems} subtext="itens no escopo" icon={Users} accent="#2BBB92" />
              <KPICard title="Entregas" value={metrics.deliveredCount} subtext="concluídas" icon={CheckCircle2} accent="#2BBB92" />
              <KPICard title="WIP" value={metrics.wipCount} subtext="em desenvolvimento" icon={Activity} accent="#8B0CF6" />
              <KPICard title="Lead Time" value={`${metrics.avgLeadTime}d`} subtext="criado → resolvido" icon={Clock} accent="#F59E0B" />
            </div>

            <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

            {/* ── FLUXO ── */}
            {activeTab === 'fluxo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <WeeklyVazaoChart data={weeklyPerformance} />

                <div className="premium-card chart-section">
                  <div className="chart-header">
                    <h3 className="chart-title">Fluxo de Entrada vs Saída</h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Demandas criadas vs entregues (últimas 8 semanas)</span>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={weeklyPerformance.slice(-8)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
                        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Bar dataKey="Entradas" name="Demandas Criadas" fill={CHART.neutral} radius={[4, 4, 0, 0]} barSize={16} />
                        <Bar dataKey="Saídas" name="Entregas Feitas" fill={CHART.mint} radius={[4, 4, 0, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Saldo (semana atual)</span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', color: lastSaldo > 0 ? 'var(--danger)' : 'var(--brand-mint)' }}>
                      {lastSaldo > 0 ? '+' : ''}{lastSaldo}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── LEAD TIME ── */}
            {activeTab === 'leadtime' && (
              <WeeklyLeadTimeChart data={weeklyPerformance} height={340} />
            )}

            {/* ── BACKLOG ── */}
            {activeTab === 'backlog' && (
              <div className="premium-card" style={{ overflow: 'hidden' }}>
                <div className="chart-header" style={{ padding: '1.5rem 1.75rem 0', borderBottom: 'none' }}>
                  <h3 className="chart-title">Itens da Release</h3>
                </div>
                <div style={{ overflowX: 'auto', padding: '0 1.75rem 1.5rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Issue</th><th>Tipo</th><th>Descrição</th><th>Status</th><th>Criado</th></tr>
                    </thead>
                    <tbody>
                      {filteredList.slice(0, 30).map(item => {
                        const isDone = item.Status.includes('DONE') || item.Status.includes('CONCLU');
                        return (
                          <tr key={item.Key}>
                            <td className="detail-key">{item.Key}</td>
                            <td><span className="badge badge-neutral">{item.Type}</span></td>
                            <td style={{ maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{item.Summary as string}</td>
                            <td><span className={`badge ${isDone ? 'badge-success' : 'badge-warning'}`}>{item.Status}</span></td>
                            <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                              {(() => { const d = excelToJSDate(item.Created); return d ? formatDate(d) : '—'; })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ReleaseDetail;
