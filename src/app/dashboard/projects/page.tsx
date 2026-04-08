'use client';

import { useState, useEffect } from 'react';
import ProjectCard from '@/components/projects/ProjectCard';
import { Project } from '@/types';
import { Search, Plus, Filter, LayoutGrid, List, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';

// Realtime data fetched from standard projects table

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', budget: '', status: 'planned' });

  useEffect(() => {
    async function fetchProjects() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      
      let query = supabase.from('projects').select('*');

      if (profile?.role === 'engineer') {
        const { data: assignments } = await supabase
          .from('engineer_client_assignments')
          .select('project_id')
          .eq('engineer_id', user.id);
        
        const projectIds = assignments?.map(a => a.project_id) || [];
        query = query.in('id', projectIds);
      }

      const { data, error } = await query;
      if (data && !error) {
        setProjects(data);
      }
      setLoading(false);
    }
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data, error } = await supabase.from('projects').insert([{
      name: formData.name,
      description: formData.description,
      budget: Number(formData.budget),
      status: formData.status
    }]).select();

    if (data && !error) {
       setProjects([...projects, data[0]]);
       setShowModal(false);
       setFormData({ name: '', description: '', budget: '', status: 'planned' });
    } else {
       alert("Error creating project.");
    }
  };

  const filteredProjects: Project[] = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (activeFilter === 'all' || p.status === activeFilter)
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Projects Inventory</h1>
          <p className="text-slate-500 mt-1">Manage and track all active and upcoming constructions.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-blue-900/30 transition-all transform hover:scale-105 active:scale-95 text-sm uppercase tracking-widest">
          <Plus className="w-5 h-5 mr-2" />
          New Project
        </button>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by project name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          {['all', 'ongoing', 'planned', 'delayed', 'completed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                activeFilter === filter 
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20" 
                  : "bg-slate-950/30 text-slate-500 border-slate-800 hover:text-slate-300"
              )}
            >
              {filter}
            </button>
          ))}
          <div className="h-8 w-px bg-slate-800 mx-2" />
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button className="p-2 text-blue-500 bg-slate-900 rounded-lg shadow-inner"><LayoutGrid className="w-4 h-4" /></button>
            <button className="p-2 text-slate-600 hover:text-slate-400"><List className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-700">
            <Filter className="w-8 h-8" />
          </div>
          <p className="text-slate-500 font-medium">No projects found matching your criteria.</p>
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">New Project</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g., Metro Plaza" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="Project details..."></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-emerald-400">Budget (₹)</label>
                  <input required type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="1000000" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="planned">Planned</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-blue-900/20 uppercase tracking-widest text-xs transition-all mt-4">
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function duplicated for quick access in component
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
