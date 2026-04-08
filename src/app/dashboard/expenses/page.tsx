'use client';

import { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieIcon,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';

// Realtime data fetched from expenses table

export default function ExpensesPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [budgetTrend, setBudgetTrend] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ amount: '', category: 'Material', description: '' });

  useEffect(() => {
    async function fetchFinancials() {
      const supabase = createClient();
      // Fetch ledgers
      const { data: txs } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
      if (txs) {
         setTransactions(txs);
         
         // Aggregate for Pie Chart & Bar Chart (Simplified)
         const catMap: any = { 'Labor': 0, 'Material': 0, 'Permits': 0, 'Equipment': 0, 'Misc': 0 };
         txs.forEach(t => {
            const cat = t.category || 'Misc';
            if (catMap[cat] !== undefined) {
               catMap[cat] += Number(t.amount || 0);
            }
         });
         
         setExpenseData([
            { name: 'Labor', value: catMap['Labor'], color: '#3b82f6' },
            { name: 'Material', value: catMap['Material'], color: '#6366f1' },
            { name: 'Permits', value: catMap['Permits'], color: '#8b5cf6' },
            { name: 'Equipment', value: catMap['Equipment'], color: '#ec4899' },
            { name: 'Misc', value: catMap['Misc'], color: '#f43f5e' }
         ]);
      }
    }
    fetchFinancials();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data, error } = await supabase.from('expenses').insert([{
      amount: Number(formData.amount),
      category: formData.category,
      description: formData.description
    }]).select();

    if (data && !error) {
       setTransactions([data[0], ...transactions]);
       setShowModal(false);
       setFormData({ amount: '', category: 'Material', description: '' });
    } else {
       alert("Error adding expense.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Financial Oversight</h1>
          <p className="text-slate-500 mt-1">Monitor project spending, analyze budget variance, and track overheads.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-emerald-900/30 transition-all transform hover:scale-105 active:scale-95 text-sm uppercase tracking-widest leading-none">
          <Plus className="w-5 h-5 mr-2" />
          Add Expense
        </button>
      </div>

      {/* Top Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-lg group hover:border-blue-900/40 transition-colors">
            <div className="flex items-center justify-between">
               <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500">
                  <DollarSign className="w-6 h-6" />
               </div>
               <div className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                  +12.5%
               </div>
            </div>
            <div>
               <p className="text-2xl font-extrabold text-slate-100 italic tracking-tight">$2,750,000</p>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Total Capital Spent</p>
            </div>
         </div>

         <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-lg group hover:border-amber-900/40 transition-colors">
            <div className="flex items-center justify-between">
               <div className="p-3 bg-amber-600/10 rounded-2xl text-amber-500">
                  <TrendingUp className="w-6 h-6" />
               </div>
               <div className="flex items-center text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                  <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                  Over Budget
               </div>
            </div>
            <div>
               <p className="text-2xl font-extrabold text-slate-100 italic tracking-tight">$420,000</p>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Budget Variance (Q1)</p>
            </div>
         </div>

         <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-lg group hover:border-emerald-900/40 transition-colors">
            <div className="flex items-center justify-between">
               <div className="p-3 bg-emerald-600/10 rounded-2xl text-emerald-500">
                  <CreditCard className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2.5 py-1 rounded uppercase tracking-widest leading-none border border-white/5">Verified</span>
            </div>
            <div>
               <p className="text-2xl font-extrabold text-slate-100 italic tracking-tight">142</p>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Monthly Transactions</p>
            </div>
         </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
               <PieIcon className="w-5 h-5 mr-3 text-blue-500" />
               Cost Distribution
            </h3>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {expenseData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                     />
                  </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
               {expenseData.map((item) => (
                  <div key={item.name} className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-800/50 transition-all cursor-default">
                     <div className="w-1.5 h-1.5 rounded-full mb-1" style={{ backgroundColor: item.color }} />
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.name}</p>
                     <p className="text-xs font-extrabold text-slate-100">${(item.value / 1000).toFixed(0)}k</p>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
               <TrendingUp className="w-5 h-5 mr-3 text-emerald-500" />
               Budget vs. Actual Trend
            </h3>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetTrend}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                     <XAxis 
                       dataKey="month" 
                       stroke="#475569" 
                       fontSize={10} 
                       tickLine={false} 
                       axisLine={false}
                       fontFamily="JetBrains Mono"
                     />
                     <YAxis 
                       stroke="#475569" 
                       fontSize={10} 
                       tickLine={false} 
                       axisLine={false} 
                       tickFormatter={(value) => `$${value/1000}k`}
                       fontFamily="JetBrains Mono"
                     />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                     />
                     <Bar dataKey="actual" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                     <Bar dataKey="budget" fill="#1e293b" stroke="#334155" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <div className="border-t border-white/5 pt-6 mt-4 flex items-center justify-between">
               <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                     <span className="w-2 h-2 rounded-full bg-blue-500" />
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Spent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                     <span className="w-2 h-2 rounded-full bg-slate-700" />
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Planned</span>
                  </div>
               </div>
               <button className="text-[10px] font-extrabold text-blue-400 uppercase tracking-[0.2em] hover:text-blue-300">View Variance Report</button>
            </div>
         </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
         <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
               <h3 className="text-lg font-bold text-white tracking-widest uppercase">Transaction Ledger</h3>
               <div className="h-6 w-px bg-slate-800" />
               <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search by category..."
                    className="bg-slate-950 border border-slate-800 rounded-xl py-1.5 pl-10 pr-4 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48 font-medium placeholder:italic"
                  />
               </div>
            </div>
            <button className="flex items-center text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest border border-slate-800 px-3 py-1.5 rounded-lg transition-all hover:bg-slate-950">
               <Filter className="w-3.5 h-3.5 mr-2" />
               Advanced Filters
            </button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-950/20 border-b border-white/5 uppercase font-mono italic">
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-600 tracking-widest">Date</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-600 tracking-widest">Description</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-600 tracking-widest text-center">Category</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-600 tracking-widest text-right">Amount</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                      <td className="px-6 py-5 text-xs text-slate-500 font-bold font-mono">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-100 tracking-tight group-hover:text-blue-400 transition-colors">{t.description || 'Expense Entry'}</p>
                        <p className="text-[10px] text-slate-600 font-medium uppercase tracking-widest mt-0.5 italic">Ref: {t.id}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                           <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{t.category || 'Misc'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-mono italic">
                        <span className="text-sm font-bold text-slate-100">${(Number(t.amount) || 0).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Log Expense</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount ($)</label>
                <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" placeholder="1500.00" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
                  <option value="Material">Material</option>
                  <option value="Labor">Labor</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Permits">Permits</option>
                  <option value="Travel">Travel</option>
                  <option value="Misc">Misc</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g., Concrete Delivery" />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-emerald-900/20 uppercase tracking-widest text-xs transition-all mt-4">
                Record Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
