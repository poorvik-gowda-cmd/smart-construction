'use client';

import { useState } from 'react';
import { Material } from '@/types';
import { 
  Package, 
  Search, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  ArrowDownCircle, 
  ArrowUpCircle,
  BarChart2,
  TableProperties,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';

// Realtime data fetched from materials table

export default function MaterialsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', unit: 'Bags', stock_level: '', reorder_point: '' });

  useEffect(() => {
    async function fetchMaterials() {
      const supabase = createClient();
      const { data, error } = await supabase.from('materials').select('*');
      if (data && !error) {
        setMaterials(data);
      }
      setLoading(false);
    }
    fetchMaterials();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data, error } = await supabase.from('materials').insert([{
      name: formData.name,
      unit: formData.unit,
      stock_level: Number(formData.stock_level),
      reorder_point: Number(formData.reorder_point)
    }]).select();

    if (data && !error) {
       setMaterials([...materials, data[0]]);
       setShowModal(false);
       setFormData({ name: '', unit: 'Bags', stock_level: '', reorder_point: '' });
    } else {
       alert("Error adding inventory.");
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Material Inventory</h1>
          <p className="text-slate-500 mt-1">Track stocks, manage reorders, and monitor consumption across sites.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-blue-900/30 transition-all transform hover:scale-105 active:scale-95 text-sm uppercase tracking-widest">
          <Plus className="w-5 h-5 mr-2" />
          Add Inventory
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-lg group hover:border-blue-900/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
               <div className="p-3 rounded-xl bg-blue-600/10 text-blue-500">
                  <Package className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded shadow-inner uppercase tracking-widest leading-none">Total Items</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-100 italic tracking-tight">1,482 <span className="text-slate-500 text-xs font-medium not-italic ml-1 uppercase">Units</span></p>
         </div>

         <div className="bg-slate-900 border border-rose-900/40 p-6 rounded-2xl space-y-4 shadow-lg group hover:border-rose-900 transition-colors cursor-pointer animate-pulse-slow">
            <div className="flex items-center justify-between">
               <div className="p-3 rounded-xl bg-rose-600/10 text-rose-500">
                  <AlertTriangle className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-bold text-rose-500 bg-rose-500/5 px-2 py-1 rounded shadow-inner uppercase tracking-widest leading-none">Critical Stock</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-100 italic tracking-tight">12 <span className="text-rose-500 text-xs font-medium not-italic ml-1 uppercase">Below Reorder</span></p>
         </div>

         <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-lg group hover:border-emerald-900/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
               <div className="p-3 rounded-xl bg-emerald-600/10 text-emerald-500">
                  <ArrowDownCircle className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded shadow-inner uppercase tracking-widest leading-none">Weekly Arrivals</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-100 italic tracking-tight">24 <span className="text-emerald-500 text-xs font-medium not-italic ml-1 uppercase">Consignments</span></p>
         </div>

         <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-lg group hover:border-amber-900/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
               <div className="p-3 rounded-xl bg-amber-600/10 text-amber-500">
                  <BarChart2 className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded shadow-inner uppercase tracking-widest leading-none">Burn Rate</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-100 italic tracking-tight">6.2% <span className="text-amber-500 text-xs font-medium not-italic ml-1 uppercase">Monthly Inc.</span></p>
         </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filter materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center space-x-2">
             <button className="flex items-center space-x-2 bg-slate-950 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-all">
                <TableProperties className="w-4 h-4" />
                <span>Export CSV</span>
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/50 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Material Resource</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Project Usage</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Current Stock</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMaterials.map((material) => {
                const stockLevel = material.stock_level || 0;
                const reorderPoint = material.reorder_point || 0;
                const isCritical = stockLevel <= reorderPoint;
                return (
                  <tr key={material.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg",
                          isCritical ? "bg-rose-600/20 text-rose-500 shadow-rose-900/10" : "bg-blue-600/20 text-blue-400 shadow-blue-900/10"
                        )}>
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-100">{material.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-widest">Unit: {material.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Project Site #{material.project_id}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1.5">
                        <div className="flex items-baseline justify-between">
                           <span className={cn("text-sm font-bold", isCritical ? "text-rose-400" : "text-slate-200")}>
                             {stockLevel.toLocaleString()}
                           </span>
                           <span className="text-[10px] text-slate-500 font-medium">Reorder at {reorderPoint}</span>
                        </div>
                        <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                           <div 
                             className={cn("h-full transition-all duration-700", isCritical ? "bg-rose-500" : "bg-blue-500")}
                             style={{ width: `${Math.min((stockLevel / ((reorderPoint || 1) * 2)) * 100, 100)}%` }}
                           />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {isCritical ? (
                        <div className="flex items-center text-rose-500 space-x-2">
                           <AlertTriangle className="w-4 h-4 animate-bounce" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">Low Stock Alert</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-emerald-500 space-x-2">
                           <ArrowUpCircle className="w-4 h-4" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">Stock Stable</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 rounded-lg transition-colors border border-blue-500/10">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/10">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add Inventory Item</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Material Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g., Portland Cement" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit</label>
                  <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="Bags">Bags</option>
                    <option value="Tons">Tons</option>
                    <option value="Cu m">Cu m</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Meters">Meters</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Stock</label>
                  <input required type="number" value={formData.stock_level} onChange={e => setFormData({...formData, stock_level: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="100" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reorder Point Alert</label>
                <input required type="number" value={formData.reorder_point} onChange={e => setFormData({...formData, reorder_point: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="20" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-blue-900/20 uppercase tracking-widest text-xs transition-all mt-4">
                Add To Inventory
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
