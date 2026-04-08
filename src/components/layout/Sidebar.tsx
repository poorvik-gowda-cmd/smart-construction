'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  HardHat, 
  Users, 
  Map as MapIcon, 
  Files, 
  AlertTriangle, 
  Settings, 
  LogOut,
  LayoutDashboard,
  Hammer,
  Package,
  Truck,
  CreditCard,
  UserCog,
  Link2,
  MessageCircleWarning
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

interface SidebarProps {
  role: UserRole;
  onLogout?: () => void;
}

export default function Sidebar({ role, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    // Admin-only management
    { name: 'User Management', href: '/dashboard/admin/users', icon: UserCog, roles: ['admin'] },
    { name: 'Assignments', href: '/dashboard/admin/assignments', icon: Link2, roles: ['admin'] },
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'engineer', 'client'] },
    { name: 'Projects', href: '/dashboard/projects', icon: BarChart3, roles: ['admin', 'engineer'] },
    { name: 'Labor', href: '/dashboard/labor', icon: Users, roles: ['admin', 'engineer'] },
    { name: 'Attendance', href: '/dashboard/attendance', icon: HardHat, roles: ['admin', 'engineer'] },
    { name: 'Materials', href: '/dashboard/materials', icon: Package, roles: ['admin', 'engineer'] },
    { name: 'Suppliers', href: '/dashboard/suppliers', icon: Truck, roles: ['admin', 'engineer'] },
    { name: 'Expenses', href: '/dashboard/expenses', icon: CreditCard, roles: ['admin', 'engineer'] },
    { name: 'Site Updates', href: '/dashboard/updates', icon: MapIcon, roles: ['admin', 'engineer'] },
    { name: 'Documents', href: '/dashboard/documents', icon: Files, roles: ['admin', 'engineer'] },
    { name: 'Safety & Issues', href: '/dashboard/safety', icon: AlertTriangle, roles: ['admin', 'engineer'] },
    { name: 'Complaint Inbox', href: '/dashboard/admin/complaints', icon: MessageCircleWarning, roles: ['admin'] },
    // Client portal items
    { name: 'My Project', href: '/dashboard/client', icon: LayoutDashboard, roles: ['client'] },
    { name: 'Site Updates', href: '/dashboard/updates', icon: MapIcon, roles: ['client'] },
    { name: 'Documents', href: '/dashboard/client/documents', icon: Files, roles: ['client'] },
    { name: 'Complaints', href: '/dashboard/complaints', icon: MessageCircleWarning, roles: ['client'] },
  ];

  const filteredNav = navigation.filter(item => item.roles.includes(role));

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 w-64 border-r border-slate-800 shadow-xl fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">
          <Hammer className="w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
          SiteMaster
        </span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-blue-400" : "text-slate-500"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 mt-auto">
        <button
          onClick={onLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-bold text-slate-100 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-xl transition-all duration-200 group, shadow-lg shadow-rose-900/10"
        >
          <LogOut className="mr-3 h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1" />
          Logout
        </button>
      </div>
    </div>
  );
}
