'use client';

import { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  Flame,
  Construction,
  Info,
  ChevronRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';

// Realtime data fetched from safety_issues table

export default function SafetyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ description: '', severity: 'medium' });

  useEffect(() => {
    async function fetchIssues() {
      const supabase = createClient();
      const { data, error } = await supabase.from('safety_issues').select('*');
      if (data && !error) {
        setIssues(data);
      }
      setLoading(false);
    }
    fetchIssues();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data, error } = await supabase.from('safety_issues').insert([{
      description: formData.description,
      severity: formData.severity,
      status: 'open'
    }]).select();

    if (data && !error) {
       setIssues([...issues, data[0]]);
       setShowModal(false);
       setFormData({ description: '', severity: 'medium' });
    } else {
       alert("Error reporting incident.");
    }
  };

  const severityStyles = {
    critical: "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-900/10",
    high: "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-900/10",
    medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    low: "bg-slate-800/10 text-slate-400 border-slate-800"
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Safety & Hazard Log</h1>
          <p className="text-slate-500 mt-1">Monitor site risks, report incidents, and track protocol compliance.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-rose-900/30 transition-all transform hover:scale-105 active:scale-95 text-sm uppercase tracking-widest">
          <ShieldAlert className="w-5 h-5 mr-2" />
          Report Incident
        </button>
      </div>

      {/* Safety Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
               <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
                  <Flame className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-bold text-rose-500 bg-rose-500/5 px-2 py-1 rounded uppercase tracking-[0.2em] shadow-inner">Urgent</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-100 italic tracking-tight">04</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Critical Hazards</p>
         </div>

         <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
               <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                  <Clock className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-bold text-blue-500 bg-blue-500/5 px-2 py-1 rounded uppercase tracking-[0.2em] shadow-inner">Tracking</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-100 italic tracking-tight">18</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Issues Resolved</p>
         </div>

         <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between">
            <div className="space-y-4">
               <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <p className="text-sm font-bold text-slate-100">Site Compliance: 94.2%</p>
               </div>
               <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all" style={{ width: '94.2%' }} />
               </div>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Safety Rating</p>
               <span className="text-xl font-extrabold text-white tracking-widest">A- GRADE</span>
            </div>
         </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
         <div className="flex items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-800 mb-6">
            <div className="relative max-w-sm w-full">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
               <input 
                 type="text" 
                 placeholder="Filter by project or issue..."
                 className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium"
               />
            </div>
            <div className="flex shrink-0 space-x-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
               {['All', 'Critical', 'Open', 'Resolved'].map((tab) => (
                  <button key={tab} className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-100 bg-slate-950 rounded-xl border border-slate-800 transition-all">{tab}</button>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-1 gap-4">
            {issues.filter(issue => 
               issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
               issue.project?.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((issue: any) => (
               <div key={issue.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between group hover:border-slate-700 hover:shadow-xl transition-all cursor-pointer">
                  <div className="flex items-center space-x-6 flex-1">
                     <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center p-3 animate-pulse-slow",
                        severityStyles[issue.severity as keyof typeof severityStyles]
                     )}>
                        <AlertTriangle className="w-full h-full" />
                     </div>
                     <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">SITE: {issue.project}</span>
                           <span className={cn(
                              "text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-tighter",
                              issue.status === 'open' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                              issue.status === 'in_progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                           )}>
                              {issue.status.replace('_', ' ')}
                           </span>
                        </div>
                        <h4 className="text-slate-100 font-bold group-hover:text-rose-400 transition-colors uppercase tracking-tight leading-tight">
                           {issue.description}
                        </h4>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center">
                           <Clock className="w-3 h-3 mr-1" /> Reported {new Date(issue.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 2 hours ago
                        </p>
                     </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center space-x-6">
                     <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Assigned to</p>
                        <div className="flex -space-x-2 self-end">
                           <div className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-extrabold text-blue-500 uppercase font-mono">HS</div>
                           <div className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-extrabold text-blue-500 uppercase font-mono">AD</div>
                        </div>
                     </div>
                     <div className="h-10 w-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center hover:bg-rose-500/10 transition-colors group/arrow">
                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover/arrow:text-rose-400 transform group-hover/arrow:translate-x-1 transition-transform" />
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Report Safety Incident</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Incident Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors" placeholder="Describe the hazard..."></textarea>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Severity Level</label>
                <select value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors">
                  <option value="low">Low - Minor issue</option>
                  <option value="medium">Medium - Needs attention</option>
                  <option value="high">High - Serious risk</option>
                  <option value="critical">Critical - Immediate danger</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-rose-900/20 uppercase tracking-widest text-xs transition-all mt-4">
                Submit Report
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
