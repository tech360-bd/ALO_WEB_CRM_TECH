'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { trackAnalyticsEvent } from '@/lib/analytics/client';
import { usePortalStore } from '@/lib/stores/portal-store';
import {
  GraduationCap,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  CheckCircle,
} from 'lucide-react';

interface LoginPageProps {
  initialPortal?: string;
}

const PORTAL_TITLES: Record<string, string> = {
  login: 'Student Login',
  'student-login': 'Student Login',
  'partner-login': 'Partner Login',
  'employee-login': 'Employee Login',
  'admin-login': 'Admin Portal Login',
};

function getPortalTitle(view: string): string {
  return PORTAL_TITLES[view] || 'Admin & Staff Login';
}

function isRegisterable(view: string): boolean {
  return view === 'login' || view === 'student-login' || view === 'partner-login';
}

const BULLET_POINTS = [
  'Track applications in real-time',
  'Connect with expert counselors',
  'AI-powered course matching',
  'Secure document management',
];

export default function LoginPage({ initialPortal }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);

  const { currentView, loginLoading, loginError, login, setView, clearLoginError } =
    usePortalStore();

  const activeView = initialPortal || currentView;
  const portalTitle = getPortalTitle(activeView);
  const canRegister = isRegisterable(activeView);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    clearLoginError();
    await login(email, password);
    // Measured after the attempt resolves, and only as a success/failure flag.
    // No credential, email address or personal detail is ever sent — the event
    // carries the portal type and the outcome, nothing else.
    const state = usePortalStore.getState();
    trackAnalyticsEvent('student_login', {
      page_type: 'auth',
      result: state.loginError ? 'failure' : 'success',
      success: !state.loginError,
      lead_source: activeView,
    }, { source: 'login-page' });
  };

  const getErrorMessage = (): { message: string; variant: 'error' | 'warning' } | null => {
    if (!loginError) return null;
    switch (loginError) {
      case 'account_suspended':
        return {
          message: 'Your account has been suspended. Contact support.',
          variant: 'error',
        };
      case 'account_pending':
        return {
          message: 'Your account is pending approval.',
          variant: 'warning',
        };
      case 'unauthorized':
        return {
          message: 'Please use the correct portal for your account.',
          variant: 'warning',
        };
      default:
        return { message: loginError, variant: 'error' };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left Brand Panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] bg-alo-brand flex-col justify-center px-12 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xl font-semibold tracking-tight">
            ALO Education
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-10">
          Your Global Education Journey Starts Here
        </h1>

        {/* Bullet points */}
        <ul className="space-y-5">
          {BULLET_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-300 mt-0.5 flex-shrink-0" />
              <span className="text-white/90 text-[15px] leading-relaxed">
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Right Login Card ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Back button */}
          <button
            type="button"
            onClick={() => setView('portals')}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--alo-text-muted)] hover:text-[var(--alo-text)] transition-colors mb-8 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Portals
          </button>

          {/* Mobile logo (visible only on mobile) */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-alo-brand">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-alo-brand text-lg font-semibold tracking-tight">
              ALO Education
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-[var(--alo-text)] mb-1">{portalTitle}</h2>
          <p className="text-sm text-[var(--alo-text-muted)] mb-8">
            Sign in to access your portal
          </p>

          {/* Error Alert */}
          {errorInfo && (
            <div
              className={`flex items-start gap-3 rounded-lg border p-4 mb-6 ${
                errorInfo.variant === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
              role="alert"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-relaxed">{errorInfo.message}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-[var(--alo-body)]">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)] pointer-events-none" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-[var(--alo-body)]">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)] pointer-events-none" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-10 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--alo-text-muted)] hover:text-[var(--alo-body)] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={rememberDevice}
                  onCheckedChange={(checked) =>
                    setRememberDevice(checked === true)
                  }
                />
                <span className="text-sm text-[var(--alo-body)]">Remember device</span>
              </label>
              <button
                type="button"
                onClick={() => setView('forgot-password')}
                className="text-sm text-alo-brand hover:text-alo-brand/80 font-medium transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
 type="submit"
 variant="cta"
 size="lg"
 className="w-full "
 disabled={loginLoading}
 >
              {loginLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Sign In
            </Button>
          </form>

          {/* Register / Info note */}
          <div className="mt-6">
            {canRegister ? (
              <p className="text-sm text-[var(--alo-text-muted)] text-center">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className="text-alo-brand hover:text-alo-brand/80 font-semibold transition-colors cursor-pointer"
                >
                  Register
                </button>
              </p>
            ) : (
              <p className="text-sm text-[var(--alo-text-muted)] text-center">
                Employees are created by admin only.
              </p>
            )}
          </div>

          {/* Security note */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-[var(--alo-text-muted)]">
            <Lock className="w-3 h-3" />
            <span>
              Protected by 256-bit encryption. All login attempts are monitored.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}