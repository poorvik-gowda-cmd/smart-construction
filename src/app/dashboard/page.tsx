'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardStats from '@/components/DashboardStats';
import AIInsightCard from '@/components/AIInsightCard';
import { 
  Users, 
  BarChart3, 
  Package, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { createClient } from '@/lib/supabase';
import { cn, formatINR } from '@/lib/utils';
import { AIRiskResult } from '@/types';


export default function DashboardPage() {
  const [aiData, setAiData] = useState<AIRiskResult | undefined>(undefined);
  const [loadingAI, setLoadingAI] = useState(true);
  const [stats, setStats] = useState<{
    name: string;
    value: string | number;
    icon: any;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
    color?: string;
  }[]>([
    { name: 'Active Projects', value: 0, icon: BarChart3, change: '-', changeType: 'neutral' },
    { name: 'Total Labor', value: 0, icon: Users, change: '-', changeType: 'neutral' },
    { name: 'Material Stock', value: '0%', icon: Package, change: '-', changeType: 'neutral', color: 'bg-amber-500/10' },
    { name: 'Safety Incidents', value: 0, icon: AlertTriangle, change: '-', changeType: 'neutral', color: 'bg-emerald-500/10' },
  ]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [projectProgress, setProjectProgress] = useState<any[]>([]);
  const [allocation, setAllocation] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const supabase = createClient();

  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setRole(profile.role);
      }
    }
    loadSession();
  }, [supabase]);

  useEffect(() => {
    if (!role || !userId) return;

    async function fetchDashboardData() {
      setLoadingStats(true);
      try {
        // 1. Resolve Assigned Projects
        let projectIds: string[] = [];
        if (role === 'engineer') {
          const { data: assignments } = await supabase.from('project_assignments').select('project_id').eq('user_id', userId);
          projectIds = (assignments || []).map(a => a.project_id);
        } else if (role === 'client') {
          const { data: assignment } = await supabase.from('engineer_client_assignments').select('project_id').eq('client_id', userId).single();
          if (assignment) projectIds = [assignment.project_id];
        }
        setAssignedProjectIds(projectIds);

        // 2. Fetch Projects (filtered by role)
        let projectQuery = supabase.from('projects').select('budget, progress_percent, name, id', { count: 'exact' });
        if (role !== 'admin') projectQuery = projectQuery.in('id', projectIds);
        const { data: projectsData, count: projectCount } = await projectQuery;

        const totalBudget = projectsData?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
        const avgProgress = projectsData && projectsData.length > 0
          ? Math.round(projectsData.reduce((sum, p) => sum + (p.progress_percent || 0), 0) / projectsData.length)
          : 0;

        // 3. Fetch Labor Attendance
        const today = new Date().toISOString().split('T')[0];
        let attendanceQuery = supabase.from('attendance').select('status, project_id').eq('date', today);
        if (role !== 'admin') attendanceQuery = attendanceQuery.in('project_id', projectIds);
        const { data: attendance } = await attendanceQuery;
        
        const totalPresent = (attendance || []).filter(a => a.status === 'present' || a.status === 'overtime').length;
        const totalWorkers = attendance?.length || 0;
        const attendanceRate = totalWorkers > 0 ? Math.round((totalPresent / totalWorkers) * 100) : 0;

        // 4. Fetch expenses for budget utilization
        let expenseQuery = supabase.from('expenses').select('amount, category, project_id');
        if (role !== 'admin') expenseQuery = expenseQuery.in('project_id', projectIds);
        const { data: expenses } = await expenseQuery;
        
        const totalSpent = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        const budgetUtilized = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

        // 5. Fetch Material stock status
        let materialQuery = supabase.from('materials').select('stock_level, reorder_point, project_id, name');
        if (role !== 'admin') materialQuery = materialQuery.in('project_id', projectIds);
        const { data: materials } = await materialQuery;
        
        const lowStockItems = materials?.filter(m => m.stock_level <= m.reorder_point) || [];
        const lowStockCount = lowStockItems.length;
        const stockHealth = materials && materials.length > 0 
          ? Math.round(((materials.length - lowStockCount) / materials.length) * 100)
          : 100;

        // 6. Fetch Safety Incidents
        let safetyQuery = supabase.from('safety_issues').select('description, severity, project_id', { count: 'exact' }).eq('status', 'open');
        if (role !== 'admin') safetyQuery = safetyQuery.in('project_id', projectIds);
        const { data: safetyIssues, count: safetyCount } = await safetyQuery;

        // 7. Fetch Recent Updates WITH AUTHORSHIP
        let updatesQuery = supabase
          .from('site_updates')
          .select(`
            *,
            author:profiles!site_updates_user_id_fkey(full_name, role),
            project:projects(name)
          `)
          .order('created_at', { ascending: false });
        
        if (role !== 'admin') updatesQuery = updatesQuery.in('project_id', projectIds);
        const { data: updates } = await updatesQuery.limit(role === 'admin' ? 10 : 5);
        setRecentActivities(updates || []);

        // 8. Stats Configuration (Admin sees global Overview, others see Project stats)
        const currentStats: any[] = [];
        if (role !== 'client') {
          currentStats.push({ 
            name: 'Active Projects', 
            value: projectCount || 0, 
            icon: BarChart3, 
            change: role === 'admin' ? '+1 this week' : 'Assigned to you', 
            changeType: 'increase' 
          });
        }
        
        // Total Labor (Global for Admin, Project-specific for Others)
        currentStats.push({ 
          name: 'Total Labor', 
          value: totalPresent, 
          icon: Users, 
          change: `${attendanceRate}% attendance`, 
          changeType: attendanceRate > 80 ? 'increase' : 'neutral' 
        });

        // ONLY Engineers and Clients see Material/Safety in overview (Project-dependent)
        if (role !== 'admin') {
          currentStats.push({ 
            name: 'Material Stock', 
            value: `${stockHealth}%`, 
            icon: Package, 
            change: lowStockCount > 0 ? `${lowStockCount} items low` : 'Healthy', 
            changeType: lowStockCount > 0 ? 'decrease' : 'increase', 
            color: 'bg-amber-500/10' 
          });
          currentStats.push({ 
            name: 'Safety Incidents', 
            value: safetyCount || 0, 
            icon: AlertTriangle, 
            change: 'Active issues', 
            changeType: (safetyCount || 0) > 0 ? 'decrease' : 'increase', 
            color: 'bg-emerald-500/10' 
          });
        } else {
          // Admin sees Total Budget instead of project-specific stock/safety
          currentStats.push({ 
            name: 'Total Ops Budget', 
            value: formatINR(totalBudget, true), 
            icon: DollarSign, 
            change: `${budgetUtilized}% utilized`, 
            changeType: budgetUtilized < 90 ? 'increase' : 'decrease', 
            color: 'bg-emerald-500/10' 
          });
        }
        
        setStats(currentStats);

        // 9. Charts
        setProjectProgress([
          { name: 'Initial', progress: 0, target: 10 },
          { name: 'Target', progress: avgProgress, target: 100 },
        ]);

        const laborExp = expenses?.filter(e => e.category?.toLowerCase().includes('labor')).reduce((s, e) => s + e.amount, 0) || 0;
        const materialExp = expenses?.filter(e => e.category?.toLowerCase().includes('material')).reduce((s, e) => s + e.amount, 0) || 0;
        const otherExp = totalSpent - laborExp - materialExp;

        setAllocation([
          { name: 'Labor', value: totalSpent > 0 ? Math.round((laborExp/totalSpent)*100) : 40, color: '#3b82f6' },
          { name: 'Material', value: totalSpent > 0 ? Math.round((materialExp/totalSpent)*100) : 35, color: '#6366f1' },
          { name: 'Other', value: totalSpent > 0 ? Math.round((otherExp/totalSpent)*100) : 25, color: '#8b5cf6' },
        ]);

        // 10. AI Insight using real filters
        await fetchAiInsight(attendanceRate, totalPresent, stockHealth, budgetUtilized, avgProgress);

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    }

    async function fetchAiInsight(rate: number, presentCount: number, stock: number, budget: number, progress: number) {
      setLoadingAI(true);
      try {
        const res = await fetch('/api/ai/risk-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attendanceTrend: `${rate}% attendance today (${presentCount} workers on site)`,
            materialStatus: `Global stock health at ${stock}%.`,
            budgetStatus: `${budget}% of total budget utilized.`,
            progressPercent: progress,
            context: role === 'admin' ? 'Company-wide' : 'Project-specific'
          })
        });
        
        if (!res.ok) throw new Error('Failed to fetch AI');
        const data = await res.json();
        setAiData(data);
      } catch (error) {
          setAiData({
            score: 50,
            classification: 'Moderate',
            insight: 'AI Analysis engine is recalibrating data models.'
          });
      } finally {
        setLoadingAI(false);
      }
    }

    fetchDashboardData();
  }, [supabase, role, userId]);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">{role === 'client' ? 'Site Overview' : 'Project Overview'}</h1>
          <p className="text-slate-400 mt-1">{role === 'admin' ? 'Global Control Center' : 'Real-time project monitoring.'}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center space-x-3 shadow-md">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{role === 'client' ? 'Site Online' : 'System Secure'}</span>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <DashboardStats stats={stats} />

      {/* AI & Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Only show AI and Alerts for Engineer and Client, or a modified version for Admin if relevant */}
        <div className={cn("space-y-8", role === 'admin' ? "hidden" : "lg:col-span-1")}>
          <AIInsightCard data={aiData} loading={loadingAI} />
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Critical Alerts
            </h3>
            <div className="space-y-4">
              {stats.find(s => s.name === 'Material Stock')?.change?.includes('low') && (
                <div className="flex items-start space-x-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl group transition-all hover:bg-amber-500/10 cursor-pointer">
                  <Package className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors">Low Inventory</p>
                    <p className="text-xs text-slate-500 mt-0.5">Critical material shortage detected on your site.</p>
                  </div>
                </div>
              )}
              {stats.find(s => s.name === 'Safety Incidents')?.value as number > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl group transition-all hover:bg-rose-500/10 cursor-pointer">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-100 group-hover:text-rose-400 transition-colors">Safety Issue</p>
                    <p className="text-xs text-slate-500 mt-0.5">An active safety incident requires your attention.</p>
                  </div>
                </div>
              )}
              {stats.find(s => s.name === 'Total Labor')?.change?.includes('low') && (
                <div className="flex items-start space-x-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl group transition-all hover:bg-blue-500/10 cursor-pointer">
                  <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors">Labor Shortage</p>
                    <p className="text-xs text-slate-500 mt-0.5">Wait times increasing due to low attendance today.</p>
                  </div>
                </div>
              )}
              {!(stats.find(s => s.name === 'Material Stock')?.change?.includes('low')) && 
                !(stats.find(s => s.name === 'Safety Incidents')?.value as number > 0) && (
                <div className="py-8 text-center">
                  <Clock className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No critical alerts for your projects today.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={cn("bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl", role === 'admin' ? "lg:col-span-3" : "lg:col-span-2")}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-100">Project Performance Trend</h3>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              <span className="flex items-center before:content-[''] before:inline-block before:w-2 before:h-2 before:bg-blue-500 before:mr-1 before:rounded-full">Actual</span>
              <span className="flex items-center before:content-[''] before:inline-block before:w-2 before:h-2 before:bg-slate-700 before:mr-1 before:rounded-full">Target</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectProgress}>
                <defs>
                  <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="progress" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorProg)" animationDuration={1500} />
                <Area type="monotone" dataKey="target" stroke="#334155" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Row: Resource and Site Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {role !== 'admin' && (
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-slate-100 mb-6 font-mono tracking-tighter uppercase italic text-blue-500">Project Resources</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {allocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col space-y-2 mt-4">
              {allocation.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-2 hover:bg-white/[0.02] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-200">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={cn("bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl min-h-[400px]", role === 'admin' ? "lg:col-span-3" : "lg:col-span-2")}>
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
             <h3 className="text-xl font-bold text-slate-100 uppercase tracking-widest italic group-hover:text-blue-400 transition-colors">
               {role === 'admin' ? 'Global Site Activity' : 'Your Site Activity'}
             </h3>
             <div className="flex items-center space-x-4">
               <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded italic uppercase tracking-widest border border-white/5">Real-time Feed</span>
               <button className="text-xs font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300">View Map</button>
             </div>
          </div>
          <div className="p-0 overflow-y-auto max-h-[500px] scrollbar-hide pb-20">
             {recentActivities.length > 0 ? recentActivities.map((update, i) => (
               <div key={update.id} className="flex items-center p-6 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors group">
                 <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mr-6 group-hover:scale-110 transition-transform overflow-hidden shadow-2xl border border-white/5">
                    <img src={update.image_url || `https://picsum.photos/seed/${i + 15}/300`} alt="Site" className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1">
                   <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-extrabold text-slate-100 tracking-tight group-hover:text-blue-400 transition-colors italic uppercase">{update.notes || 'Site update logged'}</p>
                      <span className="text-[10px] font-bold text-slate-500 font-mono tracking-tighter">
                        {new Date(update.created_at).toLocaleString()}
                      </span>
                   </div>
                   <div className="flex items-center space-x-3">
                      <Link href={`/dashboard/projects/${update.project_id}`}>
                        <div className="flex items-center text-[10px] font-extrabold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all cursor-pointer">
                           {update.project?.name || 'Unknown Project'}
                        </div>
                      </Link>
                      <div className="flex items-center text-[10px] font-bold text-slate-400 italic">
                         by <span className="text-slate-200 ml-1 not-italic font-bold">{update.author?.full_name || 'System'}</span> 
                         <span className="ml-1 text-[9px] text-slate-600">({update.author?.role || 'uploader'})</span>
                      </div>
                   </div>
                 </div>
               </div>
             )) : (
              <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                 <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                    <MapPin className="w-10 h-10 text-slate-700" />
                 </div>
                 <p className="text-slate-500 font-bold uppercase tracking-[0.2em] italic">No active updates found.</p>
              </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
