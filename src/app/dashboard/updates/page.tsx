'use client';

import { useState, useEffect } from 'react';
import GoogleMap from '@/components/GoogleMap';
import { SiteUpdate } from '@/types';
import { createClient } from '@/lib/supabase';
import { 
  Camera, 
  MapPin, 
  Clock, 
  Plus, 
  Search, 
  Filter,
  Image as ImageIcon,
  MessageSquare,
  Loader2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export default function SiteUpdatesPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'feed' | 'map'>('feed');
  const [updates, setUpdates] = useState<SiteUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [posting, setPosting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchUpdates() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

        let query = supabase.from('site_updates').select('*');
        let projectsQuery = supabase.from('projects').select('id, name');

        if (profile?.role === 'engineer') {
          const { data: assignments } = await supabase
            .from('engineer_client_assignments')
            .select('project_id')
            .eq('engineer_id', user.id);
          
          const projectIds = assignments?.map(a => a.project_id) || [];
          query = query.in('project_id', projectIds);
          projectsQuery = projectsQuery.in('id', projectIds);
        } else if (profile?.role === 'client') {
          const { data: assignment } = await supabase
            .from('engineer_client_assignments')
            .select('project_id')
            .eq('client_id', user.id)
            .maybeSingle();
          
          if (assignment) {
            query = query.eq('project_id', assignment.project_id);
            projectsQuery = projectsQuery.eq('id', assignment.project_id);
          } else {
            const { data: profileWithProject } = await supabase.from('profiles').select('project_id').eq('id', user.id).single();
            if (profileWithProject?.project_id) {
               query = query.eq('project_id', profileWithProject.project_id);
               projectsQuery = projectsQuery.eq('id', profileWithProject.project_id);
            } else {
               query = query.eq('project_id', '00000000-0000-0000-0000-000000000000');
            }
          }
        }

        const [updatesRes, projectsRes] = await Promise.all([
          query.order('created_at', { ascending: false }),
          projectsQuery
        ]);
        
        if (updatesRes.error) throw updatesRes.error;
        setUpdates(updatesRes.data || []);
        setProjects(projectsRes.data || []);
        
        if (projectsRes.data && projectsRes.data.length > 0) {
          setSelectedProjectId(projectsRes.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching site updates:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUpdates();
  }, [supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePostUpdate = async () => {
    if (!newNote.trim()) return;
    if (!selectedProjectId) { alert('Please select a project.'); return; }
    setPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user session");

      let finalImageUrl = `https://picsum.photos/seed/${Math.round(Math.random()*9999)}/600/400`;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('site-updates')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('site-updates')
          .getPublicUrl(filePath);
        
        finalImageUrl = publicUrl;
      }

      let lat = 28.61;
      let lng = 77.23;

      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (geoError) {
          console.warn('Geolocation failed, falling back to default:', geoError);
        }
      }
      
      const { data, error } = await supabase
        .from('site_updates')
        .insert({
          project_id: selectedProjectId,
          user_id: user.id,
          image_url: finalImageUrl,
          notes: newNote,
          latitude: lat,
          longitude: lng
        })
        .select()
        .single();

      if (error) throw error;
      
      setUpdates([data, ...updates]);
      setNewNote('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowForm(false);
    } catch (error: any) {
      console.error('Error posting update:', error);
      alert('Failed to post update: ' + error.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 text-white">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t('Live Site Progress')}</h1>
          <p className="text-slate-500 mt-1">{t('Real-time geo-tagged logs and visual progress reports from project sites.')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl shadow-xl">
             <button 
               onClick={() => setActiveTab('feed')}
               className={cn(
                 "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                 activeTab === 'feed' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-200"
               )}
             >
                {t('Feed View')}
             </button>
             <button 
               onClick={() => setActiveTab('map')}
               className={cn(
                 "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                 activeTab === 'map' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-200"
               )}
             >
                {t('Live Map')}
             </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center">
               <Plus className="w-5 h-5 mr-2 text-blue-500" />
               {t('New Site Progress Log')}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
               <X className="w-5 h-5" />
            </button>
          </div>
          {projects.length > 1 && (
            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Project')}</label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
             <div>
                <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="What's happening on site today? Describe the milestone..."
                  className="w-full h-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[120px]"
                />
             </div>
             <div className="space-y-4">
                <div className="aspect-video bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center overflow-hidden relative group">
                   {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button onClick={() => {setSelectedFile(null); setPreviewUrl(null);}} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                           <X className="w-4 h-4" />
                        </button>
                      </>
                   ) : (
                      <label className="cursor-pointer flex flex-col items-center group">
                         <div className="p-3 rounded-full bg-blue-600/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Camera className="w-6 h-6" />
                         </div>
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{t('Click to Upload Photo')}</span>
                         <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                   )}
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handlePostUpdate}
                    disabled={posting || !newNote.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl flex items-center transition-all shadow-xl shadow-blue-900/20"
                  >
                    {posting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
                    {posting ? t('Uploading...') : t('Post Site Log')}
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-400 text-sm animate-pulse">{t('Syncing site activity...')}</p>
          </div>
        ) : activeTab === 'feed' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 pb-12">
            {updates.map((update) => (
              <div key={update.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl group hover:border-blue-900/50 transition-all hover:translate-y-[-4px]">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={update.image_url} 
                    alt="Update" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 flex items-center space-x-2 text-[10px] font-bold text-slate-100 uppercase tracking-widest">
                     <MapPin className="w-3.5 h-3.5 text-blue-500" />
                     <span>{update.latitude.toFixed(3)}, {update.longitude.toFixed(3)}</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-blue-400 shadow-inner">
                           {typeof update.user_id === 'string' ? update.user_id[0].toUpperCase() : 'U'}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supervisor #{update.user_id?.slice(-4) || 'ANON'}</span>
                     </div>
                     <div className="flex items-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        {new Date(update.created_at).toLocaleDateString()}
                     </div>
                  </div>

                  <p className="text-slate-200 text-sm leading-relaxed font-medium italic border-l-2 border-blue-500/30 pl-4 py-1">
                    "{update.notes}"
                  </p>

                  <div className="pt-2 flex items-center justify-between gap-4">
                     <div className="flex items-center space-x-4 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button className="flex items-center text-slate-400 hover:text-blue-400 transition-colors">
                           <MessageSquare className="w-4 h-4 mr-1.5" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">{t('Comment')}</span>
                        </button>
                        <button className="flex items-center text-slate-400 hover:text-emerald-400 transition-colors">
                           <ImageIcon className="w-4 h-4 mr-1.5" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">{t('HD Image')}</span>
                        </button>
                     </div>
                     <button className="text-blue-500 hover:text-blue-400 text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all">{t('Verify Map Location')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[calc(100vh-280px)] w-full pb-12">
            <GoogleMap updates={updates} />
          </div>
        )}
      </div>
    </div>
  );
}

