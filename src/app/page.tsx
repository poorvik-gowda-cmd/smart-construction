'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Hammer, ShieldCheck, User, HardHat, ArrowRight, Zap, 
  ChevronRight, Building2, Trophy, Users, Monitor, 
  Construction, Ruler, Truck, Globe, MapPin, 
  MessageSquare, Share2, Mail, Phone
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';

// --- Sub-components ---

const StatsCard = ({ icon: Icon, value, label }: { icon: any, value: string, label: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:bg-slate-800/60 transition-all duration-500 hover:border-blue-500/20 shadow-2xl"
  >
    <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
      <Icon className="w-8 h-8 text-blue-500" />
    </div>
    <h3 className="text-4xl font-black text-white mb-2">{value}</h3>
    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
  </motion.div>
);

const ProjectCard = ({ title, category, image, t }: { title: string, category: string, image: string, t: any }) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="group relative h-[500px] rounded-[3rem] overflow-hidden cursor-pointer shadow-2xl"
  >
    <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-80" />
    <div className="absolute bottom-10 left-10 right-10">
      <span className="inline-block px-4 py-1.5 bg-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-4 shadow-xl">
        {t(category)}
      </span>
      <h3 className="text-3xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{t(title)}</h3>
      <div className="flex items-center text-slate-300 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2 duration-500">
        <span className="text-sm font-bold uppercase tracking-widest">{t('Explore Projects')}</span>
        <ChevronRight className="w-5 h-5 ml-1" />
      </div>
    </div>
  </motion.div>
);

const PortalCard = ({ role, label, description, icon: Icon, gradient, router, t }: any) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -5 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => router.push(`/auth/${role}`)}
    className="group relative bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-blue-500/50 rounded-[2.5rem] p-10 text-left transition-all duration-300 shadow-2xl"
  >
    <div className={cn("inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-8 shadow-2xl transition-transform duration-500 group-hover:scale-110 bg-gradient-to-br", gradient)}>
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h2 className="text-2xl font-black text-white tracking-tight mb-4 uppercase">{t(label)}</h2>
    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 group-hover:text-slate-300 transition-colors">
      {t(description)}
    </p>
    <div className="flex items-center space-x-3 text-blue-500 group-hover:text-blue-400 font-black uppercase tracking-[0.2em] text-[10px]">
      <span>{t('Enter Portal')}</span>
      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
    </div>
    <div className={cn("absolute inset-0 rounded-[2.5rem] opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none bg-gradient-to-br", gradient)} />
  </motion.button>
);

// --- Main Page Component ---

export default function LandingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 200]);

  return (
    <div className="bg-black text-white selection:bg-blue-500/30 overflow-x-hidden" ref={containerRef}>
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-6 transition-all duration-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-slate-900/40 backdrop-blur-2xl border border-white/5 px-8 py-4 rounded-[2rem] shadow-2xl">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-500/40 group-hover:rotate-12 transition-transform duration-500">
              <Hammer className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter text-white group-hover:text-blue-400 transition-colors">
              Site<span className="text-blue-500">Master</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-10">
            {['Home', 'Projects', 'Services', 'Awards'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-colors">
                {t(item)}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-6">
            <LanguageSwitcher />
            <button className="hidden sm:block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-blue-900/20 active:scale-95">
              {t('Contact Us')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <img src="/images/hero.png" alt="Hero" className="w-full h-full object-cover scale-110 brightness-50" />
        </motion.div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="h-[1px] w-12 bg-blue-500/50" />
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em]">{t('SiteMaster Construction Group')}</span>
              <div className="h-[1px] w-12 bg-blue-500/50" />
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter leading-[0.9] uppercase italic">
              {t('Building The')}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-indigo-700">{t('Future')}</span>
            </h1>
            
            <p className="text-slate-400 text-lg md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed tracking-tight">
              {t('Building the Future with Intelligence')}. {t('Experience Precision & Innovation')}.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
              <button 
                onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
                className="group px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-500 hover:text-white transition-all duration-500 shadow-2xl flex items-center"
              >
                {t('Explore Projects')}
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
              <button 
                onClick={() => document.getElementById('portals')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-5 bg-slate-900/50 backdrop-blur-xl border border-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/10 transition-all duration-500"
              >
                {t('Portal Access')}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Floating Badges */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-10 hidden xl:flex flex-col space-y-4"
        >
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl flex items-center space-x-4 shadow-2xl">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('Safety Rating')}</p>
              <p className="text-sm font-black text-white">{t('99.9% Zero Incidents')}</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section id="awards" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <StatsCard icon={Building2} value="500+" label={t('Projects Completed')} />
          <StatsCard icon={Trophy} value="15+" label={t('Years of Excellence')} />
          <StatsCard icon={Users} value="20+" label={t('Awards Won')} />
        </div>
      </section>

      {/* Projects Showcase */}
      <section id="projects" className="py-32 px-6 bg-gradient-to-b from-black to-slate-950">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex items-center space-x-2 bg-blue-600/10 px-4 py-2 rounded-full border border-blue-500/20">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{t('Our Global Footprint')}</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white italic uppercase">{t('Reputed Projects')}</h2>
            </div>
            <p className="text-slate-500 max-w-sm text-sm font-bold uppercase tracking-widest leading-loose">
              {t('Setting new benchmarks in architectural intelligence and structural sustainability across the globe.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProjectCard title="Skyline Plaza" category="Commercial Landmark" image="/images/project-commercial.png" t={t} />
            <ProjectCard title="Emerald Residency" category="Luxury Living" image="/images/project-residential.png" t={t} />
            <ProjectCard title="Titan Logistics Hub" category="Industrial Innovation" image="/images/project-industrial.png" t={t} />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="space-y-6">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">{t('Our Excellence')}</span>
              <h2 className="text-5xl md:text-7xl font-black text-white uppercase italic">{t('Revolutionizing')}<br/> {t('Infrastructure')}</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { icon: Monitor, title: 'AI Monitoring', desc: 'Real-time site oversight with neural activity tracking.' },
                { icon: Ruler, title: 'Structural Engineering', desc: 'Precision mapping and structural validation.' },
                { icon: Truck, title: 'Material Logistics', desc: 'Autonomous supply chain management systems.' },
                { icon: MapPin, title: 'Geo-Tagging', desc: 'GPS precise update reporting and site tagging.' }
              ].map((service, idx) => (
                <div key={idx} className="space-y-4 p-6 bg-slate-900/40 rounded-3xl border border-white/5 group hover:border-blue-500/20 transition-colors">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">{t(service.title)}</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{t(service.desc)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 bg-blue-600/20 blur-[100px] rounded-full" />
            <div className="relative aspect-square rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl">
              <img src="/images/hero.png" alt="Engineering" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay" />
            </div>
          </div>
        </div>
      </section>

      {/* Portal Access Section */}
      <section id="portals" className="py-40 px-6 bg-slate-950/50">
        <div className="max-w-5xl mx-auto space-y-20 text-center">
          <div className="space-y-6">
            <h2 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter">
              {t('Management Suite')}
            </h2>
            <p className="text-slate-500 text-lg font-bold uppercase tracking-widest">
              {t('Access your dashboard')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PortalCard 
              role="admin" label="Administrator" icon={ShieldCheck} 
              description="Full system control, AI insights, all projects & financials." 
              gradient="from-blue-600 to-indigo-700" router={router} t={t}
            />
            <PortalCard 
              role="engineer" label="Site Engineer" icon={HardHat} 
              description="Attendance management, site updates, labor & materials tracking." 
              gradient="from-amber-600 to-orange-700" router={router} t={t}
            />
            <PortalCard 
              role="client" label="Project Client" icon={User} 
              description="View project progress, geo-tagged updates, documents & reports." 
              gradient="from-emerald-600 to-teal-700" router={router} t={t}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
          <div className="col-span-1 md:col-span-2 space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-2xl">
                <Hammer className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black uppercase tracking-tighter text-white">
                Site<span className="text-blue-500">Master</span>
              </span>
            </div>
            <p className="text-slate-500 max-w-md text-sm leading-relaxed font-medium">
              {t('We define the standard of excellence in the construction industry through cutting-edge AI integration and unyielding structural integrity.')}
            </p>
            <div className="flex items-center space-x-6">
              {[Globe, MessageSquare, Share2].map((Icon, idx) => (
                <Icon key={idx} className="w-5 h-5 text-slate-700 hover:text-blue-500 cursor-pointer transition-colors" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h5 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">{t('Contact')}</h5>
            <div className="space-y-4 text-slate-500 font-medium">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-blue-500" />
                <span>hq@sitemaster.pro</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-blue-500" />
                <span>+91 1800-MASTER-AI</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h5 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">{t('Governance')}</h5>
            <div className="space-y-4 text-slate-500 font-medium flex flex-col">
              <a href="#" className="hover:text-white transition-colors">{t('Safety Protocols')}</a>
              <a href="#" className="hover:text-white transition-colors">{t('Privacy Policy')}</a>
              <a href="#" className="hover:text-white transition-colors">{t('Legal Terms')}</a>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-20 mt-20 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
            {t('© 2026 SiteMaster Construction Technologies · AI-Powered · Version 1.0.4-PRO')}
          </p>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">{t('SiteMaster Core Engine Active')}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
