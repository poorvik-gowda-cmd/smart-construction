'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Link2, CheckCircle2, Users, FolderOpen, Loader2, UserCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminAssignmentsPage() {
  const [engineers, setEngineers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedClient, setSelectedClient] = useState('');
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    fetchAll();
    
    // Check for clientId in URL to pre-select for assign-and-approve flow
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('clientId');
    if (clientId) {
      setSelectedClient(clientId);
    }
  }, []);

  async function fetchAll() {
    setLoading(true);
    const supabase = createClient();
    const [usersRes, projectsRes, assignmentsRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('engineer_client_assignments').select('*, engineer:engineer_id(full_name), client:client_id(full_name), project:project_id(name)'),
    ]);

    if (usersRes.data) {
      setEngineers(usersRes.data.filter(u => u.role === 'engineer'));
      setClients(usersRes.data.filter(u => u.role === 'client'));
    }
    if (projectsRes.data) setProjects(projectsRes.data);
    if (assignmentsRes.data) setAssignments(assignmentsRes.data);
    setLoading(false);
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClient || !selectedEngineer || !selectedProject) {
      alert('Please select a client, engineer, and project.');
      return;
    }
    setSaving(true);
    const supabase = createClient();

    // Create assignment
    const { error: assignError } = await supabase.from('engineer_client_assignments').upsert({
      client_id: selectedClient,
      engineer_id: selectedEngineer,
      project_id: selectedProject,
    });

    if (assignError) {
      alert(`Error: ${assignError.message}`);
      setSaving(false);
      return;
    }

    // Approve the client by setting pending_assignment to false
    const { error: approveError } = await supabase
      .from('profiles')
      .update({ pending_assignment: false })
      .eq('id', selectedClient);

    if (approveError) {
      alert(`Assignment saved but client approval failed: ${approveError.message}`);
    } else {
      alert('Client successfully assigned and approved!');
      setSelectedClient('');
      setSelectedEngineer('');
      setSelectedProject('');
      fetchAll();
    }
    setSaving(false);
  }

  async function handleRemoveAssignment(assignmentId: string, clientId: string) {
    if (!confirm('Remove this assignment? The client will lose access until reassigned.')) return;
    const supabase = createClient();
    await supabase.from('engineer_client_assignments').delete().eq('id', assignmentId);
    await supabase.from('profiles').update({ pending_assignment: true }).eq('id', clientId);
    fetchAll();
  }

  // Count assignments per engineer
  const assignmentCountByEngineer = assignments.reduce((acc: Record<string, number>, a) => {
    acc[a.engineer_id] = (acc[a.engineer_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Engineer–Client Assignments</h1>
        <p className="text-slate-500 mt-1">Assign clients to engineers and grant dashboard access. Each engineer can handle up to 3 clients.</p>
      </div>

      {/* Assignment Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center">
          <Link2 className="w-5 h-5 mr-2 text-blue-500" /> Create New Assignment
        </h2>
        <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Client (Pending)</label>
            <select
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">-- Pick a client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.id.slice(0,8)} {c.pending_assignment ? '⏳ Pending' : '✓ Active'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assign to Engineer</label>
            <select
              value={selectedEngineer}
              onChange={e => setSelectedEngineer(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">-- Pick an engineer --</option>
              {engineers.map(eng => {
                const count = assignmentCountByEngineer[eng.id] || 0;
                return (
                  <option key={eng.id} value={eng.id} disabled={count >= 3}>
                    {eng.full_name || eng.id.slice(0,8)} ({count}/3 clients) {count >= 3 ? '— Full' : ''}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Link to Project</label>
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">-- Pick a project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl shadow-xl shadow-blue-900/20 uppercase tracking-widest text-xs transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
              {saving ? 'Assigning...' : 'Assign & Approve Client'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Assignments List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 flex items-center space-x-3">
          <Users className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-bold text-white">Active Assignments</h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">{assignments.length} total</span>
        </div>
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-16 text-center text-slate-600 font-medium">No assignments yet. Use the form above to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/30 border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Engineer</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assigned On</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {assignments.map((a: any) => (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-100">{a.client?.full_name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{a.engineer?.full_name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-blue-400 font-bold flex items-center">
                        <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                        {a.project?.name || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRemoveAssignment(a.id, a.client_id)}
                        className="flex items-center text-rose-400 hover:text-rose-300 text-xs font-bold transition-colors"
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Remove
                      </button>
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
