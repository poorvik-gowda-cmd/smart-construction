'use client';

import { useState } from 'react';
import { Files, Search, Plus, Download, Eye, Trash2, FolderOpen, FileText, Image, FileSpreadsheet, X, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';

// Realtime data fetched from documents table

const typeIcon = (type: string) => {
  if (type === 'PDF') return <FileText className="w-5 h-5 text-rose-400" />;
  if (type === 'XLSX') return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
  return <Files className="w-5 h-5 text-blue-400" />;
};

const typeBadgeColor = (type: string) => {
  if (type === 'PDF') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  if (type === 'XLSX') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
};

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]); // Engineer's assigned clients

  useEffect(() => {
    async function fetchDocs() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        setDocuments(data);
      }

      // Fetch clients assigned to this engineer (for the share selector)
      if (user) {
        const { data: assignedClients } = await supabase
          .from('engineer_client_assignments')
          .select('client_id, client:client_id(full_name)')
          .eq('engineer_id', user.id);
        setClients(assignedClients || []);
      }

      setLoading(false);
    }
    fetchDocs();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ name: '', file_type: 'PDF', shared_with_client_id: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { alert('Please select a file.'); return; }
    setUploading(true);
    try {
      const supabase = createClient();
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `documents/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage (bucket: 'documents')
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      let fileUrl = '';
      if (!storageError) {
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
      } else {
        // Fallback: use a placeholder URL if storage isn't configured
        fileUrl = `#${filePath}`;
      }

      // Save document record to DB
      const { data, error: dbError } = await supabase.from('documents').insert([{
        name: formData.name || selectedFile.name,
        file_url: fileUrl,
        file_type: formData.file_type,
        shared_with_client_id: formData.shared_with_client_id || null,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id || null,
      }]).select();

      if (dbError) throw dbError;
      if (data) setDocuments([data[0], ...documents]);
      setShowModal(false);
      setFormData({ name: '', file_type: 'PDF', shared_with_client_id: '' });
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Make sure Supabase Storage bucket "documents" exists.');
    } finally {
      setUploading(false);
    }
  };

  const filtered = documents.filter(d =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (activeType === 'All' || d.file_type === activeType)
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Document Vault</h1>
          <p className="text-slate-500 mt-1">Centralized secure storage for plans, approvals, and project records.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-blue-900/30 transition-all transform hover:scale-105 active:scale-95 text-sm uppercase tracking-widest">
          <Plus className="w-5 h-5 mr-2" />
          Upload Document
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          {['All', 'PDF', 'XLSX', 'ZIP'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                activeType === t
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20"
                  : "text-slate-500 border-slate-800 hover:text-slate-300 bg-slate-950/40"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-12">
        {filtered.map((doc) => (
          <div key={doc.id} className="bg-slate-900 border border-slate-800 hover:border-blue-900/50 rounded-3xl p-5 shadow-lg group transition-all hover:shadow-2xl hover:translate-y-[-2px]">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                {typeIcon(doc.file_type)}
              </div>
              <span className={cn("text-[9px] font-bold uppercase tracking-widest border px-2 py-1 rounded-full", typeBadgeColor(doc.file_type))}>
                {doc.file_type}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors leading-snug mb-1">{doc.name}</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
              <FolderOpen className="w-3 h-3 inline-block mr-1 text-indigo-500/50 relative -top-[1px]" />
              {doc.project} • {doc.size}
            </p>
            <div className="border-t border-white/5 pt-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{doc.uploaded}</span>
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/10" title="Preview">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/10" title="Download">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/10" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-500" /> Upload Document
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Document Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g., Site Plan Phase 1" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">File Type</label>
                <select value={formData.file_type} onChange={e => setFormData({...formData, file_type: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="PDF">PDF</option>
                  <option value="XLSX">XLSX (Spreadsheet)</option>
                  <option value="ZIP">ZIP (Archive)</option>
                  <option value="IMG">Image</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Share with Client (Optional)</label>
                <select value={formData.shared_with_client_id} onChange={e => setFormData({...formData, shared_with_client_id: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">Internal only (engineer & admin)</option>
                  {clients.map((c: any) => (
                    <option key={c.client_id} value={c.client_id}>{c.client?.full_name || c.client_id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select File</label>
                <div className="mt-1 border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => document.getElementById('file-input')?.click()}>
                  {selectedFile ? (
                    <p className="text-sm font-bold text-blue-400">{selectedFile.name}</p>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Click to browse or drag & drop</p>
                    </>
                  )}
                </div>
                <input id="file-input" type="file" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-blue-900/20 uppercase tracking-widest text-xs transition-all mt-4 flex items-center justify-center">
                {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : 'Upload File'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
