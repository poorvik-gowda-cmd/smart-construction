'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Eye, 
  MoreHorizontal,
  FolderOpen,
  QrCode,
  CheckCircle2,
  X,
  CreditCard,
  ChevronRight,
  AlertCircle,
  Loader2,
  Plus,
  Upload,
  FileUp,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';

interface ProjectDocumentListProps {
  projectId: string;
}

export default function ProjectDocumentList({ projectId }: ProjectDocumentListProps) {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({ name: '', type: 'SITE PLAN' });
  const supabase = createClient();

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setDocuments(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const handleGenerateQR = async (docId: string) => {
    try {
      // 1. Get the client assigned to this project
      const { data: assignment } = await supabase
        .from('engineer_client_assignments')
        .select('client_id')
        .eq('project_id', projectId)
        .maybeSingle();

      const clientId = assignment?.client_id;
      if (!clientId) {
        alert('No client is assigned to this project yet. Please assign a client first.');
        return;
      }

      // 2. Generate QR URL
      const qrData = `PAYMENT-${docId}-${Math.floor(1000 + Math.random() * 9000)}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}`;
      
      // 3. Update document with QR and share with THAT particular client
      const { error } = await supabase
        .from('documents')
        .update({ 
          payment_qr_url: qrUrl,
          payment_status: 'PENDING',
          shared_with_client_id: clientId
        })
        .eq('id', docId);

      if (error) throw error;
      
      // Update local state
      setDocuments(documents.map(d => d.id === docId ? { ...d, payment_qr_url: qrUrl, payment_status: 'PENDING' } : d));
    } catch (error: any) {
      console.error('QR Gen error:', error);
      alert('Failed to generate QR for this project client.');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) { alert('Select a file'); return; }
    setUploading(true);

    try {
      const fileExt = uploadFile.name.split('.').pop();
      const filePath = `documents/${Date.now()}.${fileExt}`;

      // 1. Storage Upload
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadFile);

      if (storageError) throw storageError;

      // 2. URL Generation
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      const fileUrl = urlData.publicUrl;

      // 3. Database Entry
      const { data: { user } } = await supabase.auth.getUser();
      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert([{
          name: uploadForm.name || uploadFile.name,
          file_url: fileUrl,
          file_type: uploadForm.type,
          project_id: projectId,
          uploaded_by: user?.id,
          size: (uploadFile.size / 1024 / 1024).toFixed(2) + ' MB',
          uploaded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }])
        .select();

      if (dbError) throw dbError;

      // Update State
      if (docData) setDocuments([docData[0], ...documents]);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadForm({ name: '', type: 'SITE PLAN' });
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getFileTypeIcon = (type: string) => {
    return FileText;
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-1">Documentation Vault</h3>
            <p className="text-slate-500 text-sm font-medium">Critical site blueprints, permits, and materials.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowQRModal(true)}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-900/30 flex items-center"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Generate Payment QR
            </button>
            <button 
              onClick={() => {
                setUploadForm({ ...uploadForm, type: 'SITE PLAN' });
                setShowUploadModal(true);
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload New
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-slate-800/50 rounded-3xl animate-pulse" />
              ))
            ) : documents.length > 0 ? (
              documents.map((doc) => {
                const Icon = getFileTypeIcon(doc.file_type);
                return (
                  <div key={doc.id} className="group flex items-center justify-between p-6 bg-slate-950/30 border border-white/5 rounded-[2rem] hover:bg-white/[0.02] hover:border-blue-500/30 transition-all duration-500">
                    <div className="flex items-center space-x-5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                        <Icon className="w-7 h-7 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors uppercase leading-tight max-w-[150px] truncate">
                          {doc.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 font-mono mt-1 italic uppercase">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {doc.payment_qr_url && (
                        <div className="flex items-center space-x-2 mr-2">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border",
                            doc.payment_status === 'PAID' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}>
                            {doc.payment_status === 'PAID' ? t('Paid') : t('Awaiting Payment')}
                          </span>
                          {doc.payment_status === 'PAID' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        </div>
                      )}

                      {doc.file_type === 'QUOTATION' && !doc.payment_qr_url && (
                        <button 
                          onClick={() => handleGenerateQR(doc.id)}
                          className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-all group/qr"
                          title={t('Generate Payment QR')}
                        >
                          <QrCode className="w-4 h-4 text-amber-400 group-hover/qr:scale-110 transition-transform" />
                        </button>
                      )}

                      {doc.payment_qr_url && (
                         <button 
                          onClick={() => window.open(doc.payment_qr_url, '_blank')}
                          className="p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all group/qr"
                          title={t('View QR Code')}
                         >
                           <QrCode className="w-4 h-4 text-blue-400 group-hover/qr:scale-110 transition-transform" />
                         </button>
                      )}

                      <a 
                        href={doc.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 bg-slate-800 hover:bg-blue-600/20 rounded-xl transition-all group/btn"
                      >
                        <Eye className="w-4 h-4 text-slate-400 group-hover/btn:text-blue-400" />
                      </a>
                      <button className="p-3 bg-slate-800 hover:bg-emerald-600/20 rounded-xl transition-all group/btn">
                        <Download className="w-4 h-4 text-slate-400 group-hover/btn:text-emerald-400" />
                      </button>
                      <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5 mx-auto">
                  <FolderOpen className="w-10 h-10 text-slate-700" />
                </div>
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] italic">Vault is currently empty.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quotation Selector Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/5 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{t('Select Quotation')}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{t('Generate Payment QR for this Project')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowQRModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {documents.filter(d => d.file_type === 'QUOTATION').length > 0 ? (
                  documents.filter(d => d.file_type === 'QUOTATION').map((doc) => (
                    <div 
                      key={doc.id}
                      className={cn(
                        "group p-6 rounded-[2rem] border transition-all duration-500 flex items-center justify-between",
                        doc.payment_qr_url 
                          ? "bg-emerald-500/5 border-emerald-500/20" 
                          : "bg-slate-950/40 border-white/5 hover:border-amber-500/50"
                      )}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          doc.payment_qr_url ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                        )}>
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{doc.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                            {doc.payment_qr_url ? (
                              <span className="text-emerald-500 flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> QR Ready
                              </span>
                            ) : (
                              <span>Pending Generation</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {doc.payment_qr_url ? (
                        <div className="flex items-center space-x-2">
                           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mr-2">{doc.payment_status}</span>
                           <button 
                            onClick={() => window.open(doc.payment_qr_url, '_blank')}
                            className="p-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl transition-all border border-blue-500/10"
                           >
                            <ExternalLink className="w-4 h-4" />
                           </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setIsGenerating(doc.id);
                            handleGenerateQR(doc.id).finally(() => setIsGenerating(null));
                          }}
                          disabled={isGenerating === doc.id}
                          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-amber-900/20 flex items-center"
                        >
                          {isGenerating === doc.id ? (
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          ) : (
                            <QrCode className="w-3 h-3 mr-2" />
                          )}
                          Generate
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center border border-white/5 mx-auto">
                      <AlertCircle className="w-10 h-10 text-slate-700" />
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                        No Quotations found for this project.
                      </p>
                      <p className="text-[10px] text-slate-600 mt-2 max-w-xs mx-auto">
                        Please upload a document and tag it as "QUOTATION" to activate payment features.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setShowQRModal(false);
                        setUploadForm({ name: '', type: 'QUOTATION' });
                        setShowUploadModal(true);
                      }}
                      className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl shadow-amber-900/20"
                    >
                      <Upload className="w-4 h-4 inline-block mr-2" />
                      Upload Quotation Now
                    </button>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed text-center">
                  * Generating a QR code will instantly share this quotation with the project's assigned client and enable payment tracking.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Document Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-slate-900 border border-white/5 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl relative"
            >
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Upload Credentials</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 opacity-60">Add Document to Secure Vault</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-slate-500"
                >
                  <XCircle className="w-8 h-8" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="p-10 space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 italic px-1">Document Alias</label>
                    <input 
                      type="text"
                      placeholder="e.g. SITE_PLAN_REV_02"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-[1.5rem] px-6 py-4 text-white placeholder:text-slate-700 focus:border-blue-500/50 outline-none transition-all font-bold tracking-tight"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 italic px-1">Classification</label>
                      <select 
                        value={uploadForm.type}
                        onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                        className="w-full bg-slate-950/50 border border-white/5 rounded-[1.5rem] px-6 py-4 text-white focus:border-blue-500/50 outline-none transition-all font-bold appearance-none cursor-pointer"
                      >
                        <option value="SITE PLAN">SITE PLAN</option>
                        <option value="QUOTATION">QUOTATION</option>
                        <option value="MATERIAL INVOICE">MATERIAL INVOICE</option>
                        <option value="SAFETY LOG">SAFETY LOG</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>

                    <div className="relative group">
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 italic px-1">Project ID (Locked)</label>
                       <div className="w-full bg-slate-950/20 border border-white/5 rounded-[1.5rem] px-6 py-4 text-slate-600 font-bold opacity-50 select-none">
                          {projectId.substring(0, 12)}...
                       </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 italic px-1">Cloud Integration</label>
                    <div className="relative border-2 border-dashed border-white/5 hover:border-blue-500/30 rounded-[2rem] p-10 transition-all duration-500 bg-white/[0.01] text-center group cursor-pointer">
                      <input 
                        type="file" 
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        required
                      />
                      <FileUp className="w-12 h-12 text-slate-700 group-hover:text-blue-500 group-hover:scale-110 transition-all mx-auto mb-4" />
                      <p className="text-sm font-black text-slate-400 uppercase tracking-tighter transition-colors group-hover:text-white">
                        {uploadFile ? uploadFile.name : 'Drop file or click to browse'}
                      </p>
                      <p className="text-[10px] text-indigo-500/50 font-bold uppercase tracking-widest mt-2 font-mono">Max limit: 50MB per file</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white py-5 rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] italic transition-all shadow-2xl shadow-blue-900/40 active:scale-95 flex items-center justify-center overflow-hidden relative group"
                  >
                    <span className="relative z-10 flex items-center">
                      {uploading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                          Indexing Data...
                        </>
                      ) : (
                        'Execute Upload'
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
