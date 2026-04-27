'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase';
import { Project, UserRole } from '@/types';
import ProjectDetailHeader from '@/components/projects/ProjectDetailHeader';
import ProjectExpenseList from '@/components/projects/ProjectExpenseList';
import ProjectDocumentList from '@/components/projects/ProjectDocumentList';
import ProjectMaterialManager from '@/components/projects/ProjectMaterialManager';
import { ShieldAlert, Loader2, BarChart3, Receipt, FileText, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'documents' | 'materials'>('overview');
  const supabase = createClient();

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Authentication required');
        return;
      }

      // Check user role and assigned projects
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const role = profile?.role as UserRole;
      setUserRole(role);

      if (role !== 'admin') {
        const [clientAssRes, staffAssRes] = await Promise.all([
          supabase.from('engineer_client_assignments').select('project_id').eq('engineer_id', user.id),
          supabase.from('project_assignments').select('project_id').eq('user_id', user.id)
        ]);
        
        const assignedProjectIds = [
          ...(clientAssRes.data?.map(a => a.project_id) || []),
          ...(staffAssRes.data?.map(a => a.project_id) || [])
        ];
        
        const isAssigned = assignedProjectIds.includes(projectId);
        
        if (!isAssigned) {
          setError(`Restricted Access: You are not assigned to this site. (ID: ${projectId.substring(0, 8)})`);
          return;
        }
      }

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] italic">Synchronizing Site Data...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-slate-900/50 border border-rose-500/20 rounded-[3rem] mt-12">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">Access Denied</h2>
        <p className="text-slate-500 max-w-md mx-auto font-medium">{error || 'Project not found or security clearance insufficient.'}</p>
        <button 
          onClick={() => window.history.back()}
          className="mt-8 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Site Overview', icon: BarChart3 },
    { id: 'expenses', name: 'Financials', icon: Receipt },
    { id: 'documents', name: 'Vault', icon: FileText },
    { id: 'materials', name: 'Inventory', icon: Package },
  ];

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <ProjectDetailHeader 
        project={project} 
        isAdmin={userRole === 'admin'} 
        onUpdate={fetchProjectData}
      />

      {/* Dynamic Tabs */}
      <div className="flex items-center space-x-2 bg-slate-900/50 p-2 rounded-[2rem] border border-white/5 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center space-x-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                isActive 
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-900/40 scale-105" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-500")} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-10">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-10">
            <ProjectExpenseList projectId={projectId} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <ProjectMaterialManager projectId={projectId} />
               <ProjectDocumentList projectId={projectId} />
            </div>
          </div>
        )}

        {activeTab === 'expenses' && <ProjectExpenseList projectId={projectId} />}
        {activeTab === 'documents' && <ProjectDocumentList projectId={projectId} />}
        {activeTab === 'materials' && <ProjectMaterialManager projectId={projectId} />}
      </div>
    </div>
  );
}
