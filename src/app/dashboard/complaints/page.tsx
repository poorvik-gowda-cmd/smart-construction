'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { MessageCircleWarning, Plus, Send, CheckCircle2, Clock, AlertCircle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export default function ComplaintsPage() {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [assignment, setAssignment] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: asgn } = await supabase
      .from('engineer_client_assignments')
      .select('engineer_id, project_id')
      .eq('client_id', user.id)
      .single();
    setAssignment(asgn);

    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('from_client_id', user.id)
      .order('created_at', { ascending: false });
    setComplaints(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) return;

    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('complaints').insert([{
      from_client_id: user.id,
      to_engineer_id: assignment?.engineer_id || null,
      project_id: assignment?.project_id || null,
      subject: formData.subject,
      message: formData.message,
      status: 'open',
    }]);

    if (!error) {
      setFormData({ subject: '', message: '' });
      setShowModal(false);
      fetchData();
    } else {
      alert('Failed to submit complaint. Please try again.');
    }
    setSubmitting(false);
  }

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    open: { label: t('Open'), color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
    acknowledged: { label: t('Acknowledged'), color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: CheckCircle2 },
    resolved: { label: t('Resolved'), color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('Complaints & Issues')}</h1>
          <p className="text-slate-500 mt-1">{t('Submit concerns to your site engineer and admin team. We respond within 24 hours.')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-rose-900/30 transition-all transform hover:scale-105 active:scale-95 text-sm uppercase tracking-widest"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('File Complaint')}
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-400">
          {t('All complaints are automatically forwarded to your assigned engineer')} <strong className="text-white">{t('and')}</strong> {t('the admin team simultaneously. You can track the status of each complaint here.')}
        </p>
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
          <p className="text-slate-500 font-medium">{t('No complaints filed yet.')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(complaint => {
            const status = statusConfig[complaint.status] || statusConfig['open'];
            const StatusIcon = status.icon;
            return (
              <div key={complaint.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-bold text-white">{complaint.subject}</h3>
                  <span className={cn('text-[10px] font-bold uppercase tracking-widest border px-2.5 py-1 rounded-full shrink-0 flex items-center', status.color)}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed italic">"{complaint.message}"</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                  {t('Filed on:')} {new Date(complaint.created_at).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <MessageCircleWarning className="w-5 h-5 mr-2 text-rose-500" /> {t('File a Complaint')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Subject')}</label>
                <input
                  required
                  type="text"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                  placeholder={t('e.g., Material quality issue')}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Detailed Message')}</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  rows={4}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors resize-none"
                  placeholder={t('Describe your concern in detail...')}
                />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-500">
                ℹ️ {t('This complaint will be sent to your engineer and the admin team simultaneously.')}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-rose-900/20 uppercase tracking-widest text-xs transition-all flex items-center justify-center"
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {submitting ? t('Submitting...') : t('Submit Complaint')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
