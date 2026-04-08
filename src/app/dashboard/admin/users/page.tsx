'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Users, Clock, CheckCircle2, UserCog, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
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

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    engineer: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    client: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">User Management</h1>
        <p className="text-slate-500 mt-1">Manage all platform users — engineers, clients, and admins.</p>
      </div>

      {/* Pending Clients Queue */}
      {pendingClients.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pending Approval</h2>
              <p className="text-xs text-slate-500">{pendingClients.length} client(s) are waiting to be assigned to an engineer.</p>
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
                    <p className="text-sm font-bold text-white">{client.full_name || 'Unnamed Client'}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Pending Assignment</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 font-mono">{client.id}</p>
                <a
                  href="/dashboard/admin/assignments"
                  className="block w-full text-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold py-2 rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                  Assign Engineer →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 flex items-center space-x-3">
          <Users className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-bold text-white">All Platform Users</h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">{allUsers.length} total</span>
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
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Joined</th>
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
                      {!user.pending_assignment ? (
                        <span className="flex items-center text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center text-amber-400 text-xs font-bold">
                          <Clock className="w-4 h-4 mr-1.5" /> Pending
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
