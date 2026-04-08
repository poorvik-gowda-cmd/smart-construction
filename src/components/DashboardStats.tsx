import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stat {
  name: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  color?: string;
}

interface DashboardStatsProps {
  stats: Stat[];
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.name}
          className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <dt>
            <div className={cn("absolute rounded-xl p-3", item.color || "bg-blue-600/10")}>
              <item.icon className={cn("h-6 w-6", item.color ? "text-white" : "text-blue-500")} aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-slate-400">{item.name}</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-slate-100">{item.value}</p>
            {item.change && (
              <p
                className={cn(
                  "ml-2 flex items-baseline text-xs font-semibold",
                  item.changeType === 'increase' ? "text-emerald-400" : 
                  item.changeType === 'decrease' ? "text-rose-400" : "text-slate-400"
                )}
              >
                {item.change}
              </p>
            )}
          </dd>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/20 to-transparent h-1" />
        </div>
      ))}
    </div>
  );
}
