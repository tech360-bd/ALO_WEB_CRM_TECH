'use client';

/**
 * Counselor sign-in — /counselor/login
 *
 * Counselors authenticate through the staff endpoint: there is no separate
 * counselor credential type. This screen is a dedicated entrance that lands on
 * the counselor workspace, not a separate auth path — role enforcement happens
 * server-side on every counselor API (spec §80).
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Eye, EyeOff, Headset, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePortalStore } from '@/lib/stores/portal-store';

export default function CounselorLoginPage() {
  const router = useRouter();
  const login = usePortalStore((state) => state.login);
  const setSelectedPortal = usePortalStore((state) => state.setSelectedPortal);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Counselors are staff records, so the staff portal session applies.
    setSelectedPortal('employee');
    const token = typeof window !== 'undefined' ? localStorage.getItem('employee_token') : null;
    if (token) router.replace('/counselor/dashboard');
  }, [router, setSelectedPortal]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Enter your staff email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        router.replace('/counselor/dashboard');
      } else {
        setError('Those credentials were not accepted. Check your staff email and password, or ask an administrator to reset them.');
      }
    } catch (caught) {
      setError((caught as Error)?.message || 'Sign-in failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--alo-page)] p-4">
      <Card className="w-full max-w-md border-[var(--alo-border)] bg-white shadow-xl">
        <CardHeader className="pb-2 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
            <Headset className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold text-[var(--alo-text)]">Counselor Workspace</CardTitle>
          <CardDescription className="text-xs text-[var(--alo-body)]">
            Sign in to manage your assigned leads, student applications, visa files and daily tasks.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="counselor-email" className="text-xs font-medium text-[var(--alo-body)]">Staff email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[var(--alo-text-muted)]" aria-hidden="true" />
                <Input
                  id="counselor-email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@aloeducation.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 border-[var(--alo-border)] pl-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="counselor-password" className="text-xs font-medium text-[var(--alo-body)]">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[var(--alo-text-muted)]" aria-hidden="true" />
                <Input
                  id="counselor-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 border-[var(--alo-border)] pl-9 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-3 text-[var(--alo-text-muted)] hover:text-[var(--alo-body)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="h-11 w-full rounded-button bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700">
              {loading ? 'Signing in…' : 'Sign In to Counselor Workspace'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />}
            </Button>
          </form>

          <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-[var(--alo-text-muted)]">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Counselors sign in with their staff account. What you can see and change is enforced by the server based
            on your assigned role — not by this page.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-3 border-t border-[var(--alo-border)] pt-4 text-xs">
            <Link href="/employee/login" className="font-medium text-[var(--alo-body)] hover:text-[var(--alo-text)] hover:underline">
              Staff &amp; Counselor Portal
            </Link>
            <Link href="/student/login" className="font-medium text-[var(--alo-body)] hover:text-[var(--alo-text)] hover:underline">
              Student Login
            </Link>
            <Link href="/partner/login" className="font-medium text-[var(--alo-body)] hover:text-[var(--alo-text)] hover:underline">
              Partner Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
