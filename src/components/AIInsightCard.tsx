'use client';

import { AIRiskResult } from '@/types';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface AIInsightCardProps {
  data?: AIRiskResult;
  loading?: boolean;
}

export default function AIInsightCard({ data, loading }: AIInsightCardProps) {
  const { t } = useLanguage();
  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px] animate-pulse">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-slate-400 text-sm">{t('Analyzing project data with AI...')}</p>
      </div>
    );
  }

  if (!data) return null;

  const isHighRisk = data.classification === 'High Risk';
  const isModerateRisk = data.classification === 'Moderate';
  const isSafe = data.classification === 'Safe';

  return (
    <div className={cn(
      "bg-slate-900 border rounded-2xl p-6 shadow-xl transition-all duration-300",
      isHighRisk ? "border-rose-900/50 shadow-rose-900/10" : 
      isModerateRisk ? "border-amber-900/50 shadow-amber-900/10" : "border-emerald-900/50 shadow-emerald-900/10"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-lg",
            isHighRisk ? "bg-rose-500/10 text-rose-500" : 
            isModerateRisk ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
          )}>
            {isHighRisk ? <AlertCircle className="w-5 h-5" /> : 
             isModerateRisk ? <Info className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <h3 className="text-lg font-bold text-slate-100 italic tracking-wide">{t('AI Risk Engine')}</h3>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter",
          isHighRisk ? "bg-rose-500 text-white" : 
          isModerateRisk ? "bg-amber-500 text-slate-950" : "bg-emerald-500 text-slate-950"
        )}>
          {data.classification}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl font-extrabold text-slate-100">{data.score}</span>
          <span className="text-slate-500 text-sm font-medium">{t('/ 100 Risk Score')}</span>
        </div>

        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
          <p className="text-slate-300 leading-relaxed text-sm italic">
            "{data.insight}"
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000 ease-out",
                isHighRisk ? "bg-rose-500" : isModerateRisk ? "bg-amber-500" : "bg-emerald-500"
              )} 
              style={{ width: `${data.score}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest text-right">
            {t('Predictive Analysis Active')}
          </p>
        </div>
      </div>
    </div>
  );
}
