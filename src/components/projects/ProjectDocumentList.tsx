'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Eye, 
  MoreHorizontal,
  FolderOpen
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface ProjectDocumentListProps {
  projectId: string;
}

export default function ProjectDocumentList({ projectId }: ProjectDocumentListProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDocuments() {
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
    }
    fetchDocuments();
  }, [projectId]);

  const getFileTypeIcon = (type: string) => {
    return FileText;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div>
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-1">Documentation Vault</h3>
          <p className="text-slate-500 text-sm font-medium">Critical site blueprints, permits, and materials.</p>
        </div>
        <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-900/30">
          Upload New
        </button>
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
                  
                  <div className="flex items-center space-x-2">
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
  );
}
