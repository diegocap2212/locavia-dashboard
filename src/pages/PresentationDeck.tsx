import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart
} from 'recharts';
import {
  ArrowLeft, ArrowRight, Download, Printer, ChevronLeft
} from 'lucide-react';
import { SM_CONFIGS } from '../config/sm-config';
import type { SMConfig } from '../config/sm-config';
import { useSMDashboardData } from '../hooks/useSMDashboardData';
import { useDashboardData } from '../hooks/useDashboardData';
import { getComments, exportComments } from '../services/commentsService';
import type { CommentsData } from '../types/comments';
import { getQuinzenas, getAutomaticActiveQuinzena, getQuinzenaById } from '../config/quinzenas';

// Normalized interface for both SM and BFCEM/Locavia presentations
interface PresentationData {
  title: string;
  subtitle: string;
  badge: string;
  kpis: {
    throughput: number;
    leadTime: string | number | null;
    wip: number;
    aFazer: number;
  };
  throughputData: {
    name: string;
    throughput: number;
    stories: number;
    bugs: number;
    tasks: number;
    spikes: number;
    others: number;
    leadTime: number | null;
  }[];
  flowBalanceData: {
    name: string;
    entradas: number;
    saidas: number;
    saldo: number;
  }[];
  commentsSquadId: string;
  commentsReleaseId: string;
}

// Custom tooltip for slides Recharts
const SlideTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: '#111726',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '10px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      color: '#f3f4f6',
      fontSize: '0.8rem'
    }}>
      <p style={{ fontWeight: 700, marginBottom: '6px', color: '#9ca3af', textTransform: 'uppercase' }}>
        Semana {label}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', gap: '16px', margin: '3px 0' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d1d5db' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span style={{ fontWeight: 700, color: '#f3f4f6' }}>
            {entry.value !== null ? (entry.dataKey.includes('Lead') || entry.dataKey.includes('lead') ? `${entry.value}d` : entry.value) : '-'}
          </span>
        </div>
      ))}
    </div>
  );
};

interface DeckLayoutProps {
  data: PresentationData;
  selectedQuinzenaId: string;
  setSelectedQuinzenaId: (val: string) => void;
}

// Layout principal do Deck
const DeckLayout: React.FC<DeckLayoutProps> = ({ data, selectedQuinzenaId, setSelectedQuinzenaId }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [comments, setComments] = useState<CommentsData>({});

  // Carregar comentários
  useEffect(() => {
    setComments(getComments());
  }, [data, selectedQuinzenaId]);

  const squadComments = comments[data.commentsSquadId]?.[data.commentsReleaseId]?.[selectedQuinzenaId] || {};

  const slidesCount = 5;

  const nextSlide = () => {
    setCurrentSlide(prev => (prev < slidesCount - 1 ? prev + 1 : 0));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev > 0 ? prev - 1 : slidesCount - 1));
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Volta para a view de origem
        if (data.commentsSquadId === 'bf-cem') {
          navigate('/cone-bf-cem');
        } else if (data.commentsSquadId === 'locavia') {
          navigate('/');
        } else {
          navigate(`/sm/${data.commentsSquadId}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, navigate]);

  const handleExport = () => {
    exportComments(getComments());
  };

  const handlePrint = () => {
    window.print();
  };

  const getMetricComment = (metricId: string) => {
    const comment = squadComments[metricId] || { gap: '', action: '' };
    return {
      gap: comment.gap || '',
      action: comment.action || ''
    };
  };

  // Estilo de gradientes radial para fundo premium
  const bgGradient = currentSlide % 2 === 0
    ? 'radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 40%), #090d16'
    : 'radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.06) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 50%), #090d16';

  return (
    <div className="presentation-page" style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      backgroundColor: '#090d16',
      color: '#f3f4f6',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'relative',
      background: bgGradient,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Botões Superiores */}
      <div className="no-print" style={{
        position: 'absolute',
        top: '2rem',
        left: '4rem',
        right: '4rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => {
              if (data.commentsSquadId === 'bf-cem') navigate('/cone-bf-cem');
              else if (data.commentsSquadId === 'locavia') navigate('/');
              else navigate(`/sm/${data.commentsSquadId}`);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '8px 16px',
              borderRadius: '8px',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            <ChevronLeft size={16} /> Voltar ao Painel
          </button>

          <select
            value={selectedQuinzenaId}
            onChange={(e) => setSelectedQuinzenaId(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '8px 14px',
              borderRadius: '8px',
              color: '#f3f4f6',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              outline: 'none',
              fontFamily: 'inherit'
            }}
          >
            {getQuinzenas().map(q => (
              <option key={q.id} value={q.id} style={{ background: '#090d16', color: '#f3f4f6' }}>
                {q.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={handlePrint}
            title="Imprimir ou Exportar para PDF (Apresentação 16:9)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '8px 14px',
              borderRadius: '8px',
              color: '#f3f4f6',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            <Printer size={15} /> PDF / Imprimir
          </button>
          
          <button 
            onClick={handleExport}
            title="Download das análises salvas como comments.json"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--primary)',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            <Download size={15} /> Exportar JSON
          </button>
        </div>
      </div>

      {/* Conteúdo Principal do Slide Ativo */}
      <div style={{
        width: '100%',
        height: '100%',
        maxWidth: '1200px',
        maxHeight: '675px', // Força proporção 16:9 de 1200px largura
        padding: '0 4rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        <AnimatePresence mode="wait">
          {currentSlide === 0 && (
            <motion.div 
              key="slide-0"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.4 }}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '1rem'
              }}
            >
              <span style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                padding: '5px 14px',
                borderRadius: '30px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                {data.badge}
              </span>
              <h1 style={{
                fontSize: '3.75rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                margin: '1rem 0 0.5rem',
                background: 'linear-gradient(to right, #ffffff, #60a5fa, #c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {data.title}
              </h1>
              <p style={{
                fontSize: '1.35rem',
                color: '#9ca3af',
                fontWeight: 300,
                maxWidth: '800px',
                lineHeight: 1.5,
                margin: 0
              }}>
                {data.subtitle}
              </p>
              
              <div style={{
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.3)',
                marginTop: '3rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <span>Apresentação Executiva Bimestral • {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                <span className="no-print" style={{ color: 'var(--primary)', fontWeight: 500 }}>Dica: use as setas ◄ / ► do teclado para navegar</span>
              </div>
            </motion.div>
          )}

          {currentSlide === 1 && (
            <motion.div 
              key="slide-1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              style={{ width: '100%' }}
            >
              <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Resumo Geral
              </span>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0.2rem 0 2rem', letterSpacing: '-0.02em' }}>
                Métricas Consolidadas do Período
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '1.5rem',
                    borderRadius: '16px'
                  }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>{data.kpis.throughput}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f3f4f6', marginTop: '0.25rem' }}>Throughput (Entregas)</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>Itens concluídos com sucesso</div>
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '1.5rem',
                    borderRadius: '16px'
                  }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b' }}>
                      {data.kpis.leadTime !== null ? `${data.kpis.leadTime}d` : '-'}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f3f4f6', marginTop: '0.25rem' }}>Lead Time Médio</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>Dias do backlog até a entrega</div>
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '1.5rem',
                    borderRadius: '16px'
                  }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#3b82f6' }}>{data.kpis.wip}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f3f4f6', marginTop: '0.25rem' }}>WIP (Trabalho Ativo)</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>Itens em andamento simultâneo</div>
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '1.5rem',
                    borderRadius: '16px'
                  }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#8b5cf6' }}>{data.kpis.aFazer}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f3f4f6', marginTop: '0.25rem' }}>A Fazer (Backlog)</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>Aguardando no cone de escopo</div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  padding: '2rem',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#60a5fa' }}>Foco das Próximas Quinzenas</h3>
                  <p style={{ color: '#d1d5db', lineHeight: 1.6, fontSize: '0.9rem', margin: 0 }}>
                    Este sumário quantifica o avanço do time no funil de entregas. Nas próximas telas, analisaremos os desvios de vazão, prazos e saldo de fluxo detalhados, acompanhados das análises qualitativas registradas pela facilitação ágil (Scrum Masters).
                  </p>
                  <ul style={{ fontSize: '0.85rem', color: '#9ca3af', paddingLeft: '1.25rem', margin: 0, lineHeight: 1.7 }}>
                    <li>Revisar gargalos e desvios de processo</li>
                    <li>Estruturar ações mitigadoras reais para os impedimentos</li>
                    <li>Garantir previsibilidade de entrega em ambiente de produção</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {currentSlide === 2 && (
            <motion.div 
              key="slide-2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Entregas por Semana
              </span>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0.2rem 0 1.5rem', letterSpacing: '-0.02em' }}>
                Throughput Semanal Detalhado
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', flex: 1, minHeight: 0 }}>
                {/* Gráfico */}
                <div style={{ width: '100%', height: '340px' }}>
                  <ResponsiveContainer>
                    <ComposedChart data={data.throughputData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
                      <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis yAxisId="left" stroke="#9ca3af" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}d`} />
                      <Tooltip content={<SlideTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                      <Bar yAxisId="left" dataKey="stories" name="Histórias" fill="#3B82F6" stackId="t" barSize={14} />
                      <Bar yAxisId="left" dataKey="bugs" name="Bugs" fill="#EF4444" stackId="t" barSize={14} />
                      <Bar yAxisId="left" dataKey="tasks" name="Tarefas" fill="#10B981" stackId="t" barSize={14} />
                      <Bar yAxisId="left" dataKey="spikes" name="Spikes" fill="#8B5CF6" stackId="t" barSize={14} />
                      <Bar yAxisId="left" dataKey="others" name="Outros" fill="#94A3B8" stackId="t" barSize={14} radius={[3, 3, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="leadTime" name="Lead Time Méd" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2.5, fill: '#f59e0b', strokeWidth: 0 }} connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Comentários */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    padding: '1.25rem',
                    borderRadius: '12px'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      🔴 Diagnóstico (Gargalos Identificados)
                    </span>
                    <p style={{ fontSize: '0.85rem', color: '#e5e7eb', margin: 0, lineHeight: 1.5 }}>
                      {getMetricComment('vazao').gap || 'Nenhum diagnóstico registrado pelo Scrum Master para esta métrica no painel.'}
                    </p>
                  </div>

                  <div style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    padding: '1.25rem',
                    borderRadius: '12px'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      🟢 Plano de Ação (Resolução Proposta)
                    </span>
                    <p style={{ fontSize: '0.85rem', color: '#e5e7eb', margin: 0, lineHeight: 1.5 }}>
                      {getMetricComment('vazao').action || 'Nenhum plano de ação registrado pelo Scrum Master para esta métrica no painel.'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentSlide === 3 && (
            <motion.div 
              key="slide-3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tempo de Entrega
              </span>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0.2rem 0 1.5rem', letterSpacing: '-0.02em' }}>
                Histórico de Lead Time
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', flex: 1, minHeight: 0 }}>
                {/* Gráfico */}
                <div style={{ width: '100%', height: '340px' }}>
                  <ResponsiveContainer>
                    <ComposedChart data={data.throughputData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
                      <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}d`} />
                      <Tooltip content={<SlideTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="leadTime" name="Lead Time Médio (Dias)" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 5 }} connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Comentários */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    padding: '1.25rem',
                    borderRadius: '12px'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      🔴 Diagnóstico (Gargalos Identificados)
                    </span>
                    <p style={{ fontSize: '0.85rem', color: '#e5e7eb', margin: 0, lineHeight: 1.5 }}>
                      {getMetricComment('leadTime').gap || 'Nenhum diagnóstico registrado pelo Scrum Master para esta métrica no painel.'}
                    </p>
                  </div>

                  <div style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    padding: '1.25rem',
                    borderRadius: '12px'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      🟢 Plano de Ação (Resolução Proposta)
                    </span>
                    <p style={{ fontSize: '0.85rem', color: '#e5e7eb', margin: 0, lineHeight: 1.5 }}>
                      {getMetricComment('leadTime').action || 'Nenhum plano de ação registrado pelo Scrum Master para esta métrica no painel.'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentSlide === 4 && (
            <motion.div 
              key="slide-4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Balanço do Fluxo
              </span>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0.2rem 0 1.5rem', letterSpacing: '-0.02em' }}>
                Entradas vs Saídas por Semana (Delta)
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', flex: 1, minHeight: 0 }}>
                {/* Gráfico */}
                <div style={{ width: '100%', height: '340px' }}>
                  <ResponsiveContainer>
                    <BarChart data={data.flowBalanceData.slice(-6)} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
                      <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<SlideTooltip />} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                      <Bar dataKey="entradas" fill="rgba(255, 255, 255, 0.3)" name="Demandas Criadas" barSize={12} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="saidas" fill="#10B981" name="Entregas Feitas" barSize={12} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Comentários */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    padding: '1.25rem',
                    borderRadius: '12px'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      🔴 Diagnóstico (Gargalos Identificados)
                    </span>
                    <p style={{ fontSize: '0.85rem', color: '#e5e7eb', margin: 0, lineHeight: 1.5 }}>
                      {getMetricComment('flowBalance').gap || 'Nenhum diagnóstico registrado pelo Scrum Master para esta métrica no painel.'}
                    </p>
                  </div>

                  <div style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    padding: '1.25rem',
                    borderRadius: '12px'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      🟢 Plano de Ação (Resolução Proposta)
                    </span>
                    <p style={{ fontSize: '0.85rem', color: '#e5e7eb', margin: 0, lineHeight: 1.5 }}>
                      {getMetricComment('flowBalance').action || 'Nenhum plano de ação registrado pelo Scrum Master para esta métrica no painel.'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Barra de Navegação Inferior */}
      <div className="no-print" style={{
        position: 'absolute',
        bottom: '2.5rem',
        left: '4rem',
        right: '4rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50
      }}>
        {/* Lado Esquerdo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          color: '#6b7280',
          fontSize: '0.8rem',
          fontWeight: 600
        }}>
          <span style={{ color: '#e5e7eb', fontFamily: "'Outfit', sans-serif", fontSize: '0.9rem', letterSpacing: '0.05em' }}>
            LOCAVIA
          </span>
          <span style={{ opacity: 0.2 }}>|</span>
          <span>Slide {currentSlide + 1} de {slidesCount}</span>
        </div>

        {/* Indicadores de Slide (Dots) */}
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          {Array.from({ length: slidesCount }).map((_, index) => (
            <div 
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                width: index === currentSlide ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: index === currentSlide ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          ))}
        </div>

        {/* Seta Direita / Esquerda */}
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button 
            onClick={prevSlide}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <button 
            onClick={nextSlide}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* CSS para Impressão */}
      <style>{`
        @media print {
          html, body {
            background-color: white !important;
            color: black !important;
            height: auto !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .presentation-page {
            background: none !important;
            background-color: white !important;
            color: black !important;
            height: auto !important;
            overflow: visible !important;
          }
          .presentation-page > div {
            max-height: none !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Mostrar todos os slides em páginas sequenciais ao imprimir */
          .presentation-page > div > div {
            opacity: 1 !important;
            transform: none !important;
            display: flex !important;
            position: relative !important;
            page-break-after: always !important;
            height: 100vh !important;
            padding: 4rem !important;
            box-sizing: border-box !important;
            justify-content: center !important;
            align-items: center !important;
          }
          /* Ajustes de cor para texto e bordas escuras ao imprimir */
          h1, h2, h3, p, span, div, li, td, th {
            color: #000000 !important;
          }
          div[style*="background:"] {
            background: none !important;
            background-color: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>
    </div>
  );
};

// Componente Wrappers para respeitar Hook order
const SMPresentationDeckWrapper: React.FC<{
  smId: string;
  selectedQuinzenaId: string;
  setSelectedQuinzenaId: (val: string) => void;
}> = ({ smId, selectedQuinzenaId, setSelectedQuinzenaId }) => {
  const config = SM_CONFIGS.find(c => c.id === smId);
  if (!config) {
    return <div className="flex h-screen items-center justify-center bg-[#090d16] text-[#f3f4f6]">SM não encontrado</div>;
  }
  return (
    <SMPresentationDeck 
      config={config} 
      selectedQuinzenaId={selectedQuinzenaId}
      setSelectedQuinzenaId={setSelectedQuinzenaId}
    />
  );
};

const SMPresentationDeck: React.FC<{
  config: SMConfig;
  selectedQuinzenaId: string;
  setSelectedQuinzenaId: (val: string) => void;
}> = ({ config, selectedQuinzenaId, setSelectedQuinzenaId }) => {
  const activeQuinzena = getQuinzenaById(selectedQuinzenaId);
  const customStart = activeQuinzena?.startDate;
  const customEnd = activeQuinzena?.endDate;

  const { data, loading } = useSMDashboardData(config, 'ALL', 60, 'ALL', customStart, customEnd);

  const normalizedData = useMemo<PresentationData | null>(() => {
    if (!data) return null;

    // Filter weeklyFlowData to match selected quinzena range if available
    const start = customStart ? new Date(customStart) : null;
    const end = customEnd ? new Date(customEnd) : null;

    let filteredWeekly = data.weeklyFlowData;
    if (start && end) {
      filteredWeekly = data.weeklyFlowData.filter(d => d.weekStart >= start && d.weekStart <= end);
    }

    if (filteredWeekly.length === 0) {
      filteredWeekly = data.weeklyFlowData.slice(-4);
    }

    return {
      title: `Evolução de Vazão & Métricas — ${config.name}`,
      subtitle: `Visão consolidada das squads sob liderança de ${config.name}`,
      badge: `Agilista: ${config.name.toUpperCase()}`,
      kpis: {
        throughput: data.kpis.throughput,
        leadTime: data.kpis.leadTimeAvg,
        wip: data.kpis.wip,
        aFazer: data.kpis.aFazer,
      },
      throughputData: filteredWeekly.map(d => ({
        name: d.weekLabel,
        throughput: d.throughput,
        stories: d.byType['História'] || 0,
        bugs: d.byType['Bug'] || 0,
        tasks: d.byType['Tarefa'] || 0,
        spikes: d.byType['Spike'] || 0,
        others: d.byType['Outros'] || 0,
        leadTime: d.leadTimeAvg,
      })),
      flowBalanceData: filteredWeekly.map(d => ({
        name: d.weekLabel,
        entradas: d.entradas,
        saidas: d.saidas,
        saldo: d.saldo,
      })),
      commentsSquadId: config.id,
      commentsReleaseId: 'ALL',
    };
  }, [data, config, customStart, customEnd]);

  if (loading || !normalizedData) {
    return <div className="flex h-screen items-center justify-center bg-[#090d16] text-[#f3f4f6]">Carregando dados da apresentação...</div>;
  }

  return (
    <DeckLayout 
      data={normalizedData} 
      selectedQuinzenaId={selectedQuinzenaId}
      setSelectedQuinzenaId={setSelectedQuinzenaId}
    />
  );
};

const ConePresentationDeck: React.FC<{
  type: 'bf-cem' | 'locavia';
  selectedQuinzenaId: string;
  setSelectedQuinzenaId: (val: string) => void;
}> = ({ type, selectedQuinzenaId, setSelectedQuinzenaId }) => {
  const { loading, weeklyPerformance, metrics, setStartDate, setEndDate } = useDashboardData(type);

  // Apply dates when quinzena selection changes
  useEffect(() => {
    const q = getQuinzenaById(selectedQuinzenaId);
    if (q) {
      setStartDate(q.startDate);
      setEndDate(q.endDate);
    }
  }, [selectedQuinzenaId, setStartDate, setEndDate]);

  const normalizedData = useMemo<PresentationData | null>(() => {
    if (loading) return null;

    // Filter weeklyPerformance to match selected quinzena range if available
    const q = getQuinzenaById(selectedQuinzenaId);
    const start = q ? new Date(q.startDate) : null;
    const end = q ? new Date(q.endDate) : null;

    let filteredPerf = weeklyPerformance;
    if (start && end) {
      filteredPerf = weeklyPerformance.filter(d => d.date >= start && d.date <= end);
    }

    if (filteredPerf.length === 0) {
      filteredPerf = weeklyPerformance.slice(-4);
    }

    return {
      title: type === 'bf-cem' ? 'Métricas de Agilidade — BAF & CEM' : 'Métricas de Agilidade — Locavia Principal',
      subtitle: type === 'bf-cem' 
        ? 'Acompanhamento do Cone de Escopo de Evoluções e Canal Especial de Atendimento' 
        : 'Status Geral do Fluxo e Vazão da Locavia Principal',
      badge: type === 'bf-cem' ? 'CONE BF / CEM' : 'CONE LOCAVIA GERAL',
      kpis: {
        throughput: metrics.deliveredCount,
        leadTime: metrics.avgLeadTime,
        wip: metrics.wipCount,
        aFazer: metrics.totalItems - metrics.deliveredCount,
      },
      throughputData: filteredPerf.map(d => ({
        name: d.name.split(' - ')[0],
        throughput: d["Saídas"] || d["Vazão Total"] || 0,
        stories: d["História"] || 0,
        bugs: d["Bug"] || 0,
        tasks: d["Tarefa"] || 0,
        spikes: d["Spike"] || 0,
        others: 0,
        leadTime: d["Lead Time (Méd)"] || null,
      })),
      flowBalanceData: filteredPerf.map(d => ({
        name: d.name.split(' - ')[0],
        entradas: d["Entradas"] || 0,
        saidas: d["Saídas"] || 0,
        saldo: d["Saldo"] || 0,
      })),
      commentsSquadId: type,
      commentsReleaseId: 'ALL',
    };
  }, [loading, weeklyPerformance, metrics, type, selectedQuinzenaId]);

  if (loading || !normalizedData) {
    return <div className="flex h-screen items-center justify-center bg-[#090d16] text-[#f3f4f6]">Carregando dados da apresentação...</div>;
  }

  return (
    <DeckLayout 
      data={normalizedData} 
      selectedQuinzenaId={selectedQuinzenaId}
      setSelectedQuinzenaId={setSelectedQuinzenaId}
    />
  );
};

// Componente Exportado Principal (Switch de Rotas)
export const PresentationDeck: React.FC = () => {
  const { smId } = useParams();
  const [selectedQuinzenaId, setSelectedQuinzenaId] = useState<string>(() => getAutomaticActiveQuinzena());

  if (smId === 'bf-cem' || smId === 'locavia') {
    return (
      <ConePresentationDeck 
        type={smId as 'bf-cem' | 'locavia'} 
        selectedQuinzenaId={selectedQuinzenaId}
        setSelectedQuinzenaId={setSelectedQuinzenaId}
      />
    );
  }

  return (
    <SMPresentationDeckWrapper 
      smId={smId || 'bf-cem'} 
      selectedQuinzenaId={selectedQuinzenaId}
      setSelectedQuinzenaId={setSelectedQuinzenaId}
    />
  );
};

export default PresentationDeck;
