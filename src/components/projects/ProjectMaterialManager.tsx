'use client';

import { useState, useEffect } from 'react';
import { Material } from '@/types';
import { 
  Package, 
  TrendingDown, 
  Plus, 
  Minus,
  AlertTriangle,
  History,
  Save,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';

interface ProjectMaterialManagerProps {
  projectId: string;
}

export default function ProjectMaterialManager({ projectId }: ProjectMaterialManagerProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ stock_level: 0, reorder_point: 0 });
  const supabase = createClient();

  useEffect(() => {
    async function fetchMaterials() {
      setLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('project_id', projectId);
      
      if (!error && data) {
        setMaterials(data);
      }
      setLoading(false);
    }
    fetchMaterials();
  }, [projectId]);

  const handleEdit = (material: Material) => {
    setEditingId(material.id);
    setEditData({ stock_level: material.stock_level, reorder_point: material.reorder_point });
  };

  const handleSave = async (id: string) => {
    const { error } = await supabase
      .from('materials')
      .update({ 
        stock_level: Number(editData.stock_level), 
        reorder_point: Number(editData.reorder_point) 
      })
      .eq('id', id);
    
    if (!error) {
      setMaterials(materials.map(m => m.id === id ? { ...m, ...editData } : m));
      setEditingId(null);
    } else {
      alert("Error updating material.");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div>
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-1">Inventory Control</h3>
          <p className="text-slate-500 text-sm font-medium">Manage site raw materials and replenishment levels.</p>
        </div>
        <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <span className="flex items-center before:content-[''] before:inline-block before:w-2 before:h-2 before:bg-rose-500 before:mr-1.5 before:rounded-full">Critical Low</span>
          <span className="flex items-center before:content-[''] before:inline-block before:w-2 before:h-2 before:bg-emerald-500 before:mr-1.5 before:rounded-full">Adequate</span>
        </div>
      </div>

      <div className="p-8 space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-[2rem] animate-pulse" />
          ))
        ) : materials.length > 0 ? (
          materials.map((item) => {
            const isLow = item.stock_level <= item.reorder_point;
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} className={cn(
                "group relative bg-slate-950/30 border rounded-[2rem] p-6 transition-all duration-500",
                isLow ? "border-rose-500/20 hover:border-rose-500/40" : "border-white/5 hover:border-white/20"
              )}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center space-x-5">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg transition-transform group-hover:scale-110",
                      isLow ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    )}>
                      <Package className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-lg font-black text-white uppercase tracking-tight italic">{item.name}</p>
                        {isLow && <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />}
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] font-mono mt-1">UNIT: {item.unit}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 lg:gap-12">
                     <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Current Stock</p>
                        {isEditing ? (
                          <input 
                            type="number" 
                            value={editData.stock_level} 
                            onChange={e => setEditData({...editData, stock_level: Number(e.target.value)})}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sm font-black text-white w-20 focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className={cn("text-2xl font-black italic", isLow ? "text-rose-500" : "text-white")}>
                            {item.stock_level} <span className="text-xs not-italic font-bold text-slate-600 uppercase tracking-tighter ml-1">{item.unit}</span>
                          </p>
                        )}
                     </div>

                     <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Reorder Point</p>
                        {isEditing ? (
                          <input 
                            type="number" 
                            value={editData.reorder_point} 
                            onChange={e => setEditData({...editData, reorder_point: Number(e.target.value)})}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sm font-black text-white w-20 focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-lg font-black text-slate-400 italic">
                             {item.reorder_point} <span className="text-[10px] not-italic font-bold text-slate-700 uppercase ml-0.5">{item.unit}</span>
                          </p>
                        )}
                     </div>

                     <div className="flex items-center space-x-2">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSave(item.id)} className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 transition-all">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-all">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(item) } className="px-4 py-2.5 bg-slate-800 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                              Edit Levels
                            </button>
                            <button className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-all">
                              <History className="w-4 h-4" />
                            </button>
                          </>
                        )}
                     </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5 mx-auto">
              <TrendingDown className="w-10 h-10 text-slate-700" />
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] italic">No material data recorded.</p>
          </div>
        )}
      </div>
    </div>
  );
}
