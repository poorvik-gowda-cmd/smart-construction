'use client';

import { useRouter } from 'next/navigation';
import { Hammer, ShieldCheck, User, HardHat, ArrowRight, Zap } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const getPortals = (t: (key: string) => string) => [
  {
    role: 'admin',
    label: t('Administrator'),
    description: t('Full system control, AI insights, all projects & financials.'),
    icon: ShieldCheck,
    gradient: 'from-blue-600 to-indigo-700',
    glow: 'shadow-blue-900/40',
    border: 'hover:border-blue-500/50',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    badgeText: t('Full Access'),
  },
  {
    role: 'engineer',
    label: t('Site Engineer'),
    description: t('Attendance management, site updates, labor & materials tracking.'),
    icon: HardHat,
    gradient: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-900/40',
    border: 'hover:border-amber-500/50',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    badgeText: t('Site Portal'),
  },
  {
    role: 'client',
    label: t('Project Client'),
    description: t('View project progress, geo-tagged updates, documents & reports.'),
    icon: User,
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-900/40',
    border: 'hover:border-emerald-500/50',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    badgeText: t('Read Only'),
  },
];

export default function PortalSelectorPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const portals = getPortals(t);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Language Switcher Positioned at Top Right */}
      <div className="absolute top-8 right-8 z-50">
        <LanguageSwitcher />
      </div>
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-amber-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/40">
              <Hammer className="w-9 h-9 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.4em]">{t('SiteMaster Platform')}</span>
          </div>
          <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight">
            {t('Choose Your Portal')}
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto font-medium">
            {t('Select your role to access your personalized dashboard and tools.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <button
                key={portal.role}
                onClick={() => router.push(`/auth/${portal.role}`)}
                className={`group relative bg-slate-900/60 backdrop-blur-xl border border-slate-800 ${portal.border} rounded-3xl p-8 text-left transition-all duration-300 hover:bg-slate-900/80 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer shadow-xl`}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${portal.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-xl ${portal.glow} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest border ${portal.badge} mb-4`}>
                  {portal.badgeText}
                </span>
                <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
                  {portal.label}
                </h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  {portal.description}
                </p>
                <div className="mt-6 flex items-center space-x-2 text-slate-600 group-hover:text-slate-300 transition-colors">
                  <span className="text-xs font-bold uppercase tracking-widest">{t('Enter Portal')}</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${portal.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
              </button>
            );
          })}
        </div>

        <p className="text-center text-[10px] font-bold text-slate-800 uppercase tracking-widest">
          {t('© 2026 SiteMaster Construction Technologies · AI-Powered · Version 1.0.4-PRO')}
        </p>
      </div>
    </div>
  );
}
