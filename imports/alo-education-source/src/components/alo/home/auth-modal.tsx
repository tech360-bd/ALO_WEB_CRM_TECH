'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type AuthTab = 'login' | 'register';

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function AuthModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [tab, setTab] = useState<AuthTab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'STUDENT' | 'PARTNER'>('STUDENT');

  const { toast } = useToast();

  const resetForm = useCallback(() => {
    setSuccess('');
    setIsLoading(false);
    if (tab === 'login') {
      setLoginEmail('');
      setLoginPassword('');
    } else {
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
    }
  }, [tab]);

  const switchTab = useCallback((newTab: AuthTab) => {
    setTab(newTab);
    resetForm();
  }, [resetForm]);

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setSuccess(`Welcome back, ${data.user.name}!`);
        toast({ title: 'Login successful', description: `Signed in as ${data.user.name}` });
      } else {
        toast({ title: 'Login failed', description: data.error || 'Invalid credentials', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not connect to server', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }
    if (regPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Minimum 6 characters required', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, phone: regPhone, password: regPassword, role: regRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Registration successful!');
        toast({ title: 'Account created', description: 'Check your email for verification' });
      } else {
        toast({ title: 'Registration failed', description: data.error || 'Please try again', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not connect to server', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-slate-200/80 rounded-2xl">
        <DialogTitle className="sr-only">Account Access</DialogTitle>
        <DialogDescription className="sr-only">Login or register for an ALO Education account</DialogDescription>

        {/* Header gradient bar */}
        <div className="h-1 gradient-border" />

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 pt-4">
          {/* Logo + Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066CC] to-[#004a99] shadow-md">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Welcome to ALO</h2>
              <p className="text-xs text-slate-500">Your study abroad journey starts here</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`relative flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
                {tab === t && (
                  <motion.div
                    layoutId="auth-tab"
                    className="absolute inset-0 rounded-lg bg-white shadow-sm"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Success state */}
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center py-8 text-center"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-slate-900">{success}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
                >
                  {tab === 'login' ? 'Create Account' : 'Sign In'}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: tab === 'login' ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tab === 'login' ? 10 : -10 }}
                transition={{ duration: 0.2 }}
              >
                {tab === 'login' ? (
                  /* ── LOGIN FORM ── */
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#0066CC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#0066CC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]/20"
                          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-[#0066CC] focus:ring-[#0066CC]" />
                        Remember me
                      </label>
                      <button type="button" className="text-xs font-semibold text-[#0066CC] hover:underline">
                        Forgot password?
                      </button>
                    </div>

                    <Button
                      onClick={handleLogin}
                      disabled={isLoading}
                      className="w-full gap-2 rounded-xl bg-[#0066CC] py-2.5 font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:bg-[#0052a8] hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-60"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      Sign In
                    </Button>
                  </div>
                ) : (
                  /* ── REGISTER FORM ── */
                  <div className="space-y-4">
                    {/* Role selector */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">I am a</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setRegRole('STUDENT')}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-xs font-semibold transition-all duration-200 ${
                            regRole === 'STUDENT'
                              ? 'border-[#0066CC] bg-blue-50 text-[#0066CC]'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <GraduationCap className="h-4 w-4" />
                          Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegRole('PARTNER')}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-xs font-semibold transition-all duration-200 ${
                            regRole === 'PARTNER'
                              ? 'border-[#F37021] bg-orange-50 text-[#F37021]'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <Briefcase className="h-4 w-4" />
                          Partner
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#0066CC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#0066CC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+880 1XXX-XXXXXX"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#0066CC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">Password * <span className="font-normal text-slate-400">(min 6 chars)</span></label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Create a strong password"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#0066CC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]/20"
                          onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {/* Password strength indicator */}
                      {regPassword.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                regPassword.length < 6 ? 'bg-red-400 w-1/4' :
                                regPassword.length < 10 ? 'bg-amber-400 w-2/4' :
                                'bg-emerald-400 w-full'
                              }`}
                            />
                          </div>
                          <span className={`text-[10px] font-semibold ${
                            regPassword.length < 6 ? 'text-red-500' :
                            regPassword.length < 10 ? 'text-amber-500' :
                            'text-emerald-500'
                          }`}>
                            {regPassword.length < 6 ? 'Weak' : regPassword.length < 10 ? 'Good' : 'Strong'}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleRegister}
                      disabled={isLoading}
                      className={`w-full gap-2 rounded-xl py-2.5 font-semibold text-white shadow-md transition-all duration-200 disabled:opacity-60 ${
                        regRole === 'STUDENT'
                          ? 'bg-[#0066CC] shadow-blue-500/20 hover:bg-[#0052a8] hover:shadow-lg hover:shadow-blue-500/30'
                          : 'bg-[#F37021] shadow-orange-500/20 hover:bg-[#e06818] hover:shadow-lg hover:shadow-orange-500/30'
                      }`}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      Create {regRole === 'STUDENT' ? 'Student' : 'Partner'} Account
                    </Button>

                    {regRole === 'PARTNER' && (
                      <p className="text-center text-[10px] text-slate-400">
                        Partner accounts require ALO Education approval before access.
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Social options */}
          <div className="flex gap-3">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50">
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
