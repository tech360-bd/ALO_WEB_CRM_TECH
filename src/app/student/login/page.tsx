'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Eye, EyeOff, Phone, Mail, Lock, ArrowRight, Shield, AlertCircle, Loader2 } from 'lucide-react';

type LoginMethod = 'password' | 'otp';

export default function StudentLoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<LoginMethod>('password');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // If already logged in, redirect
  useEffect(() => {
    localStorage.removeItem('student_token');
    // HttpOnly cookies are not visible to document.cookie. Verify server-side.
    fetch('/api/student/auth/me', { credentials: 'include' })
      .then(async res => { if (res.ok && (await res.json()).success) router.replace('/student/dashboard'); })
      .catch(() => {});
  }, [router]);

  // OTP countdown
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!phone && !email) {
      setError('Please enter your phone number or email');
      return;
    }
    setOtpSending(true);
    setError('');
    try {
      const res = await fetch('/api/student/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone || undefined, email: email || undefined })
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setOtpExpiry(data.expiresAt);
        setCountdown(60);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (method === 'password' && !password) {
      setError('Please enter your password');
      return;
    }
    if (method === 'otp' && !otpCode) {
      setError('Please enter the OTP code');
      return;
    }
    if (!email && !phone) {
      setError('Please enter your email or phone number');
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = { loginMethod: method };
      if (email) body.email = email;
      if (phone) body.phone = phone;
      if (method === 'password') body.password = password;
      if (method === 'otp') body.otpCode = otpCode;

      const res = await fetch('/api/student/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.success) {
        localStorage.removeItem('student_token');
        localStorage.setItem('student_user', JSON.stringify(data.student));
        router.push('/student/dashboard');
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--alo-page)] flex">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[var(--alo-brand)] via-[var(--alo-brand-hover)] to-[#002d6b] flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--alo-brand-light)] backdrop-blur flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-[var(--alo-text)]" />
            </div>
            <div>
              <p className="text-[var(--alo-text)] font-bold text-xl">ALO Education</p>
              <p className="text-[var(--alo-brand-pale)] text-sm">Student Portal</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-[var(--alo-text)] leading-tight">
              Your Study Abroad<br />Journey, All in One Place
            </h1>
            <p className="mt-4 text-[var(--alo-brand-pale)] text-lg leading-relaxed">
              Track applications, manage documents, prepare for interviews, and stay updated on your visa — from anywhere.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* No fabricated statistics — feature highlights only. */}
            {[
              { label: 'Application Tracking', value: 'Real-time' },
              { label: 'University Directory', value: 'Verified' },
              { label: 'Study Destinations', value: '8+' },
              { label: 'Document Hub', value: 'Secure' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[var(--alo-surface-muted)] backdrop-blur rounded-xl p-4 border border-[var(--alo-border)]">
                <p className="text-2xl font-bold text-[var(--alo-text)]">{stat.value}</p>
                <p className="text-[var(--alo-brand-pale)] text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[var(--alo-brand-pale)] text-sm">
          <Shield className="w-4 h-4" />
          <span>Your data is protected with enterprise-grade security</span>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 lg:max-w-md flex flex-col items-center justify-center p-8">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-cta)] flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-[var(--alo-text)]" />
          </div>
          <div>
            <p className="text-[var(--alo-text)] font-bold">ALO Education</p>
            <p className="text-[var(--alo-text-muted)] text-xs">Student Portal</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-[var(--alo-text)] mb-1">Welcome back</h2>
          <p className="text-[var(--alo-text-muted)] text-sm mb-8">Sign in to access your student portal</p>

          {/* Method Tabs */}
          <div className="flex bg-[var(--alo-surface-muted)] rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMethod('password'); setError(''); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                method === 'password' ? 'bg-[var(--alo-brand)] text-[var(--alo-text)]' : 'text-[var(--alo-text-muted)] hover:text-[var(--alo-text)]'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => { setMethod('otp'); setError(''); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                method === 'otp' ? 'bg-[var(--alo-brand)] text-[var(--alo-text)]' : 'text-[var(--alo-text-muted)] hover:text-[var(--alo-text)]'
              }`}
            >
              OTP / SMS
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email or Phone */}
            <div>
              <label className="block text-[var(--alo-placeholder)] text-sm font-medium mb-1.5">
                Email or Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--alo-text-muted)]">
                  {email.includes('@') ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  value={email || phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes('@') || val.includes('.com')) {
                      setEmail(val);
                      setPhone('');
                    } else {
                      setPhone(val);
                      setEmail('');
                    }
                  }}
                  placeholder="email@example.com or +8801805020100"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--alo-surface-muted)] border border-[var(--alo-border)] rounded-xl text-[var(--alo-text)] placeholder-gray-500 focus:outline-none focus:border-[var(--alo-brand)] focus:ring-1 focus:ring-[var(--alo-brand)] text-sm transition-all"
                  required
                />
              </div>
            </div>

            {method === 'password' ? (
              <div>
                <label className="block text-[var(--alo-placeholder)] text-sm font-medium mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--alo-text-muted)] w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full pl-10 pr-10 py-3 bg-[var(--alo-surface-muted)] border border-[var(--alo-border)] rounded-xl text-[var(--alo-text)] placeholder-gray-500 focus:outline-none focus:border-[var(--alo-brand)] focus:ring-1 focus:ring-[var(--alo-brand)] text-sm transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--alo-text-muted)] hover:text-[var(--alo-placeholder)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-1 text-right">
                  <Link href="/forgot-password" className="text-[#60a5fa] text-xs hover:text-[var(--alo-info-text)]">
                    Forgot password?
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[var(--alo-placeholder)] text-sm font-medium mb-1.5">
                  OTP Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit code"
                    maxLength={6}
                    className="flex-1 px-4 py-3 bg-[var(--alo-surface-muted)] border border-[var(--alo-border)] rounded-xl text-[var(--alo-text)] placeholder-gray-500 focus:outline-none focus:border-[var(--alo-brand)] focus:ring-1 focus:ring-[var(--alo-brand)] text-sm font-mono tracking-widest transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending || countdown > 0}
                    className="px-4 py-3 bg-[var(--alo-surface-muted)] hover:bg-[var(--alo-brand-light)] disabled:opacity-50 text-[var(--alo-text)] text-sm rounded-xl font-medium transition-all whitespace-nowrap"
                  >
                    {otpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : countdown > 0 ? `${countdown}s` : 'Send OTP'}
                  </button>
                </div>
                {otpSent && (
                  <p className="text-crm-success-text text-xs mt-1.5">
                    ✓ OTP sent successfully. Check your phone/email.
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-[var(--alo-surface-muted)] border border-red-500/20 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-crm-danger-text flex-shrink-0 mt-0.5" />
                <p className="text-crm-danger-text text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-brand-hover)] hover:from-[var(--alo-brand-hover)] hover:to-[var(--alo-brand-hover)] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-alo-brand/20"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[var(--alo-text-muted)] text-sm">
              Not registered yet?{' '}
              <Link href="/register" className="text-[#60a5fa] hover:text-[var(--alo-info-text)] font-medium">
                Create an account
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--alo-border)] text-center">
            <p className="text-[var(--alo-body)] text-xs">
              By signing in, you agree to ALO Education&apos;s{' '}
              <Link href="/terms" className="text-[var(--alo-text-muted)] hover:text-[var(--alo-text)]">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy-policy" className="text-[var(--alo-text-muted)] hover:text-[var(--alo-text)]">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
