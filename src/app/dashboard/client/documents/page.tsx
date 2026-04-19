'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Files, Plus, Upload, Eye, Download, Loader2, X, FileText, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

const typeIcon = (type: string) => {
  if (type === 'PDF') return <FileText className="w-5 h-5 text-rose-400" />;
  if (type === 'XLSX') return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
  if (type === 'IMG') return <ImageIcon className="w-5 h-5 text-blue-400" />;
  return <Files className="w-5 h-5 text-slate-400" />;
};

export default function ClientDocumentsPage() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ name: '', file_type: 'PDF' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Show: docs shared WITH this client by engineer + docs uploaded BY this client
    const { data } = await supabase
      .from('documents')
      .select('*')
      .or(`shared_with_client_id.eq.${user.id},uploaded_by.eq.${user.id}`)
      .order('created_at', { ascending: false });

    setDocuments(data || []);
    setLoading(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) { alert('Please select a file.'); return; }
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `client-uploads/${user?.id}/${Date.now()}.${fileExt}`;

      const { error: storageError } = await supabase.storage.from('documents').upload(filePath, selectedFile);

      let fileUrl = '';
      if (!storageError) {
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
      } else {
        throw new Error('Supabase Storage error: ' + storageError.message);
      }

      const { data, error: dbError } = await supabase.from('documents').insert([{
        name: formData.name || selectedFile.name,
        file_url: fileUrl,
        file_type: formData.file_type,
        uploaded_by: user?.id,
      }]).select();

      if (dbError) throw dbError;
      if (data) setDocuments([data[0], ...documents]);
      setShowModal(false);
      setFormData({ name: '', file_type: 'PDF' });
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(err.message || 'Upload failed. Ensure bucket "documents" is Public.');
    } finally {
      setUploading(false);
    }
  }

  const myUploads = documents.filter(d => d.uploaded_by === userId);
  const fromEngineer = documents.filter(d => d.shared_with_client_id === userId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('Documents')}</h1>
          <p className="text-slate-500 mt-1">{t('View files shared by your engineer and upload your own plans or photos.')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-blue-900/30 transition-all transform hover:scale-105 active:scale-95 text-sm uppercase tracking-widest"
        >
          <Plus className="w-5 h-5 mr-2" /> {t('Upload Document')}
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Documents from Engineer */}
          {fromEngineer.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-white/5 flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-xl"><Files className="w-4 h-4 text-blue-400" /></div>
                <h2 className="text-base font-bold text-white">{t('From Your Engineer')}</h2>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-lg font-bold">{fromEngineer.length}</span>
              </div>
              <div className="divide-y divide-white/5">
                {fromEngineer.map(doc => (
                  <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                        {typeIcon(doc.file_type)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{doc.name}</p>
                        <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mt-0.5">{new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* My Uploads */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-white/5 flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl"><Upload className="w-4 h-4 text-emerald-400" /></div>
              <h2 className="text-base font-bold text-white">{t('My Uploads')}</h2>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-lg font-bold">{myUploads.length}</span>
            </div>
            {myUploads.length === 0 ? (
              <div className="py-12 text-center text-slate-600 text-sm">{t('No uploads yet. Use the button above to share plans or photos.')}</div>
            ) : (
              <div className="divide-y divide-white/5">
                {myUploads.map(doc => (
                  <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                        {typeIcon(doc.file_type)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">{doc.name}</p>
                        <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mt-0.5">{new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-500" /> {t('Upload Document')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Document Name')}</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder={t('e.g., Site Plan v2')} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('File Type')}</label>
                <select value={formData.file_type} onChange={e => setFormData({...formData, file_type: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="PDF">PDF</option>
                  <option value="IMG">{t('Image / Photo')}</option>
                  <option value="XLSX">{t('Spreadsheet')}</option>
                  <option value="ZIP">{t('ZIP Archive')}</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Select File')}</label>
                <div className="mt-1 border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => document.getElementById('client-file-input')?.click()}>
                  {selectedFile ? (
                    <p className="text-sm font-bold text-blue-400">{selectedFile.name}</p>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">{t('Click to browse')}</p>
                    </>
                  )}
                </div>
                <input id="client-file-input" type="file" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              </div>
              <p className="text-[10px] text-slate-600">{t('Your uploaded document will be visible to your assigned engineer and the admin team.')}</p>
              <button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs transition-all flex items-center justify-center">
                {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('Uploading...')}</> : t('Upload File')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
