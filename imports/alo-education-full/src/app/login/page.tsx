'use client';

import { Suspense, useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Show error from NextAuth callback (e.g. CredentialsSignin)
  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'CredentialsSignin') {
      setError('Invalid email or password. Please try again.');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Branding Panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 gradient-blue relative overflow-hidden">
        <div className="dot-grid-blue absolute inset-0 opacity-40" />
        <div className="relative z-10 flex flex-col justify-center items-center px-12 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm mb-6">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              ALO Education
            </h1>
            <p className="text-lg text-blue-100 max-w-md leading-relaxed">
              Your trusted partner for studying abroad. Explore universities,
              courses, and scholarships across the world.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8 max-w-sm w-full">
            {[
              { value: '500+', label: 'Universities' },
              { value: '50+', label: 'Countries' },
              { value: '10K+', label: 'Students' },
              { value: '100+', label: 'Partners' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative shapes */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-alo-gray-light">
        <div className="w-full max-w-md">
          {/* Mobile logo — shown only on mobile */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-alo-blue mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-alo-black">
              ALO Education
            </h1>
          </div>

          {/* Back to Home */}
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-alo-gray hover:text-alo-blue transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>

          <h2 className="text-2xl font-bold text-alo-black mb-1">
            Welcome back
          </h2>
          <p className="text-alo-gray mb-8">
            Sign in to your account to continue.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11 bg-white"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="/login"
                  className="text-xs text-alo-blue hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-alo-gray hover:text-alo-black transition-colors"
                  tabIndex={-1}
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

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full h-11 text-base font-semibold rounded-lg',
                'bg-alo-blue hover:bg-alo-blue-dark text-white',
                'transition-colors'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <p className="mt-8 text-center text-sm text-alo-gray">
            Don&apos;t have an account?{' '}
            <a
              href="/register"
              className="font-semibold text-alo-blue hover:underline"
            >
              Register
            </a>
          </p>

          {/* Footer */}
          <p className="mt-12 text-center text-xs text-alo-gray">
            &copy; {new Date().getFullYear()} ALO Education. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
