'use client';

import { Project } from '@/types';
import { Calendar, MapPin, MoreVertical, TrendingUp } from 'lucide-react';
import { cn, formatINR } from '@/lib/utils';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useLanguage();
  const statusColors = {
    planned: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    ongoing: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    on_hold: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    completed: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    delayed: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <Link href={`/dashboard/projects/${project.id}`}>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors tracking-tight cursor-pointer">
                {project.name}
              </h3>
            </Link>
            <div className="flex items-center text-xs text-slate-500 space-x-2">
              <MapPin className="w-3 h-3" />
              <span>Project ID: {project.id.slice(0, 8)}</span>
            </div>
          </div>
          <button className="text-slate-500 hover:text-slate-100 p-1">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
            <span>{t('Overall Progress')}</span>
            <span className="text-slate-300">{project.progress_percent}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]",
                project.status === 'delayed' ? "bg-rose-500" : "bg-blue-500"
              )}
              style={{ width: `${project.progress_percent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-3">
            <div className="flex items-center text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest mr-1">₹</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{t('Budget')}</span>
            </div>
            <p className="text-sm font-bold text-slate-200">
              {formatINR(project.budget, true)}
            </p>
          </div>
          <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-3">
            <div className="flex items-center text-slate-500 mb-1">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t('End Date')}</span>
            </div>
            <p className="text-sm font-bold text-slate-200">
              {project.end_date ? new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'TBD'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
            statusColors[project.status as keyof typeof statusColors]
          )}>
            {t(project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' '))}
          </span>
          
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="User" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
              +5
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-950/40 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
         <div className="flex items-center text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
           <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
           {t('On Track')}
         </div>
         <Link href={`/dashboard/projects/${project.id}`}>
           <button className="text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-widest transition-colors">
             {t('Manage')}
           </button>
         </Link>
      </div>
    </div>
  );
}
