'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Users, Clock, CheckCircle2, UserCog, Mail, ShieldCheck, Loader2, AlertCircle, XCircle, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const [pendingClients, setPendingClients] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setPendingClients(data.filter(u => u.role === 'client' && u.pending_assignment));
      setAllUsers(data);
    }
    setLoading(false);
  }

  async function handleStatusUpdate(userId: string, status: 'approved' | 'recheck' | 'rejected') {
    const supabase = createClient();
    let updates: any = {};
    
    if (status === 'approved') {
      updates = { pending_assignment: false, is_approved: true };
    } else if (status === 'recheck') {
      updates = { pending_assignment: true, is_approved: false };
    } else if (status === 'rejected') {
      updates = { pending_assignment: false, is_approved: false };
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      alert(`Error updating status: ${error.message}`);
    } else {
      fetchUsers();
    }
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    engineer: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    client: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('User Management')}</h1>
        <p className="text-slate-500 mt-1">{t('Manage all platform users — engineers, clients, and admins.')}</p>
      </div>

      {/* Pending Clients Queue */}
      {pendingClients.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t('Pending Approval')}</h2>
              <p className="text-xs text-slate-500">{pendingClients.length} client(s) {t('waiting to be assigned')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingClients.map(client => (
              <div key={client.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
                    {client.full_name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{client.full_name || t('Unnamed Client')}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{t('Pending Assignment')}</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 font-mono">{client.id}</p>
                
                <div className="flex flex-col space-y-2">
                  <a
                    href={`/dashboard/admin/assignments?clientId=${client.id}`}
                    className="flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all"
                  >
                    <UserCheck className="w-3 h-3 mr-2" /> {t('Assign Engineer')}
                  </a>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleStatusUpdate(client.id, 'recheck')}
                      className="flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 font-bold py-2 rounded-xl text-[9px] uppercase tracking-tighter transition-all"
                    >
                      <AlertCircle className="w-3 h-3 mr-1" /> {t('Recheck')}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(client.id, 'rejected')}
                      className="flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-bold py-2 rounded-xl text-[9px] uppercase tracking-tighter transition-all"
                    >
                      <XCircle className="w-3 h-3 mr-1" /> {t('Reject')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 flex items-center space-x-3">
          <Users className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-bold text-white">{t('All Platform Users')}</h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">{allUsers.length} {t('total')}</span>
        </div>
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/30 border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('User')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Role')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Security Key')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Status')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Joined')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allUsers.map(user => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sm text-blue-400">
                          {user.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-100">{user.full_name || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-600 font-mono">{user.id.slice(0, 12)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('text-[10px] font-bold uppercase tracking-widest border px-2.5 py-1 rounded-full', roleColors[user.role] || 'bg-slate-800 text-slate-400')}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'engineer' ? (
                        <code className="bg-slate-950 text-blue-400 px-2 py-1 rounded border border-blue-500/20 text-[10px] font-bold font-mono">
                          {user.access_key || 'NOT SET'}
                        </code>
                      ) : (
                        <span className="text-[10px] text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!user.pending_assignment ? (
                        <span className="flex items-center text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> {t('Active')}
                        </span>
                      ) : (
                        <span className="flex items-center text-amber-400 text-xs font-bold">
                          <Clock className="w-4 h-4 mr-1.5" /> {t('Pending')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
