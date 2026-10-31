'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePortalStore } from '@/lib/stores/portal-store';

export default function PartnerLoginPage() {
  const router = useRouter();
  const login = usePortalStore((state) => state.login);
  const setSelectedPortal = usePortalStore((state) => state.setSelectedPortal);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedPortal('partner');
    const token = typeof window !== 'undefined' ? localStorage.getItem('partner_token') : null;
    if (token) {
      router.replace('/partner/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your partner email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        router.replace('/partner/dashboard');
      } else {
        setError('Invalid partner credentials. Please check your email and password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--alo-page)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-[var(--alo-border)] bg-white">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] flex items-center justify-center mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-[var(--alo-text)]">Partner & Agent Portal</CardTitle>
          <CardDescription className="text-xs text-[var(--alo-body)]">
            Sign in to manage student referrals, view commissions, and submit university applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-crm-danger-bg border border-crm-danger-border flex items-center gap-2 text-xs text-crm-danger-text">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="partner-email" className="text-xs font-medium text-[var(--alo-body)]">Partner Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[var(--alo-text-muted)]" />
                <Input
                  id="partner-email"
                  type="email"
                  placeholder="agent@agency.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11 text-sm border-[var(--alo-border)]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="partner-pass" className="text-xs font-medium text-[var(--alo-body)]">Password</Label>
                <Link href="/forgot-password" className="text-xs text-[var(--alo-brand)] hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[var(--alo-text-muted)]" />
                <Input
                  id="partner-pass"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 h-11 text-sm border-[var(--alo-border)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[var(--alo-text-muted)] hover:text-[var(--alo-body)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
 type="submit"
 disabled={loading}
 className="w-full bg-[var(--alo-brand)] hover:bg-[#004694] text-white font-semibold text-sm rounded-lg"
 >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In to Partner Portal <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--alo-border)] text-center">
            <p className="text-xs text-[var(--alo-text-muted)]">
              Not a registered partner yet?{' '}
              <Link href="/contact" className="text-[var(--alo-cta)] font-semibold hover:underline">
                Apply for B2B Partnership
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
