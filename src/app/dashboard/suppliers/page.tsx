'use client';

import { useState } from 'react';
import { Truck, Plus, Search, Phone, Tag, History, ChevronRight, MapPin, X } from 'lucide-react';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';

// Realtime data fetched from suppliers table

const TAG_COLORS = ['bg-blue-500/10 text-blue-400 border-blue-500/20', 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', 'bg-violet-500/10 text-violet-400 border-violet-500/20'];

export default function SuppliersPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', contact_info: '', material_tags: '' });

  useEffect(() => {
    async function fetchSuppliers() {
      const supabase = createClient();
      const { data, error } = await supabase.from('suppliers').select('*');
      if (data && !error) {
        setSuppliers(data);
      }
      setLoading(false);
    }
    fetchSuppliers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    
    // Split tags string by comma and trim
    const tagsArray = formData.material_tags.split(',').map(tag => tag.trim()).filter(tg => tg);

    const { data, error } = await supabase.from('suppliers').insert([{
      name: formData.name,
      contact_info: formData.contact_info,
      material_tags: tagsArray
    }]).select();

    if (data && !error) {
       setSuppliers([...suppliers, data[0]]);
       setShowModal(false);
       setFormData({ name: '', contact_info: '', material_tags: '' });
    } else {
       alert("Error adding supplier.");
    }
  };

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('Supplier Network')}</h1>
          <p className="text-slate-500 mt-1">{t('Manage vendor relationships, purchase history, and material sourcing.')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-blue-900/30 transition-all transform hover:scale-105 active:scale-95 text-sm uppercase tracking-widest">
          <Plus className="w-5 h-5 mr-2" />
          {t('Add Supplier')}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder={t('Search suppliers by name or material...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((supplier) => (
          <div key={supplier.id} className="bg-slate-900 border border-slate-800 hover:border-blue-900/50 rounded-3xl p-6 shadow-xl transition-all group hover:translate-y-[-2px] hover:shadow-2xl cursor-pointer">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/10 flex items-center justify-center shadow-lg">
                  <Truck className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors tracking-tight">{supplier.name}</h3>
                  <div className="flex items-center text-slate-600 text-xs font-bold uppercase tracking-widest mt-0.5 space-x-1">
                    <Phone className="w-3 h-3" />
                    <span>{supplier.contact_info}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-blue-400 transition-all transform group-hover:translate-x-1 mt-1" />
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {supplier.material_tags?.map((tag: string, i: number) => (
                <span key={tag} className={`text-[10px] font-bold uppercase tracking-widest border px-2.5 py-1 rounded-full ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                  {tag}
                </span>
              ))}
            </div>

            <div className="border-t border-white/5 pt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
                <History className="w-3.5 h-3.5 text-blue-500/50" />
                <span>{t('Last PO:')} <span className="text-slate-300 font-bold">{supplier.lastOrderDate}</span></span>
              </div>
              <div className="text-sm font-extrabold text-white tracking-tight">{supplier.lastOrder}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">{t('Add Supplier')}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Supplier Name')}</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g., Mega-Concrete Ltd" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Contact Info')}</label>
                <input required type="text" value={formData.contact_info} onChange={e => setFormData({...formData, contact_info: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('Material Tags (Comma separated)')}</label>
                <input required type="text" value={formData.material_tags} onChange={e => setFormData({...formData, material_tags: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="Cement, Aggregate, Sand" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-blue-900/20 uppercase tracking-widest text-xs transition-all mt-4">
                {t('Add Supplier')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
