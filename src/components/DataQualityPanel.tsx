import React, { useMemo } from 'react';
import type { DashboardItem } from '../types/jira';
import { AlertCircle, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  items: DashboardItem[];
}

export const DataQualityPanel: React.FC<Props> = ({ items }) => {
  const stats = useMemo(() => {
    const total = items.length;
    if (total === 0) return null;

    let noAssignee = 0;
    let doneNoResolution = 0;
    let staleTodo = 0;
    let missingCommit = 0;

    items.forEach(item => {
      if (item.DataQuality?.missingAssignee) noAssignee++;
      if (item.DataQuality?.missingResolutionDate) doneNoResolution++;
      if (item.DataQuality?.staleTodo) staleTodo++;
      
      // Especifico da nova metodologia Cone
      if (item.StatusCategory !== 'DONE' && !item.CommitmentDate && item.Type.toLowerCase() !== 'bug') {
        missingCommit++;
      }
    });

    const issuesCount = noAssignee + doneNoResolution + staleTodo + missingCommit;
    const score = Math.max(0, 100 - (issuesCount / total) * 100);

    return {
      total,
      score: Math.round(score),
      issues: [
        { label: 'Sem Responsável', count: noAssignee, type: 'warning' },
        { label: 'Sem Data de Compromisso (Aberto)', count: missingCommit, type: 'warning' },
        { label: 'DONE sem Resolvido', count: doneNoResolution, type: 'error' },
        { label: 'TODO parado há >30d', count: staleTodo, type: 'error' },
      ].sort((a, b) => b.count - a.count)
    };
  }, [items]);

  if (!stats) return null;

  const scoreColor = stats.score >= 90 ? 'text-emerald-500' : stats.score >= 70 ? 'text-amber-500' : 'text-rose-500';
  const ScoreIcon = stats.score >= 90 ? ShieldCheck : stats.score >= 70 ? AlertTriangle : AlertCircle;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-8">
      <div className="flex flex-col items-center justify-center min-w-[150px]">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Quality Score</h3>
        <div className="relative flex items-center justify-center w-24 h-24 mb-2">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-100"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={scoreColor}
              strokeDasharray={`${stats.score}, 100`}
              strokeWidth="3"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={clsx("text-2xl font-bold", scoreColor)}>{stats.score}</span>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center">
          <ScoreIcon size={16} className={clsx("mr-2", scoreColor)} />
          Atenção Requerida ({stats.total} itens analisados)
        </h3>
        
        <div className="space-y-3">
          {stats.issues.filter(i => i.count > 0).length === 0 ? (
            <div className="flex items-center text-emerald-600 bg-emerald-50 p-3 rounded-lg text-sm">
              <CheckCircle2 size={16} className="mr-2" />
              Parabéns! Todos os dados estão higienizados.
            </div>
          ) : (
            stats.issues.filter(i => i.count > 0).slice(0, 4).map((issue, idx) => (
              <div key={idx} className="flex items-center">
                <div className="w-48 text-sm text-slate-600 font-medium truncate" title={issue.label}>
                  {issue.label}
                </div>
                <div className="flex-1 mx-4 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={clsx("h-full rounded-full", issue.type === 'error' ? 'bg-rose-500' : 'bg-amber-400')} 
                    style={{ width: `${Math.min(100, (issue.count / stats.total) * 100)}%` }}
                  />
                </div>
                <div className="w-12 text-right text-sm font-bold text-slate-700">
                  {issue.count}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
