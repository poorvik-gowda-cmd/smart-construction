'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { MessageCircleWarning, CheckCircle2, Clock, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InboxComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function fetchComplaints() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const userRole = profile?.role || '';
      setRole(userRole);

      let query = supabase
        .from('complaints')
        .select('*, client:from_client_id(full_name), engineer:to_engineer_id(full_name), project:project_id(name)')
        .order('created_at', { ascending: false });

      // Admins see all; engineers see only complaints directed at them
      if (userRole === 'internal') {
        query = query.eq('to_engineer_id', user.id);
      }

      const { data } = await query;
      setComplaints(data || []);
      setLoading(false);
    }
    fetchComplaints();
  }, []);

  async function updateStatus(complaintId: string, newStatus: string) {
    setUpdating(complaintId);
    const supabase = createClient();
    await supabase.from('complaints').update({ status: newStatus }).eq('id', complaintId);
    setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: newStatus } : c));
    setUpdating(null);
  }

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    open: { label: 'Open', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
    acknowledged: { label: 'Acknowledged', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: AlertCircle },
    resolved: { label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Complaint Inbox</h1>
        <p className="text-slate-500 mt-1">
          {role === 'admin'
            ? 'All complaints submitted by clients across all projects.'
            : 'Complaints from your assigned clients.'}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {(['open', 'acknowledged', 'resolved'] as const).map(status => {
          const cfg = statusConfig[status];
          const Icon = cfg.icon;
          const count = complaints.filter(c => c.status === status).length;
          return (
            <div key={status} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
              <div className={cn('p-2.5 rounded-xl border', cfg.color)}><Icon className="w-4 h-4" /></div>
              <div>
                <p className="text-2xl font-extrabold text-white">{count}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto">
            <MessageCircleWarning className="w-8 h-8 text-slate-700" />
          </div>
          <p className="text-slate-500 font-medium">No complaints yet. All clear! ✓</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(complaint => {
            const status = statusConfig[complaint.status] || statusConfig['open'];
            const StatusIcon = status.icon;
            return (
              <div key={complaint.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">{complaint.subject}</h3>
                    <div className="flex items-center space-x-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <span>From: <span className="text-blue-400">{complaint.client?.full_name || 'Unknown Client'}</span></span>
                      {complaint.project?.name && (
                        <>
                          <span>•</span>
                          <span>Project: <span className="text-emerald-400">{complaint.project.name}</span></span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={cn('text-[10px] font-bold uppercase tracking-widest border px-2.5 py-1 rounded-full shrink-0 flex items-center', status.color)}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-slate-700 pl-4">
                  "{complaint.message}"
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    {new Date(complaint.created_at).toLocaleString()}
                  </p>
                  {complaint.status !== 'resolved' && (
                    <div className="flex items-center space-x-2">
                      {complaint.status === 'open' && (
                        <button
                          onClick={() => updateStatus(complaint.id, 'acknowledged')}
                          disabled={updating === complaint.id}
                          className="text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-all"
                        >
                          {updating === complaint.id ? '...' : 'Acknowledge'}
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(complaint.id, 'resolved')}
                        disabled={updating === complaint.id}
                        className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all"
                      >
                        {updating === complaint.id ? '...' : 'Mark Resolved'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
