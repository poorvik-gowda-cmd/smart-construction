'use client';

import Link from 'next/link';
import { 
  UserCog, 
  Link2, 
  MessageCircleWarning, 
  ChevronRight, 
  Users, 
  ShieldCheck, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPortalPage() {
  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage platform access, approve new clients, and oversee security roles.',
      href: '/dashboard/admin/users',
      icon: UserCog,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      stats: 'Approve & Edit'
    },
    {
      title: 'Project Assignments',
      description: 'Link clients to specific engineers and projects to enable their dashboard access.',
      href: '/dashboard/admin/assignments',
      icon: Link2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      stats: 'Map Clients'
    },
    {
      title: 'Complaint Inbox',
      description: 'Monitor and resolve client complaints and safety concerns across all active sites.',
      href: '/dashboard/admin/complaints',
      icon: MessageCircleWarning,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      stats: 'Global Inbox'
    }
  ];

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center space-x-2 text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Administrative Command Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-6">
              Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Governance</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed font-medium">
              Oversee the entire SiteMaster ecosystem. Manage user lifecycles, handle global feedback, and ensure projects are correctly assigned to your field engineers.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 p-6 rounded-3xl">
              <Users className="w-6 h-6 text-blue-500 mb-2" />
              <p className="text-2xl font-black text-white">Active</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">User Base</p>
            </div>
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 p-6 rounded-3xl">
              <Activity className="w-6 h-6 text-emerald-500 mb-2" />
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Health</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {adminSections.map((section, idx) => (
          <Link 
            key={section.title} 
            href={section.href}
            className="group relative bg-slate-900 border border-slate-800 rounded-[2rem] p-8 transition-all duration-500 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-2 overflow-hidden"
          >
            <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500", section.bgColor)} />
            
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:rotate-6 shadow-xl", section.bgColor)}>
              <section.icon className={cn("w-7 h-7", section.color)} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{section.title}</h3>
                <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border", section.color, section.borderColor)}>
                  {section.stats}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {section.description}
              </p>
            </div>

            <div className="mt-8 flex items-center text-xs font-black text-blue-500 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
              Open Portal <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* Help Card */}
      <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-[2rem] p-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h4 className="text-white font-bold">Admin Privileges Active</h4>
            <p className="text-slate-400 text-sm">You have full access to global database objects, AI configuration, and user overrides.</p>
          </div>
        </div>
        <button className="hidden md:block px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all">
          View Audit Logs
        </button>
      </div>
    </div>
  );
}
