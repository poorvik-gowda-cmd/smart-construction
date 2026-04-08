'use client';

import { useState, useEffect } from 'react';
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
  Calendar
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

  useEffect(() => {
    async function fetchDashboardData() {
      setLoadingStats(true);
      try {
        // 1. Fetch Project Count and Total Budget
        const { data: projectsData, count: projectCount } = await supabase
          .from('projects')
          .select('budget, progress_percent, name', { count: 'exact' });

        const totalBudget = projectsData?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
        const avgProgress = projectsData && projectsData.length > 0
          ? Math.round(projectsData.reduce((sum, p) => sum + (p.progress_percent || 0), 0) / projectsData.length)
          : 0;

        // 2. Fetch Labor Attendance for today
        const today = new Date().toISOString().split('T')[0];
        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('date', today);
        
        const totalPresent = (attendance || []).filter(a => a.status === 'present' || a.status === 'overtime').length;
        const totalWorkers = attendance?.length || 0;
        const attendanceRate = totalWorkers > 0 ? Math.round((totalPresent / totalWorkers) * 100) : 0;

        // 3. Fetch expenses for budget utilization
        const { data: expenses } = await supabase
          .from('expenses')
          .select('amount, category');
        
        const totalSpent = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        const budgetUtilized = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

        // 4. Fetch Material stock status
        const { data: materials } = await supabase
          .from('materials')
          .select('stock_level, reorder_point');
        
        const lowStockCount = materials?.filter(m => m.stock_level <= m.reorder_point).length || 0;
        const stockHealth = materials && materials.length > 0 
          ? Math.round(((materials.length - lowStockCount) / materials.length) * 100)
          : 100;

        // 5. Fetch Safety Incidents (Open)
        const { count: safetyCount } = await supabase
          .from('safety_issues')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open');

        // 6. Fetch Recent Updates
        const { data: updates } = await supabase
          .from('site_updates')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentActivities(updates || []);

        setStats([
          { name: 'Active Projects', value: projectCount || 0, icon: BarChart3, change: '+1 this week', changeType: 'increase' as const },
          { name: 'Total Labor', value: totalPresent, icon: Users, change: `${attendanceRate}% attendance`, changeType: attendanceRate > 90 ? 'increase' : 'neutral' as const },
          { name: 'Material Stock', value: `${stockHealth}%`, icon: Package, change: lowStockCount > 0 ? `${lowStockCount} items low` : 'Healthy', changeType: lowStockCount > 0 ? 'decrease' : 'increase' as const, color: 'bg-amber-500/10' },
          { name: 'Safety Incidents', value: safetyCount || 0, icon: AlertTriangle, change: 'Active issues', changeType: 'decrease' as const, color: 'bg-emerald-500/10' },
        ]);

        // 7. Prepare Chart Data (Aggregated from real tables)
        setProjectProgress([
          { name: 'Initial', progress: 0, target: 10 },
          { name: 'Current', progress: avgProgress, target: 100 },
        ]);

        const laborExp = expenses?.filter(e => e.category.toLowerCase().includes('labor')).reduce((s, e) => s + e.amount, 0) || 0;
        const materialExp = expenses?.filter(e => e.category.toLowerCase().includes('material')).reduce((s, e) => s + e.amount, 0) || 0;
        const otherExp = totalSpent - laborExp - materialExp;

        setAllocation([
          { name: 'Labor', value: totalSpent > 0 ? Math.round((laborExp/totalSpent)*100) : 40, color: '#3b82f6' },
          { name: 'Material', value: totalSpent > 0 ? Math.round((materialExp/totalSpent)*100) : 35, color: '#6366f1' },
          { name: 'Other', value: totalSpent > 0 ? Math.round((otherExp/totalSpent)*100) : 25, color: '#8b5cf6' },
        ]);

        // 8. Fetch AI Insight using REAL calculated data
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
            progressPercent: progress
          })
        });
        
        if (!res.ok) throw new Error('Failed to fetch AI');
        const data = await res.json();
        setAiData(data);
      } catch (error) {
        setAiData({
          score: 50,
          classification: 'Error',
          insight: 'AI analysis unavailable. Please check your data connection.'
        });
      } finally {
        setLoadingAI(false);
      }
    }

    fetchDashboardData();
  }, [supabase]);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Project Overview</h1>
          <p className="text-slate-400 mt-1">Real-time control center for SiteMaster Construction Corp.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center space-x-3 shadow-md">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-slate-300">April 7, 2026</span>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105 active:scale-95 text-sm uppercase tracking-wider">
            Add Update
          </button>
        </div>
      </div>

      {/* Primary Stats */}
      <DashboardStats stats={stats} />

      {/* AI & Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <AIInsightCard data={aiData} loading={loadingAI} />
          
          {/* Quick Actions/Alerts Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Critical Alerts
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl group transition-all hover:bg-rose-500/10 cursor-pointer">
                <Clock className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-100 group-hover:text-rose-400 transition-colors">Permit Expiry</p>
                  <p className="text-xs text-slate-500 mt-0.5">Project A-101 permit expires in 48 hours.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl group transition-all hover:bg-amber-500/10 cursor-pointer">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors">Low Inventory</p>
                  <p className="text-xs text-slate-500 mt-0.5">Cement stock at 12% for Metro Plaza site.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
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
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="progress" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorProg)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#334155" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={0} 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Row: Resource and Site Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl h-[400px]">
          <h3 className="text-xl font-bold text-slate-100 mb-6">Resource Allocation</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={allocation}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
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
          <div className="flex justify-center space-x-6 -mt-4">
            {allocation.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-slate-400">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl h-[400px]">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
             <h3 className="text-xl font-bold text-slate-100">Recent Site Activity</h3>
             <button className="text-xs font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300">View Map</button>
          </div>
          <div className="p-0 overflow-y-auto h-full scrollbar-hide pb-20">
             {recentActivities.length > 0 ? recentActivities.map((update, i) => (
               <div key={update.id} className="flex items-center p-4 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors group">
                 <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform overflow-hidden">
                    <img src={update.image_url || `https://picsum.photos/seed/${i + 10}/200`} alt="Site" className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1">
                   <p className="text-sm font-bold text-slate-100 tracking-tight">{update.notes || 'Site update logged'}</p>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                     {new Date(update.created_at).toLocaleString()}
                   </p>
                 </div>
                 <div className="text-right">
                   <div className="flex items-center text-[10px] font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                     <MapPin className="w-3 h-3 mr-1 text-blue-500" />
                     {update.latitude.toFixed(2)}, {update.longitude.toFixed(2)}
                   </div>
                 </div>
               </div>
             )) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                 <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-slate-600" />
                 </div>
                 <p className="text-slate-500 font-medium">No site updates recorded yet.</p>
              </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
