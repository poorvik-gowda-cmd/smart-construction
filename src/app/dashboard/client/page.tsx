'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import {
  BarChart3, MapPin, FileText, MessageSquare, Calendar, TrendingUp,
  Camera, ChevronRight, CheckCircle2, Clock, AlertCircle, Loader2,
  Users, Package, ShieldAlert, Lock, UserCog, QrCode, X, CreditCard
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatINR } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export default function ClientPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);
  // ... rest of state ...
  const [assignment, setAssignment] = useState<any>(null); // engineer_client_assignments row
  const [project, setProject] = useState<any>(null);
  const [siteUpdates, setSiteUpdates] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, total: 0 });
  const [materials, setMaterials] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState<any>(null);

  // ... useEffect logic ...
  useEffect(() => {
    async function loadClientDashboard() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // 0. Get user profile for approval status
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(prof);

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
        const rate = (attendAll || []).length > 0 ? Math.round((presentCount / (attendAll || []).length) * 100) : 0;
        const lowStockCount = (mats || []).filter(m => (m.stock_level || 0) <= (m.reorder_point || 0)).length;
        const stockHealth = (mats || []).length > 0 ? Math.round((((mats || []).length - lowStockCount) / (mats || []).length) * 100) : 100;

        const res = await fetch('/api/ai/risk-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            attendanceTrend: `${rate}% attendance today (${presentCount} workers on site)`,
            materialStatus: `Global stock health at ${stockHealth}%.`,
            budgetStatus: `${asgn.project?.budget || 0} total budget.`,
            progressPercent: asgn.project?.progress_percent || 0,
            context: 'Project-specific (Client View)'
          }),
        });
        if (res.ok) {
          const ai = await res.json();
          setAiInsight(ai);
        }
      } catch (err) {
        console.warn('AI Analysis failed:', err);
      }

      setLoading(false);
    }

    loadClientDashboard();
  }, []);

  const handleMockPayment = async () => {
    if (!selectedQuotation) return;
    setIsPaying(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('documents')
        .update({ payment_status: 'PAID' })
        .eq('id', selectedQuotation.id);

      if (error) throw error;

      // Update local state
      setDocuments(documents.map(d => d.id === selectedQuotation.id ? { ...d, payment_status: 'PAID' } : d));
      
      // Delay for success animation
      await new Promise(r => setTimeout(r, 1500));
      setShowPaymentModal(false);
      setSelectedQuotation(null);
    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment failed. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm animate-pulse">{t('Loading your project dashboard...')}</p>
      </div>
    );
  }

  // PENDING / RECHECK / REJECTED SCREEN
  if (!assignment) {
    const isRecheck = profile?.is_approved === false && profile?.pending_assignment === true;
    const isRejected = profile?.is_approved === false && profile?.pending_assignment === false;

    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center animate-in fade-in duration-700">
        <div className={cn(
          "w-20 h-20 rounded-3xl border flex items-center justify-center shadow-2xl animate-pulse",
          isRejected ? "bg-rose-500/10 border-rose-500/20" : isRecheck ? "bg-amber-500/10 border-amber-500/20" : "bg-blue-500/10 border-blue-500/20"
        )}>
          {isRejected ? <ShieldAlert className="w-10 h-10 text-rose-500" /> : isRecheck ? <AlertCircle className="w-10 h-10 text-amber-500" /> : <Lock className="w-10 h-10 text-blue-500" />}
        </div>
        
        <div className="max-w-md px-6">
          <h1 className="text-3xl font-black text-white mb-3">
            {isRejected ? t('Access Denied') : isRecheck ? t('Recheck Needed') : t('Access Pending')}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            {isRejected 
              ? t('Your account request has been declined. Please contact support if you believe this is an error.') 
              : isRecheck 
                ? t('An administrator has requested additional details about your project. Please wait for an update or contact the office.')
                : t('Your account is pending approval. An administrator will review your request and assign you to a project engineer shortly.')}
          </p>
        </div>

        {!isRejected && (
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-[2rem] px-8 py-6 text-left space-y-4 max-w-sm w-full shadow-2xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('Application Progress')}</p>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                <span className="text-sm font-bold text-slate-300">{t('Profile Created')}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", isRecheck ? "bg-amber-500/20 animate-pulse" : "bg-slate-800")}><Clock className={cn("w-4 h-4", isRecheck ? "text-amber-500" : "text-slate-500")} /></div>
                <span className={cn("text-sm font-bold", isRecheck ? "text-amber-500" : "text-slate-500")}>{t('Admin Security Check')}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center"><UserCog className="w-4 h-4 text-slate-500" /></div>
                <span className="text-sm font-bold text-slate-500">{t('Engineer Assignment')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const riskColor = aiInsight?.classification === 'High Risk' ? 'border-rose-900/40 bg-rose-500/5'
    : aiInsight?.classification === 'Moderate' ? 'border-amber-900/40 bg-amber-500/5'
    : 'border-emerald-900/40 bg-emerald-500/5';

  const riskBadge = aiInsight?.classification === 'High Risk' ? 'bg-rose-500 text-white'
    : aiInsight?.classification === 'Moderate' ? 'bg-amber-500 text-slate-950'
    : 'bg-emerald-500 text-slate-950';

  const quotations = documents.filter(d => d.file_type === 'QUOTATION');
  const otherDocs = documents.filter(d => d.file_type !== 'QUOTATION');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-blue-600/20 via-indigo-600/10 to-transparent border border-blue-500/10 rounded-3xl p-8 overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-2">{t('Your Project')}</p>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{project?.name || 'Loading...'}</h1>
        <p className="text-slate-400 mt-2 max-w-xl text-sm">{project?.description || ''}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="bg-slate-900/60 border border-white/5 px-4 py-2 rounded-xl flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-slate-300">{t('Status')}: {project?.status?.toUpperCase()}</span>
          </div>
          <div className="bg-slate-900/60 border border-white/5 px-4 py-2 rounded-xl flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-300">{t('Engineer')}: {assignment?.engineer?.full_name}</span>
          </div>
          <div className="bg-slate-900/60 border border-white/5 px-4 py-2 rounded-xl flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-300">{t('Labour Today')}: {todayAttendance.present} / {todayAttendance.total} {t('present')}</span>
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
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-widest">{t('AI Project Assistant')}</h3>
              <span className={cn('px-2 py-0.5 text-[9px] font-extrabold rounded-full uppercase tracking-tighter', riskBadge)}>
                {aiInsight.classification}
              </span>
              <span className="text-[10px] text-slate-500 font-bold">{t('Risk Score')}: {aiInsight.score}/10</span>
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
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10">{t('Budget')}</span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{formatINR(project?.budget || 0)}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t('Total Project Budget')}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-600/10 rounded-2xl"><Users className="w-6 h-6 text-emerald-500" /></div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">{t('Today')}</span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{todayAttendance.present}<span className="text-slate-500 text-xl">/{todayAttendance.total}</span></p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t('Labour Present Today')}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-rose-600/10 rounded-2xl"><Package className="w-6 h-6 text-rose-500" /></div>
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10">{t('Stock')}</span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{materials.filter(m => (m.stock_level || 0) <= (m.reorder_point || 0)).length}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t('Materials at Low Stock')}</p>
          </div>
        </div>
      </div>

      {/* Materials Overview */}
      {materials.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 flex items-center">
            <Package className="w-5 h-5 mr-3 text-blue-500" />
            <h3 className="text-lg font-bold text-white">{t('Material Status')}</h3>
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
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded-full">{t('Low Stock')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Latest Quotations */}
      {quotations.length > 0 && (
        <div className="bg-slate-900 border border-emerald-900/40 bg-emerald-500/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-emerald-500/10 flex items-center">
            <TrendingUp className="w-5 h-5 mr-3 text-emerald-500" />
            <h3 className="text-lg font-bold text-white">{t('Latest Quotations')}</h3>
          </div>
          <div className="divide-y divide-emerald-500/10">
            {quotations.map(doc => (
              <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer"
                className="flex items-center justify-between px-6 py-4 hover:bg-emerald-500/10 transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-9 h-9 bg-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/20">
                    {t('Quotation')}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">{doc.name}</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mt-0.5">{new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {doc.payment_qr_url && (
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                      doc.payment_status === 'PAID' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {doc.payment_status === 'PAID' ? t('Paid') : t('Awaiting Payment')}
                    </span>
                  )}
                  {doc.payment_qr_url && doc.payment_status !== 'PAID' ? (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedQuotation(doc);
                        setShowPaymentModal(true);
                      }}
                      className="flex items-center bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-900/20 active:scale-95"
                    >
                      <QrCode className="w-3 h-3 mr-2" />
                      {t('Pay Now')}
                    </button>
                  ) : (
                    <div className="flex items-center text-xs font-bold text-emerald-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('View Quotation')} <ChevronRight className="ml-2 w-4 h-4" />
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Latest Site Updates */}
      {siteUpdates.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 flex items-center">
            <Camera className="w-5 h-5 mr-3 text-blue-500" />
            <h3 className="text-lg font-bold text-white">{t('Engineer\'s Field Updates')}</h3>
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
            <h3 className="text-lg font-bold text-white">{t('Documents from Engineer')}</h3>
          </div>
          <div className="divide-y divide-white/5">
            {otherDocs.map(doc => (
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
          <p className="text-slate-500 font-medium">{t('Your engineer hasn\'t posted any updates yet.')}<br />{t('Check back soon for site progress reports.')}</p>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedQuotation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900 border border-white/5 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{t('Scan to Pay')}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{t('Payment for')}: {selectedQuotation.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 flex flex-col items-center space-y-8">
              <div className="relative p-6 bg-white rounded-[2rem] shadow-2xl">
                <img 
                  src={selectedQuotation.payment_qr_url} 
                  alt="Payment QR" 
                  className="w-64 h-64 h-64 object-contain"
                />
                <div className="absolute inset-x-0 bottom-4 flex justify-center">
                   <div className="bg-slate-900 px-3 py-1 rounded-full flex items-center space-x-2 border border-slate-700">
                      <ShieldAlert className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Secure SiteMaster Node</span>
                   </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Please scan the QR code using any UPI app or Banking application to complete your payment securely.
                </p>
              </div>

              <button
                onClick={handleMockPayment}
                disabled={isPaying}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-blue-900/30 uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center"
              >
                {isPaying ? (
                  <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> {t('Processing Payment...')}</>
                ) : (
                  <>{t('Confirm Payment')} <CheckCircle2 className="ml-3 w-5 h-5" /></>
                )}
              </button>
              
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">
                This transaction is protected by SiteMaster end-to-end encryption.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
