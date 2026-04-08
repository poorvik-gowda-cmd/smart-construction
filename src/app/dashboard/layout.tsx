'use client';

import Sidebar from '@/components/layout/Sidebar';
import { UserRole } from '@/types';
import { useState, useEffect } from 'react';
import { Bell, Search, User, Menu, X, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState('User');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadUserProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single();

        if (profile?.role) {
          setRole(profile.role as UserRole);
          if (profile?.full_name) setFullName(profile.full_name);
        } else {
          // Profile missing — try to create it via API using metadata from signup
          const meta = user.user_metadata;
          const inferredRole = meta?.role || 'engineer';
          const inferredName = meta?.full_name || user.email?.split('@')[0] || 'User';

          try {
            await fetch('/api/auth/create-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                fullName: inferredName,
                role: inferredRole,
              }),
            });
            setRole(inferredRole as UserRole);
            setFullName(inferredName);
          } catch {
            // Fail gracefully — default role already set
          }
        }

        if (!profile?.full_name) {
          setFullName(user.email?.split('@')[0] || 'User');
        }
      } else {
        // No user found, redirect to login
        router.push('/');
      }
    }
    loadUserProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const roleLabel: Record<UserRole, string> = {
    admin: 'Administrator',
    engineer: 'Site Engineer',
    client: 'Project Client',
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Loading Secure Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden font-sans">
      {/* Sidebar — Desktop */}
      <div className="hidden lg:block">
        <Sidebar role={role} onLogout={handleLogout} />
      </div>

      {/* Sidebar — Mobile Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-950">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <Sidebar role={role} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-slate-950/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-100"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="Search projects, materials, or updates..."
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-slate-900 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button className="relative group">
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-950 animate-pulse" />
              <Bell className="h-6 w-6 text-slate-400 group-hover:text-slate-200 transition-colors" />
            </button>

            {/* User identity & Actions */}
            <div className="flex items-center space-x-4">
              <div className="h-10 w-px bg-slate-800 hidden sm:block" />
              
              <div className="flex items-center space-x-3 group">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-100 capitalize">{fullName}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{roleLabel[role]}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-blue-900/20">
                  <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="h-10 w-px bg-slate-800 hidden md:block" />

              <div className="hidden md:flex items-center space-x-2">
                <button 
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                >
                  Switch Portal
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-900/10"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile logout */}
              <button
                onClick={handleLogout}
                className="md:hidden text-slate-500 hover:text-rose-400 transition-colors p-2 rounded-xl hover:bg-rose-500/10"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-black p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
