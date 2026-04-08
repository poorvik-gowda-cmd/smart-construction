'use client';

import { useState, useEffect } from 'react';
import { Attendance, Labor } from '@/types';
import { createClient } from '@/lib/supabase';
import { 
  Calendar, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter,
  Save,
  Download,
  FilterX,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [labor, setLabor] = useState<Labor[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, Partial<Attendance>>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (profile) setRole(profile.role);
        }

        // 1. Fetch Labor
        const { data: laborData, error: laborError } = await supabase
          .from('labor')
          .select('*');
        
        if (laborError) throw laborError;
        setLabor(laborData || []);

        // 2. Fetch Attendance for selected date
        const { data: attendData, error: attendError } = await supabase
          .from('attendance')
          .select('*')
          .eq('date', selectedDate);
        
        if (attendError) throw attendError;

        // Map behavior: Initial state is 'present' for all labor if no record exists
        const initialAttendance: Record<string, Partial<Attendance>> = {};
        (laborData || []).forEach(l => {
          initialAttendance[l.id] = { status: 'present', overtime_hours: 0 };
        });

        // Overlay existing DB records
        (attendData || []).forEach(a => {
          initialAttendance[a.labor_id] = { 
            id: a.id,
            status: a.status, 
            overtime_hours: Number(a.overtime_hours) || 0 
          };
        });

        setAttendanceData(initialAttendance);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedDate, supabase]);

  const toggleStatus = (id: string, status: Attendance['status']) => {
    setAttendanceData((prev: any) => ({
      ...prev,
      [id]: { ...prev[id], status }
    }));
  };

  const updateOvertime = (id: string, hours: number) => {
    setAttendanceData((prev: any) => ({
      ...prev,
      [id]: { ...prev[id], overtime_hours: hours }
    }));
  };

  const markAll = (status: Attendance['status']) => {
    const newData = { ...attendanceData };
    labor.forEach(l => {
      newData[l.id] = { ...newData[l.id], status };
    });
    setAttendanceData(newData);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsToUpsert = labor.map(l => {
        const data = attendanceData[l.id] || { status: 'present', overtime_hours: 0 };
        return {
          ...(data.id ? { id: data.id } : {}),
          labor_id: l.id,
          project_id: l.project_id,
          date: selectedDate,
          status: data.status,
          overtime_hours: data.overtime_hours
        };
      });

      const { error } = await supabase
        .from('attendance')
        .upsert(recordsToUpsert);

      if (error) throw error;
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Daily Attendance</h1>
          <p className="text-slate-500 mt-1">Mark workforce presence and calculate overtime for payroll.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-all">
             <Download className="w-4 h-4" />
             <span>Export Log</span>
          </button>
          
          {role !== 'admin' && (
            <button 
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-blue-900/30 transition-all transform hover:scale-105 active:scale-95 text-sm uppercase tracking-widest"
            >
              {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center space-x-4">
               <div className="relative group">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 transition-colors group-focus-within:text-blue-400" />
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 px-10 py-2.5 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
               </div>
               <div className="h-8 w-px bg-slate-800" />
               <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
                  <button className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-slate-900 text-blue-400 rounded-lg border border-blue-500/10 shadow-inner">All Projects</button>
               </div>
            </div>

            <div className="flex items-center space-x-2">
               {role !== 'admin' && (
                 <>
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mark All:</span>
                   <button 
                    onClick={() => markAll('present')}
                    className="p-1 px-3 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                   >
                    Present
                   </button>
                   <button 
                    onClick={() => markAll('absent')}
                    className="p-1 px-3 bg-rose-500/10 text-rose-500 text-[10px] font-bold uppercase rounded-lg border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                   >
                    Absent
                   </button>
                 </>
               )}
            </div>
         </div>

         {loading ? (
           <div className="py-20 flex flex-col items-center justify-center space-y-4">
             <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
             <p className="text-slate-400 text-sm animate-pulse">Loading workforce data...</p>
           </div>
         ) : (
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-white/5">
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Personnel</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">Status</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">Overtime (Hrs)</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">Projected Pay</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {labor.map((person) => {
                       const current = attendanceData[person.id] || { status: 'present', overtime_hours: 0 };
                       const isPresent = current.status === 'present';
                       const isAbsent = current.status === 'absent';
                       const isOT = current.status === 'overtime';

                       return (
                          <tr key={person.id} className="hover:bg-white/[0.02] transition-colors group">
                             <td className="px-6 py-5">
                                <div className="flex items-center space-x-4">
                                   <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-blue-500">
                                      {person.full_name?.[0] || '?'}
                                   </div>
                                   <div className="space-y-0.5">
                                      <p className="text-sm font-bold text-slate-100">{person.full_name || 'Unknown Worker'}</p>
                                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{person.skill_tag}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-5">
                                <div className="flex items-center justify-center space-x-2">
                                   <button 
                                     onClick={() => role !== 'admin' && toggleStatus(person.id, 'present')}
                                     disabled={role === 'admin'}
                                     className={cn(
                                       "p-2 rounded-xl transition-all border",
                                       isPresent ? "bg-emerald-600/20 text-emerald-500 border-emerald-500/30 shadow-lg shadow-emerald-500/10" : "bg-slate-950 border-slate-800 text-slate-600 hover:text-emerald-500",
                                       role === 'admin' && !isPresent && "opacity-30 cursor-not-allowed"
                                     )}
                                   >
                                      <CheckCircle2 className="w-5 h-5" />
                                   </button>
                                   <button 
                                     onClick={() => role !== 'admin' && toggleStatus(person.id, 'absent')}
                                     disabled={role === 'admin'}
                                     className={cn(
                                       "p-2 rounded-xl transition-all border",
                                       isAbsent ? "bg-rose-600/20 text-rose-500 border-rose-500/30 shadow-lg shadow-rose-500/10" : "bg-slate-950 border-slate-800 text-slate-600 hover:text-rose-500",
                                       role === 'admin' && !isAbsent && "opacity-30 cursor-not-allowed"
                                     )}
                                   >
                                      <XCircle className="w-5 h-5" />
                                   </button>
                                   <button 
                                     onClick={() => role !== 'admin' && toggleStatus(person.id, 'overtime')}
                                     disabled={role === 'admin'}
                                     className={cn(
                                       "p-2 rounded-xl transition-all border",
                                       isOT ? "bg-blue-600/20 text-blue-500 border-blue-500/30 shadow-lg shadow-blue-500/10" : "bg-slate-950 border-slate-800 text-slate-600 hover:text-blue-500",
                                       role === 'admin' && !isOT && "opacity-30 cursor-not-allowed"
                                     )}
                                   >
                                      <Clock className="w-5 h-5" />
                                   </button>
                                </div>
                             </td>
                             <td className="px-6 py-5">
                                <div className="flex items-center justify-center">
                                   <input 
                                     type="number" 
                                     value={current.overtime_hours}
                                     onChange={(e) => updateOvertime(person.id, parseFloat(e.target.value))}
                                     className={cn(
                                       "w-16 bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                                       (!isOT || role === 'admin') && "opacity-30 cursor-not-allowed"
                                     )}
                                     disabled={!isOT || role === 'admin'}
                                   />
                                </div>
                             </td>
                             <td className="px-6 py-5 text-center">
                                <span className="text-sm font-bold text-slate-200 tracking-tight">
                                   ₹{isPresent || isOT ? (person.daily_rate + (current.overtime_hours || 0) * (person.daily_rate / 8) * 1.5).toLocaleString() : 0}
                                </span>
                             </td>
                          </tr>
                       )
                    })}
                 </tbody>
              </table>
           </div>
         )}
      </div>
    </div>
  );
}

