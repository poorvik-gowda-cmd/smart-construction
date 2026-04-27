'use client';

import { useState } from 'react';
import { Project } from '@/types';
import { 
  Calendar, 
  Trash2, 
  MapPin, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  X,
  Save,
  ChevronLeft,
  Plus
} from 'lucide-react';
import { cn, formatINR } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

interface ProjectDetailHeaderProps {
  project: Project;
  isAdmin: boolean;
  onUpdate: () => void;
}

export default function ProjectDetailHeader({ project, isAdmin, onUpdate }: ProjectDetailHeaderProps) {
  const { t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [newDeadline, setNewDeadline] = useState(project.end_date || '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const statusIcons = {
    planned: Clock,
    ongoing: Clock,
    on_hold: AlertCircle,
    completed: CheckCircle2,
    delayed: AlertCircle,
  };

  const statusColors = {
    planned: 'text-blue-500',
    ongoing: 'text-emerald-500',
    on_hold: 'text-amber-500',
    completed: 'text-indigo-500',
    delayed: 'text-rose-500',
  };

  const StatusIcon = statusIcons[project.status] || Clock;

  const handleDelete = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);
      
      if (error) throw error;
      router.push('/dashboard/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project.');
    } finally {
      setLoading(false);
      setIsDeleting(false);
    }
  };

  const handleUpdateDeadline = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ end_date: newDeadline })
        .eq('id', project.id);
      
      if (error) throw error;
      setIsEditingDeadline(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating deadline:', error);
      alert('Failed to update deadline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button 
        onClick={() => router.back()}
        className="flex items-center text-slate-500 hover:text-slate-300 transition-colors text-xs font-bold uppercase tracking-widest"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </button>

      <div className="relative overflow-hidden bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/5 blur-[100px] rounded-full" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center space-x-3">
                <div className={cn("p-2 rounded-xl bg-white/5 border border-white/10", statusColors[project.status])}>
                  <StatusIcon className="w-5 h-5" />
                </div>
                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", statusColors[project.status])}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              
              <h1 className="text-4xl font-black text-white tracking-tight leading-none uppercase italic">
                {project.name}
              </h1>
              
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                {project.description || 'No description provided for this site.'}
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center space-x-2 bg-slate-950/50 border border-white/5 px-4 py-2 rounded-2xl">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Global Project ID: {project.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 min-w-[300px]">
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Budget</span>
                  </div>
                  <span className="text-sm font-black text-emerald-400">{formatINR(project.budget, true)}</span>
                </div>

                <div className="h-px bg-white/5" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project Deadline</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isEditingDeadline ? (
                      <div className="flex items-center space-x-1">
                        <input 
                          type="date" 
                          value={newDeadline}
                          onChange={(e) => setNewDeadline(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={handleUpdateDeadline} disabled={loading} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors">
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setIsEditingDeadline(false)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-black text-white">
                          {project.end_date ? new Date(project.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NOT SET'}
                        </span>
                        <button 
                          onClick={() => setIsEditingDeadline(true)}
                          className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest"
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => router.push(`/dashboard/updates?projectId=${project.id}&add=true`)}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('Post Site Update')}</span>
                </button>

                {isAdmin && (
                  <button 
                    onClick={() => setIsDeleting(true)}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-2xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t('Terminate Record')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-slate-900 border border-rose-500/30 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20 mx-auto">
              <Trash2 className="w-10 h-10 text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-white text-center mb-2 uppercase italic tracking-tight">Irreversable Action</h3>
            <p className="text-slate-400 text-center mb-8 font-medium">Are you sure you want to delete <span className="text-white font-bold">{project.name}</span>? All related logs, expenses, and documents will remain in the system but the project link will be severed.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setIsDeleting(false)}
                className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Go Back
              </button>
              <button 
                onClick={handleDelete}
                disabled={loading}
                className="py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-rose-900/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Execute Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
