'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import {
  Hammer, Mail, Lock, Loader2, ArrowRight,
  ArrowLeft, ShieldCheck, HardHat, User,
  Eye, EyeOff, UserPlus, LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Role = 'admin' | 'engineer' | 'client';

const roleConfig: Record<Role, {
  label: string;
  supabaseRole: string;
  icon: any;
  gradient: string;
  glow: string;
  accent: string;
  description: string;
}> = {
  admin: {
    label: 'Admin',
    supabaseRole: 'admin',
    icon: ShieldCheck,
    gradient: 'from-blue-600 to-indigo-700',
    glow: 'shadow-blue-900/40',
    accent: 'text-blue-400',
    description: 'System administrator with full access to all features, AI analytics, and financial controls.',
  },
  engineer: {
    label: 'Engineer',
    supabaseRole: 'engineer',
    icon: HardHat,
    gradient: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-900/40',
    accent: 'text-amber-400',
    description: 'Site engineer with access to attendance, labor management, site updates, and material tracking.',
  },
  client: {
    label: 'Client',
    supabaseRole: 'client',
    icon: User,
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-900/40',
    accent: 'text-emerald-400',
    description: 'Project client with read access to progress updates, geo-tagged site logs, and documents.',
  },
};

export default function AuthPage() {
  const params = useParams();
  const router = useRouter();
  const role = (params.role as Role) || 'admin';
  const config = roleConfig[role] || roleConfig.admin;
  const Icon = config.icon;

  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let loginEmail = email;
    let loginPassword = password;

    if (role === 'engineer') {
      const sanitizedKey = companyId.trim().toUpperCase();
      if (!sanitizedKey) {
        setError('Please enter your Security Access Key');
        setLoading(false);
        return;
      }
      
      // Verify the Access Key in the profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, access_key, email')
        .eq('access_key', sanitizedKey)
        .eq('role', 'engineer')
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
        setError('Invalid Security Access Key. Please contact your Admin.');
        setLoading(false);
        return;
      }

      // If key is valid, proceed with login using the email found in the profile
      loginEmail = profile.email || `${sanitizedKey.toLowerCase()}@sitemaster.com`;
      loginPassword = 'SiteMaster123!'; 
    }

    const { error } = await supabase.auth.signInWithPassword({ 
      email: loginEmail, 
      password: loginPassword 
    });

    if (error) {
      setError(role === 'engineer' ? 'Invalid Company ID' : error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // 1. Create auth user
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: config.supabaseRole },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError('Signup failed — please try again.');
      setLoading(false);
      return;
    }

    // 2. Create profile via server-side API (bypasses RLS)
    try {
      const res = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          fullName,
          role: config.supabaseRole,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        console.warn('Profile creation warning:', body.error);
        // Non-fatal: profile can be created on first dashboard visit
      }
    } catch (err) {
      console.warn('Profile API call failed, will retry on login:', err);
    }

    // 3. If user has a session (email confirm disabled), go straight to dashboard
    if (data.session) {
      router.push('/dashboard');
      return;
    }

    // 4. Email confirmation required
    setSuccess('✅ Account created! Check your email to verify, then log in.');
    setTab('login');
    setEmail('');
    setPassword('');
    setFullName('');
    setLoading(false);
  };


  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-br ${config.gradient} opacity-10 blur-[120px] rounded-full`} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-indigo-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md z-10 space-y-4">
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-300 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">All Portals</span>
        </button>

        {/* Card */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          {/* Role header */}
          <div className="flex items-center space-x-4 mb-8">
            <div className={`w-12 h-12 bg-gradient-to-br ${config.gradient} rounded-2xl flex items-center justify-center shadow-xl ${config.glow}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{config.label} Portal</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">SiteMaster Construction Platform</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 p-3 bg-slate-950/50 rounded-xl border border-slate-800">
            {config.description}
          </p>

          {/* Tabs */}
          {(role === 'client') ? (
            <div className="flex bg-slate-950/70 border border-slate-800 p-1 rounded-2xl mb-6">
              <button
                onClick={() => { setTab('login'); setError(null); setSuccess(null); }}
                className={cn(
                  'flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all',
                  tab === 'login'
                    ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
              <button
                onClick={() => { setTab('signup'); setError(null); setSuccess(null); }}
                className={cn(
                  'flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all',
                  tab === 'signup'
                    ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center bg-slate-950/70 border border-white/5 p-3 rounded-2xl mb-6">
               <LogIn className={cn('w-4 h-4 mr-2', config.accent)} />
               <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Authorized Access Only</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="space-y-4">
            {tab === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-slate-700 transition-all placeholder:text-slate-700 text-sm"
                  />
                </div>
              </div>
            )}

            {role === 'engineer' && tab === 'login' ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Security Access Key</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                  <input
                    type="text"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    placeholder="e.g. ENG-XXXX"
                    required
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-slate-700 transition-all placeholder:text-slate-700 text-sm"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-slate-700 transition-all placeholder:text-slate-700 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl py-3 pl-11 pr-11 text-slate-200 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-slate-700 transition-all placeholder:text-slate-700 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium p-3 rounded-xl">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium p-3 rounded-xl">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full bg-gradient-to-r text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl transition-all flex items-center justify-center group disabled:opacity-50 mt-2',
                config.gradient,
                config.glow
              )}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {tab === 'login' ? 'Enter Dashboard' : 'Create Account'}
                  <ArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Hammer branding */}
        <div className="flex items-center justify-center space-x-2 pt-2">
          <Hammer className="w-4 h-4 text-slate-700" />
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">SiteMaster · AI-Powered Construction Platform</span>
        </div>
      </div>
    </div>
  );
}
