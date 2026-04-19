'use client';

import { useState, useEffect } from 'react';
import { Labor } from '@/types';
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  HardHat, 
  Hammer, 
  Construction,
  Briefcase,
  X
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';

// Realtime data fetched from labor table

export default function LaborPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [labor, setLabor] = useState<Labor[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', skill_tag: '', daily_rate: '' });

  useEffect(() => {
    async function fetchLabor() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

      let query = supabase.from('labor').select('*');

      if (profile?.role === 'engineer') {
        const { data: assignments } = await supabase
          .from('engineer_client_assignments')
          .select('project_id')
          .eq('engineer_id', user.id);
        
        const projectIds = assignments?.map(a => a.project_id) || [];
        query = query.in('project_id', projectIds);
      }

      const { data, error } = await query;
      if (data && !error) {
        setLabor(data);
      }
      setLoading(false);
    }
    fetchLabor();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data, error } = await supabase.from('labor').insert([{
      full_name: formData.full_name,
      skill_tag: formData.skill_tag,
      daily_rate: Number(formData.daily_rate)
    }]).select();

    if (data && !error) {
       setLabor([...labor, data[0]]);
       setShowModal(false);
       setFormData({ full_name: '', skill_tag: '', daily_rate: '' });
    } else {
       alert("Error adding personnel.");
    }
  };

  const filteredLabor = labor.filter(l => 
    l.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.skill_tag?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('Workforce Directory')}</h1>
          <p className="text-slate-500 mt-1">{t('Manage personnel, skill sets, and active project assignments.')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-blue-900/30 transition-all transform hover:scale-105 active:scale-95 text-sm uppercase tracking-widest">
          <Plus className="w-5 h-5 mr-2" />
          {t('Add Personnel')}
        </button>
      </div>

      {/* Workforce Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center space-x-4 flex-1">
          <div className="p-3 rounded-xl bg-blue-600/10 text-blue-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-100">{labor.length}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{t('Total Workforce')}</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center space-x-4 flex-1">
          <div className="p-3 rounded-xl bg-emerald-600/10 text-emerald-500">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-100">{Math.round((labor.filter(l => l.project_id).length / (labor.length || 1)) * 100)}%</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{t('Allocation Rate')}</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center space-x-4 flex-1">
          <div className="p-3 rounded-xl bg-amber-600/10 text-amber-500">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-100">{labor.filter(l => l.skill_tag?.toLowerCase().includes('safety')).length}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{t('Safety Certified')}</p>
          </div>
        </div>
      </div>

      {/* List / Selection UI */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder={t('Search personnel...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-end md:self-auto">
             <button className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-slate-900 rounded-lg">{t('Active')}</button>
             <button className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300">{t('Archive')}</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/50 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{t('Personnel Name')}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{t('Specialization')}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{t('Current Site')}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{t('Daily Rate')}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{t('Status')}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{t('Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLabor.map((person) => (
                <tr key={person.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                        {person.full_name[0]}
                      </div>
                      <span className="text-sm font-bold text-slate-100">{person.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center text-slate-400 text-xs font-medium">
                      <Hammer className="w-3.5 h-3.5 mr-2 text-blue-500/50" />
                      {person.skill_tag}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center text-slate-400 text-xs font-medium">
                      <Construction className="w-3.5 h-3.5 mr-2 text-amber-500/50" />
                      {t('Project')} #{person.project_id}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-200">
                    ₹{person.daily_rate} <span className="text-[10px] text-slate-500 font-medium">{t('/ day')}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase">{t('Active')}</span>
                  </td>
                  <td className="px-6 py-5">
                    <button className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">{t('Add Personnel')}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Full Name')}</label>
                <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g., Rahul Sharma" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Skill / Specialization')}</label>
                <input required type="text" value={formData.skill_tag} onChange={e => setFormData({...formData, skill_tag: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g., Electrician" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Daily Rate (₹)')}</label>
                <input required type="number" value={formData.daily_rate} onChange={e => setFormData({...formData, daily_rate: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="1200" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-blue-900/20 uppercase tracking-widest text-xs transition-all mt-4">
                {t('Add Personnel')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
