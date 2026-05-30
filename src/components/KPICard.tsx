import React from 'react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface KPICardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColorClass?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ 
  title, value, subtext, icon: Icon, iconColorClass = 'text-blue-500', trend, trendValue 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
        <div className={clsx("p-2 rounded-lg bg-slate-50", iconColorClass)}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
        {(subtext || trend) && (
          <div className="flex items-center text-sm">
            {trend && trendValue && (
              <span className={clsx(
                "font-medium mr-2 flex items-center",
                trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-500'
              )}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </span>
            )}
            {subtext && <span className="text-slate-500">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
