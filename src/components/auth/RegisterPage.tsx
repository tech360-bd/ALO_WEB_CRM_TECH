'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { usePortalStore } from '@/lib/stores/portal-store';
import { trackAnalyticsEvent } from '@/lib/analytics/client';
import { collectAttributionPayload, rememberEntryAttribution } from '@/lib/analytics/attribution-payload';
import {
  GraduationCap,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  Phone,
  User,
  Building2,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';

const BULLET_POINTS = [
  'Search courses and compare options',
  'AI-powered university matching',
  'Dedicated counselor support',
  'End-to-end application tracking',
];

export default function RegisterPage() {
  const router = useRouter();
  const { selectedPortal, loginLoading, loginError, register, setView, clearLoginError } =
    usePortalStore();

  const isStudent = selectedPortal === 'student';

  // ── Form state ──
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearLoginError();

    // ── Validation ──
    if (isStudent) {
      if (!fullName.trim()) {
        setValidationError('Full name is required.');
        return;
      }
      if (!email.trim()) {
        setValidationError('Email is required.');
        return;
      }
      if (!phone.trim()) {
        setValidationError('Phone number is required.');
        return;
      }
      if (!password) {
        setValidationError('Password is required.');
        return;
      }
      if (password.length < 8) {
        setValidationError('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match.');
        return;
      }
      if (!agreedToTerms) {
        setValidationError('You must agree to the Terms of Service and Privacy Policy.');
        return;
      }
    } else {
      if (!companyName.trim()) {
        setValidationError('Company name is required.');
        return;
      }
      if (!contactPerson.trim()) {
        setValidationError('Contact person name is required.');
        return;
      }
      if (!email.trim()) {
        setValidationError('Email is required.');
        return;
      }
      if (!phone.trim()) {
        setValidationError('Phone number is required.');
        return;
      }
      if (!password) {
        setValidationError('Password is required.');
        return;
      }
      if (password.length < 8) {
        setValidationError('Password must be at least 8 characters.');
        return;
      }
    }

    const name = isStudent ? fullName.trim() : contactPerson.trim();

    const success = await register({
      name,
      email: email.trim(),
      phone: phone.trim(),
      password,
      portalType: selectedPortal,
      // Attribution the visitor arrived with, so a registration that turns into
      // a lead carries the campaign that acquired it. Only UTM labels, the
      // landing path, the referring origin and an opaque visitor token are
      // sent — never the name, email, phone or password above.
      attribution: rememberEntryAttribution('alo.attribution.register.v1') ?? collectAttributionPayload(),
    });

    // Measured as an outcome flag only. No credential or personal detail is
    // sent; `lead_source` is the portal type, which is public information.
    trackAnalyticsEvent('student_registration', {
      page_type: 'auth',
      result: success ? 'success' : 'failure',
      success: Boolean(success),
      lead_source: selectedPortal,
    }, { source: 'register-page' });

    if (usePortalStore.getState().currentView === 'verify-otp') {
      router.push('/verify-email');
      return;
    }
    if (success && !isStudent && usePortalStore.getState().currentView !== 'verify-otp') {
      setRegistrationSuccess(true);
    }
  };

  // ── Success state for partner ──
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-white flex">
        {/* Left Brand Panel */}
        <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] bg-alo-brand flex-col justify-center px-12 flex-shrink-0">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xl font-semibold tracking-tight">
              ALO Education
            </span>
          </div>
          <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-10">
            Join ALO Education
          </h1>
          <ul className="space-y-5">
            {BULLET_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-300 mt-0.5 flex-shrink-0" />
                <span className="text-white/90 text-[15px] leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--alo-text)] mb-3">
              Application Submitted
            </h2>
            <p className="text-sm text-[var(--alo-text-muted)] leading-relaxed mb-8">
              Your application is under review. We will notify you once approved.
            </p>
            <Button
              variant="brand"
              size="lg"
              className="w-full"
              onClick={() => setView('portals')}
            >
              Back to Portals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const displayError = validationError || loginError;

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
          Join ALO Education
        </h1>

        {/* Bullet points */}
        <ul className="space-y-5">
          {BULLET_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-300 mt-0.5 flex-shrink-0" />
              <span className="text-white/90 text-[15px] leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Right Registration Card ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Back button */}
          <button
            type="button"
            onClick={() => setView('portals')}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--alo-text-muted)] hover:text-[var(--alo-text)] transition-colors mb-8 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Back
          </button>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-alo-brand">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-alo-brand text-lg font-semibold tracking-tight">
              ALO Education
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-[var(--alo-text)] mb-1">
            {isStudent ? 'Create Student Account' : 'Apply as Partner'}
          </h2>
          <p className="text-sm text-[var(--alo-text-muted)] mb-8">
            {isStudent
              ? 'Start your study abroad journey today'
              : 'Grow your education consultancy with ALO'}
          </p>

          {/* Error Alert */}
          {displayError && (
            <div
              className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 mb-6 text-red-800"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-relaxed">{displayError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isStudent ? (
              <>
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="reg-fullname" className="text-[var(--alo-body)]">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)] pointer-events-none" />
                    <Input
                      id="reg-fullname"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-11 pl-10"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-[var(--alo-body)]">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)] pointer-events-none" />
                    <Input
                      id="reg-email"
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

                {/* Phone / WhatsApp */}
                <div className="space-y-2">
                  <Label htmlFor="reg-phone" className="text-[var(--alo-body)]">
                    Phone / WhatsApp
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)] pointer-events-none" />
                    <Input
                      id="reg-phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 pl-10"
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-[var(--alo-body)]">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)] pointer-events-none" />
                    <Input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-10 pr-10"
                      autoComplete="new-password"
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm-password" className="text-[var(--alo-body)]">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)] pointer-events-none" />
                    <Input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 pl-10 pr-10"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--alo-text-muted)] hover:text-[var(--alo-body)] transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-3 pt-1">
                  <Checkbox
                    id="reg-terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="reg-terms"
                    className="text-sm text-[var(--alo-body)] leading-relaxed cursor-pointer select-none"
                  >
                    I agree to the{' '}
                    <span className="text-alo-brand hover:underline font-medium">
                      Terms of Service
                    </span>{' '}
                    and{' '}
                    <span className="text-alo-brand hover:underline font-medium">
                      Privacy Policy
                    </span>
                  </label>
                </div>
              </>
            ) : (
              <>
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="reg-company" className="text-[var(--alo-body)]">
                    Company Name
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)] pointer-events-none" />
                    <Input
                      id="reg-company"
                      type="text"
                      placeholder="Your consultancy name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="h-11 pl-10"
                      autoComplete="organization"
                      required
                    />
                  </div>
                </div>

                {/* Contact Person */}
                <div className="space-y-2">
                  <Label htmlFor="reg-contact" className="text-[var(--alo-body)]">
                    Contact Person Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)] pointer-events-none" />
                    <Input
                      id="reg-contact"
                      type="text"
                      placeholder="Full name of primary contact"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="h-11 pl-10"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="reg-partner-email" className="text-[var(--alo-body)]">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)] pointer-events-none" />
                    <Input
                      id="reg-partner-email"
                      type="email"
                      placeholder="contact@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 pl-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="reg-partner-phone" className="text-[var(--alo-body)]">
                    Phone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)] pointer-events-none" />
                    <Input
                      id="reg-partner-phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 pl-10"
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="reg-partner-password" className="text-[var(--alo-body)]">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)] pointer-events-none" />
                    <Input
                      id="reg-partner-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-10 pr-10"
                      autoComplete="new-password"
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
              </>
            )}

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
              {isStudent ? 'Create Account' : 'Submit Application'}
            </Button>
          </form>

          {/* Sign in link */}
          <div className="mt-6">
            <p className="text-sm text-[var(--alo-text-muted)] text-center">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-alo-brand hover:text-alo-brand/80 font-semibold transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </div>

          {/* Security note */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-[var(--alo-text-muted)]">
            <Lock className="w-3 h-3" />
            <span>
              Protected by 256-bit encryption. Your data is safe with us.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}