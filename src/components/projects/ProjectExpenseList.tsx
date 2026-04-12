'use client';

import { useState, useEffect } from 'react';
import { Expense } from '@/types';
import { 
  DollarSign, 
  Search, 
  Filter, 
  TrendingDown, 
  TrendingUp,
  Receipt,
  MoreVertical
} from 'lucide-react';
import { cn, formatINR } from '@/lib/utils';
import { createClient } from '@/lib/supabase';

interface ProjectExpenseListProps {
  projectId: string;
}

export default function ProjectExpenseList({ projectId }: ProjectExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function fetchExpenses() {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });
      
      if (!error && data) {
        setExpenses(data);
      }
      setLoading(false);
    }
    fetchExpenses();
  }, [projectId]);

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-white/5 bg-white/[0.01]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-1">Financial Log</h3>
            <p className="text-slate-500 text-sm font-medium">Tracking every rupee spent on this site.</p>
          </div>
          
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center space-x-4">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Site Spend</p>
              <p className="text-xl font-black text-emerald-400 leading-none mt-1">{formatINR(totalSpent, true)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="flex items-center space-x-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search expenses by category or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium text-sm"
            />
          </div>
          <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-white/5 transition-all">
            <Filter className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-20 bg-slate-800/50 rounded-2xl animate-pulse" />
            ))
          ) : filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense) => (
              <div key={expense.id} className="group bg-slate-950/30 border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] hover:border-blue-500/30 transition-all duration-300 flex items-center justify-between">
                <div className="flex items-center space-x-5">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                    <Receipt className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <p className="text-sm font-black text-white uppercase tracking-tight">{expense.description}</p>
                      <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded italic">
                        {expense.category}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-widest italic">
                      {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <p className="text-xl font-black text-white italic">
                    {formatINR(expense.amount, true)}
                  </p>
                  <button className="text-slate-600 hover:text-white transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5 mx-auto">
                <TrendingDown className="w-10 h-10 text-slate-700" />
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] italic">No expense records found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
