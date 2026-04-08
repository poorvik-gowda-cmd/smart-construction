'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import {
  BarChart3, MapPin, FileText, MessageSquare, Calendar, TrendingUp,
  Camera, ChevronRight, CheckCircle2, Clock, AlertCircle, Loader2,
  Users, Package, ShieldAlert, Lock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn, formatINR } from '@/lib/utils';

export default function ClientPage() {
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<any>(null); // engineer_client_assignments row
  const [project, setProject] = useState<any>(null);
  const [siteUpdates, setSiteUpdates] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, total: 0 });
  const [materials, setMaterials] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    async function loadClientDashboard() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // 1. Get assignment for this client
      const { data: asgn } = await supabase
        .from('engineer_client_assignments')
        .select('*, engineer:engineer_id(full_name, id), project:project_id(*)')
        .eq('client_id', user.id)
        .single();

      if (!asgn) {
        setLoading(false);
        return; // No assignment — show pending screen
      }

      setAssignment(asgn);
      setProject(asgn.project);

      const projectId = asgn.project_id;
      const engineerId = asgn.engineer_id;
      const today = new Date().toISOString().split('T')[0];

      // 2. Site updates from assigned engineer only
      const { data: updates } = await supabase
        .from('site_updates')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', engineerId)
        .order('created_at', { ascending: false })
        .limit(6);
      setSiteUpdates(updates || []);

      // 3. Today's attendance count
      const { data: attendAll } = await supabase
        .from('attendance')
        .select('*')
        .eq('project_id', projectId)
        .eq('date', today);

      const presentCount = (attendAll || []).filter(a => a.status === 'present' || a.status === 'overtime').length;
      setTodayAttendance({ present: presentCount, total: (attendAll || []).length });

      // 4. Materials linked to project
      const { data: mats } = await supabase
        .from('materials')
        .select('*')
        .eq('project_id', projectId);
      setMaterials(mats || []);

      // 5. Documents shared with this client
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('shared_with_client_id', user.id)
        .order('created_at', { ascending: false });
      setDocuments(docs || []);

      // 6. AI Risk Analysis
      try {
        const res = await fetch('/api/ai/risk-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        });
        if (res.ok) {
          const ai = await res.json();
          setAiInsight(ai);
        }
      } catch {}

      setLoading(false);
    }

    loadClientDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm animate-pulse">Loading your project dashboard...</p>
      </div>
    );
  }

  // PENDING SCREEN — not yet approved/assigned
  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Lock className="w-10 h-10 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-2">Access Pending</h1>
          <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
            Your account is pending approval. An administrator will review your request and assign you to a project engineer shortly. You'll receive full dashboard access once approved.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-left space-y-2 max-w-sm w-full">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">What happens next?</p>
          <div className="flex items-start space-x-3 text-sm text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <span>Admin reviews your registration</span>
          </div>
          <div className="flex items-start space-x-3 text-sm text-slate-300">
            <Clock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <span>You get assigned to a site engineer</span>
          </div>
          <div className="flex items-start space-x-3 text-sm text-slate-300">
            <BarChart3 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <span>Your full project dashboard unlocks</span>
          </div>
        </div>
      </div>
    );
  }

  const riskColor = aiInsight?.classification === 'High Risk' ? 'border-rose-900/40 bg-rose-500/5'
    : aiInsight?.classification === 'Moderate' ? 'border-amber-900/40 bg-amber-500/5'
    : 'border-emerald-900/40 bg-emerald-500/5';

  const riskBadge = aiInsight?.classification === 'High Risk' ? 'bg-rose-500 text-white'
    : aiInsight?.classification === 'Moderate' ? 'bg-amber-500 text-slate-950'
    : 'bg-emerald-500 text-slate-950';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-blue-600/20 via-indigo-600/10 to-transparent border border-blue-500/10 rounded-3xl p-8 overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-2">Your Project</p>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{project?.name || 'Loading...'}</h1>
        <p className="text-slate-400 mt-2 max-w-xl text-sm">{project?.description || ''}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="bg-slate-900/60 border border-white/5 px-4 py-2 rounded-xl flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-slate-300">Status: {project?.status?.toUpperCase()}</span>
          </div>
          <div className="bg-slate-900/60 border border-white/5 px-4 py-2 rounded-xl flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-300">Engineer: {assignment?.engineer?.full_name}</span>
          </div>
          <div className="bg-slate-900/60 border border-white/5 px-4 py-2 rounded-xl flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-300">Labour Today: {todayAttendance.present} / {todayAttendance.total} present</span>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <div className={cn('border rounded-3xl p-6 flex items-start space-x-4 shadow-xl', riskColor)}>
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-widest">AI Project Assistant</h3>
              <span className={cn('px-2 py-0.5 text-[9px] font-extrabold rounded-full uppercase tracking-tighter', riskBadge)}>
                {aiInsight.classification}
              </span>
              <span className="text-[10px] text-slate-500 font-bold">Risk Score: {aiInsight.score}/10</span>
            </div>
            <p className="text-slate-300 text-sm italic leading-relaxed font-medium">"{aiInsight.insight}"</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-600/10 rounded-2xl"><BarChart3 className="w-6 h-6 text-blue-500" /></div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10">Budget</span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{formatINR(project?.budget || 0)}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Project Budget</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-600/10 rounded-2xl"><Users className="w-6 h-6 text-emerald-500" /></div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">Today</span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{todayAttendance.present}<span className="text-slate-500 text-xl">/{todayAttendance.total}</span></p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Labour Present Today</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-rose-600/10 rounded-2xl"><Package className="w-6 h-6 text-rose-500" /></div>
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10">Stock</span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{materials.filter(m => (m.stock_level || 0) <= (m.reorder_point || 0)).length}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Materials at Low Stock</p>
          </div>
        </div>
      </div>

      {/* Materials Overview */}
      {materials.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 flex items-center">
            <Package className="w-5 h-5 mr-3 text-blue-500" />
            <h3 className="text-lg font-bold text-white">Material Status</h3>
          </div>
          <div className="divide-y divide-white/5">
            {materials.slice(0, 5).map(m => {
              const isCritical = (m.stock_level || 0) <= (m.reorder_point || 0);
              return (
                <div key={m.id} className="flex items-center justify-between px-6 py-4">
                  <p className="text-sm font-bold text-slate-100">{m.name}</p>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-slate-300">{(m.stock_level || 0).toLocaleString()} {m.unit}</span>
                    {isCritical && (
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded-full">Low Stock</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Latest Site Updates */}
      {siteUpdates.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 flex items-center">
            <Camera className="w-5 h-5 mr-3 text-blue-500" />
            <h3 className="text-lg font-bold text-white">Engineer's Field Updates</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {siteUpdates.map(u => (
              <div key={u.id} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden group hover:border-blue-900/50 transition-all">
                {u.image_url && (
                  <div className="aspect-video relative overflow-hidden">
                    <img src={u.image_url} alt="Site" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur px-2 py-1 rounded-lg flex items-center space-x-1 text-[10px] font-bold text-white">
                      <MapPin className="w-3 h-3 text-blue-400" />
                      <span>{u.latitude?.toFixed(2)}, {u.longitude?.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm text-slate-200 italic leading-relaxed">"{u.notes}"</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">{new Date(u.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Shared with Client */}
      {documents.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 flex items-center">
            <FileText className="w-5 h-5 mr-3 text-indigo-500" />
            <h3 className="text-lg font-bold text-white">Documents from Engineer</h3>
          </div>
          <div className="divide-y divide-white/5">
            {documents.map(doc => (
              <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer"
                className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-9 h-9 bg-indigo-600/10 text-indigo-500 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                    {doc.file_type || 'DOC'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">{doc.name}</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mt-0.5">{new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-all transform group-hover:translate-x-1" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {siteUpdates.length === 0 && documents.length === 0 && materials.length === 0 && (
        <div className="py-16 text-center space-y-3">
          <Camera className="w-12 h-12 text-slate-700 mx-auto" />
          <p className="text-slate-500 font-medium">Your engineer hasn't posted any updates yet.<br />Check back soon for site progress reports.</p>
        </div>
      )}
    </div>
  );
}
