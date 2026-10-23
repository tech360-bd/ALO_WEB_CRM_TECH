"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Icon } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";
import type { ViewKey } from "@/lib/alo-types";

interface AuthVerifyOtpProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

const RESEND_COUNTDOWN = 60; // seconds

export function AuthVerifyOtp({ onNavigate }: AuthVerifyOtpProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [verified, setVerified] = React.useState(false);
  const [approvalRequired, setApprovalRequired] = React.useState(false);
  const [portalVerification, setPortalVerification] = React.useState(false);
  const [canonicalStudent, setCanonicalStudent] = React.useState(false);
  const [countdown, setCountdown] = React.useState(RESEND_COUNTDOWN);

  // AuthRegister stashes the email on `window.__aloOtpEmail` before calling
  // onNavigate("auth-verify-otp"). We pick it up here so the field is
  // pre-filled. (AuthVerifyOtp only receives `onNavigate` as a prop — no
  // initialEmail — so a side-channel is required to pass context.)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const portalEmail = localStorage.getItem('portal_otp_email');
      const portalType = localStorage.getItem('portal_otp_type');
      if (portalEmail && portalType) {
        setEmail(portalEmail);
        setPortalVerification(portalType !== 'canonical-student');
        setCanonicalStudent(portalType === 'canonical-student');
      } else {
        const ctx = (window as any).__aloOtpEmail;
        if (typeof ctx === "string" && ctx) {
          setEmail(ctx);
          (window as any).__aloOtpEmail = undefined;
        }
      }
    }
  }, []);

  // Countdown timer for resend
  React.useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const canResend = countdown <= 0 && !resending;

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (otp.length !== 6) {
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = portalVerification ? "/api/portal-auth/verify-otp" : "/api/auth/verify-otp";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp, type: "email_verification" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Verification failed. Please try again.");
        setLoading(false);
        return;
      }

      setApprovalRequired(Boolean(data.approvalRequired));
      setVerified(true);
      localStorage.removeItem('portal_otp_email');
      localStorage.removeItem('portal_otp_type');
      toast({
        title: "Email verified!",
        description: data.approvalRequired
          ? "Your email is verified. Partner access still requires staff approval."
          : "Your email is verified. You can now sign in.",
      });
      setLoading(false);
    } catch {
      setError("Verification failed. Please check your connection and try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError(null);

    if (!email.trim() || !validateEmail(email)) {
      setError("Please enter a valid email address first.");
      return;
    }

    setResending(true);
    try {
      const endpoint = portalVerification ? "/api/portal-auth/verify-otp" : "/api/auth/verify-otp";
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to resend OTP. Please try again.");
        setResending(false);
        return;
      }

      toast({
        title: "OTP resent",
        description: data?.message || "A new 6-digit code has been sent to your email.",
      });
      setOtp("");
      setCountdown(RESEND_COUNTDOWN);
      setResending(false);
    } catch {
      setError("Failed to resend OTP. Please check your connection and try again.");
      setResending(false);
    }
  };

  // SUCCESS STATE
  if (verified) {
    return (
      <div className="min-h-screen bg-white px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-md">
          <div className="mb-6 text-center">
            <button
              type="button"
              onClick={() => onNavigate("public-home")}
              className="mb-4 inline-flex items-center gap-2"
              aria-label="ALO Education home"
            >
              <div className="alo-shadow flex size-12 items-center justify-center rounded-2xl bg-alo-gradient text-white">
                <Icon name="GraduationCap" className="size-7" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold leading-tight text-[var(--alo-brand)]">ALO Education</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Study Abroad, Done Right
                </p>
              </div>
            </button>
          </div>

          <Card className="rounded-2xl border-2 border-[var(--alo-border)] shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-5 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50">
                  <Icon name="CheckCircle2" className="size-9 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--alo-brand)]">{approvalRequired ? "Email verified — approval pending" : "Email Verified!"}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {approvalRequired
                      ? "Your email address is verified. Partner access remains pending separate staff approval."
                      : "Your email address has been verified successfully. You can now sign in."}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => canonicalStudent ? router.push("/student/login") : onNavigate("auth-login")}
                  className="h-12 w-full bg-[var(--alo-cta)] text-sm font-semibold text-white hover:bg-[var(--alo-cta)]/90"
                >
                  <Icon name="LogIn" className="size-4" />
                  Sign In
                </Button>
                <button
                  type="button"
                  onClick={() => onNavigate("public-home")}
                  className="block w-full text-center text-xs text-muted-foreground hover:underline"
                >
                  Back to home
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // DEFAULT VERIFY FORM
  return (
    <div className="min-h-screen bg-white px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        {/* Logo + Header */}
        <div className="mb-6 text-center">
          <button
            type="button"
            onClick={() => onNavigate("public-home")}
            className="mb-4 inline-flex items-center gap-2"
            aria-label="ALO Education home"
          >
            <div className="alo-shadow flex size-12 items-center justify-center rounded-2xl bg-alo-gradient text-white">
              <Icon name="GraduationCap" className="size-7" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold leading-tight text-[var(--alo-brand)]">ALO Education</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Study Abroad, Done Right
              </p>
            </div>
          </button>
          <h1 className="text-2xl font-bold text-[var(--alo-brand)] sm:text-3xl">Verify Your Email</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the 6-digit code we sent to your email address
          </p>
        </div>

        <Card className="rounded-2xl border-2 border-[var(--alo-border)] shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleVerify} className="space-y-5" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="otp-email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Icon
                    name="Mail"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="otp-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-9"
                    required
                  />
                </div>
                {email && !validateEmail(email) && (
                  <p className="text-xs text-red-600">Please enter a valid email address.</p>
                )}
              </div>

              {/* OTP */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Verification Code
                </Label>
                <div className="flex justify-center pt-1">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(v) => setOtp(v)}
                    containerClassName="justify-center"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="size-12 text-lg first:rounded-l-lg last:rounded-r-lg" />
                      <InputOTPSlot index={1} className="size-12 text-lg" />
                      <InputOTPSlot index={2} className="size-12 text-lg" />
                      <InputOTPSlot index={3} className="size-12 text-lg" />
                      <InputOTPSlot index={4} className="size-12 text-lg" />
                      <InputOTPSlot index={5} className="size-12 text-lg first:rounded-l-lg last:rounded-r-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Code expires in 10 minutes
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  <Icon name="AlertCircle" className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Verify button */}
              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="h-12 w-full bg-[var(--alo-cta)] text-sm font-semibold text-black hover:bg-[var(--alo-cta)]/90 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" className="size-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Icon name="CheckCircle2" className="size-4" />
                    Verify Email
                  </>
                )}
              </Button>

              {/* Resend */}
              <div className="text-center text-sm text-muted-foreground">
                Didn&apos;t receive the code?{" "}
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="font-semibold text-[var(--alo-brand)] hover:underline disabled:opacity-60"
                  >
                    {resending ? "Sending..." : "Resend OTP"}
                  </button>
                ) : (
                  <span className="font-medium text-muted-foreground">
                    Resend in {countdown}s
                  </span>
                )}
              </div>

              {/* Use a different email */}
              <button
                type="button"
                onClick={() => onNavigate("auth-register")}
                className="block w-full text-center text-xs text-muted-foreground hover:underline"
              >
                Use a different email / register again
              </button>
            </form>

            {/* Security note */}
            <div className="mt-6 flex items-start gap-2 rounded-lg bg-[var(--alo-brand-light)]/60 px-3 py-2 text-xs text-[var(--alo-brand)]">
              <Icon name="ShieldCheck" className="mt-0.5 size-3.5 shrink-0" />
              <span>
                OTPs are single-use, expire after 10 minutes, and are audit-logged. Never share
                your code with anyone — ALO Education staff will never ask for it.
              </span>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Badge variant="outline" className="mr-1.5 border-[var(--alo-border)]">
            Email Verification
          </Badge>
          Required for all new accounts. Helps protect against spam and fraud.
        </p>
      </div>
    </div>
  );
}
export default AuthVerifyOtp;
