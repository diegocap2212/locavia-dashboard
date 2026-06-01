import React from 'react';
import type { WeeklyConeMetrics } from '../hooks/useSMDashboardData';

interface Props {
  data: WeeklyConeMetrics[];
}

export const ConeWeeklyTable: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
          <tr>
            <th className="py-3 px-4 font-semibold">Semana</th>
            <th className="py-3 px-3 text-center" title="Escopo Acumulado">Features<br/>Totais</th>
            <th className="py-3 px-3 text-center" title="Carregado da semana anterior">Transbordo</th>
            <th className="py-3 px-3 text-center text-blue-600" title="Com Data de Compromisso">Planejados</th>
            <th className="py-3 px-3 text-center text-amber-600" title="Sem Data de Compromisso">Não<br/>Planejados</th>
            <th className="py-3 px-3 text-center text-rose-600" title="Bugs e Urgências">Fura-fila<br/>/ Bugs</th>
            <th className="py-3 px-3 text-center text-emerald-600" title="Entregas DONE">Realizado</th>
            <th className="py-3 px-3 text-center text-slate-400">Desc.</th>
            <th className="py-3 px-3 text-center">A Fazer</th>
            <th className="py-3 px-3 text-center" title="Lead Time Médio">LT Méd</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-50 transition-colors">
              <td className="py-2 px-4 font-medium text-slate-800">{row.weekLabel}</td>
              <td className="py-2 px-3 text-center text-slate-500">{row.featuresTotal}</td>
              <td className="py-2 px-3 text-center text-slate-500">{row.transbordo}</td>
              <td className="py-2 px-3 text-center font-medium text-blue-700">{row.planejados > 0 ? row.planejados : '-'}</td>
              <td className="py-2 px-3 text-center font-medium text-amber-700">{row.naoPlanejados > 0 ? row.naoPlanejados : '-'}</td>
              <td className="py-2 px-3 text-center font-medium text-rose-700">{row.furaFila > 0 ? row.furaFila : '-'}</td>
              <td className="py-2 px-3 text-center font-bold text-emerald-700">{row.realizado > 0 ? row.realizado : '-'}</td>
              <td className="py-2 px-3 text-center text-slate-400">{row.descartados > 0 ? row.descartados : '-'}</td>
              <td className="py-2 px-3 text-center font-semibold text-slate-700">{row.aFazer}</td>
              <td className="py-2 px-3 text-center text-slate-600">{row.leadTimeMed !== null ? `${row.leadTimeMed}d` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
