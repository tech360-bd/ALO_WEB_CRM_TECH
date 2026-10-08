"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";
import type { ViewKey } from "@/lib/alo-types";

interface AuthResetPasswordProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

type Step = "request" | "reset" | "success";

export function AuthResetPassword({ onNavigate }: AuthResetPasswordProps) {
  const { toast } = useToast();
  const [step, setStep] = React.useState<Step>("request");

  // Request state
  const [email, setEmail] = React.useState("");
  const [requesting, setRequesting] = React.useState(false);

  // Reset state
  const [token, setToken] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [devToken, setDevToken] = React.useState<string | null>(null);
  const [devCopied, setDevCopied] = React.useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setRequesting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to send reset link. Please try again.");
        setRequesting(false);
        return;
      }

      // Move to reset step
      setStep("reset");
      toast({
        title: "Reset link generated",
        description: data?.message || "If an account exists, a reset link has been sent.",
      });

      if (data?.resetToken) {
        // Dev only — surface the token so user can paste it
        setDevToken(data.resetToken);
        setToken(data.resetToken);
        toast({
          title: "Dev mode",
          description: "Reset token auto-filled (dev only).",
        });
      }
      setRequesting(false);
    } catch {
      setError("Request failed. Please check your connection and try again.");
      setRequesting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError("Please enter the reset token from your email.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setResetting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Password reset failed. Please try again.");
        setResetting(false);
        return;
      }

      setStep("success");
      toast({
        title: "Password reset successful",
        description: "You can now sign in with your new password.",
      });
      setResetting(false);
    } catch {
      setError("Reset failed. Please check your connection and try again.");
      setResetting(false);
    }
  };

  const copyToken = async () => {
    if (!devToken) return;
    try {
      await navigator.clipboard.writeText(devToken);
      setDevCopied(true);
      setTimeout(() => setDevCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy the token manually." });
    }
  };

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
              <p className="text-lg font-bold leading-tight text-[#2563EB]">ALO Education</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Study Abroad, Done Right
              </p>
            </div>
          </button>
          <h1 className="text-2xl font-bold text-[#2563EB] sm:text-3xl">Reset Your Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "request" && "Enter your email to receive a reset link"}
            {step === "reset" && "Enter your reset token and new password"}
            {step === "success" && "Your password has been updated successfully"}
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <StepDot active={step === "request"} done={step !== "request"} label="1" />
          <div className={`h-0.5 w-8 ${step !== "request" ? "bg-[#2563EB]" : "bg-[#E2E8F0]"}`} />
          <StepDot active={step === "reset"} done={step === "success"} label="2" />
          <div className={`h-0.5 w-8 ${step === "success" ? "bg-[#2563EB]" : "bg-[#E2E8F0]"}`} />
          <StepDot active={step === "success"} done={step === "success"} label="3" />
        </div>

        {/* Card */}
        <Card className="rounded-2xl border-2 border-[#E2E8F0] shadow-sm">
          <CardContent className="pt-6">
            {/* STEP 1 — Request reset */}
            {step === "request" && (
              <form onSubmit={handleRequest} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Icon
                      name="Mail"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 pl-9"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                  >
                    <Icon name="AlertCircle" className="mt-0.5 size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={requesting}
                  className="h-12 w-full bg-[#F97316] text-sm font-semibold text-white hover:bg-[#F97316]/90 disabled:opacity-60"
                >
                  {requesting ? (
                    <>
                      <Icon name="Loader2" className="size-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      <Icon name="Send" className="size-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Remembered your password?{" "}
                  <button
                    type="button"
                    onClick={() => onNavigate("auth-login")}
                    className="font-semibold text-[#2563EB] hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            )}

            {/* STEP 2 — Reset password */}
            {step === "reset" && (
              <form onSubmit={handleReset} className="space-y-4" noValidate>
                {/* Dev token notice */}
                {devToken && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Icon name="FlaskConical" className="size-3.5" />
                      Dev mode — token auto-filled
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-white px-2 py-1 font-mono text-[11px] text-amber-900">
                        {devToken}
                      </code>
                      <button
                        type="button"
                        onClick={copyToken}
                        className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
                      >
                        {devCopied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Token (hidden if dev prefilled, but allow editing) */}
                <div className="space-y-1.5">
                  <Label htmlFor="reset-token" className="text-sm font-medium text-foreground">
                    Reset Token
                  </Label>
                  <div className="relative">
                    <Icon
                      name="KeyRound"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="reset-token"
                      type="text"
                      placeholder="Paste the token from your email"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="h-11 pl-9 font-mono text-xs"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Check your email inbox (and spam folder) for the reset link.
                  </p>
                </div>

                {/* New password */}
                <div className="space-y-1.5">
                  <Label htmlFor="reset-new-password" className="text-sm font-medium text-foreground">
                    New Password
                  </Label>
                  <div className="relative">
                    <Icon
                      name="Lock"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="reset-new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-11 pl-9 pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <Icon name={showPassword ? "EyeOff" : "Eye"} className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="reset-confirm-password"
                    className="text-sm font-medium text-foreground"
                  >
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Icon
                      name="LockKeyhole"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="reset-confirm-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 pl-9"
                      required
                    />
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-600">Passwords do not match.</p>
                  )}
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                  >
                    <Icon name="AlertCircle" className="mt-0.5 size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={resetting}
                  className="h-12 w-full bg-[#F97316] text-sm font-semibold text-white hover:bg-[#F97316]/90 disabled:opacity-60"
                >
                  {resetting ? (
                    <>
                      <Icon name="Loader2" className="size-4 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    <>
                      <Icon name="KeyRound" className="size-4" />
                      Reset Password
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setError(null);
                    setToken("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setDevToken(null);
                  }}
                  className="block w-full text-center text-xs text-muted-foreground hover:underline"
                >
                  Use a different email
                </button>
              </form>
            )}

            {/* STEP 3 — Success */}
            {step === "success" && (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50">
                  <Icon name="CheckCircle2" className="size-9 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Password Reset Successful</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your password has been updated. You can now sign in with your new password.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => onNavigate("auth-login")}
                  className="h-12 w-full bg-[#F97316] text-sm font-semibold text-white hover:bg-[#F97316]/90"
                >
                  <Icon name="LogIn" className="size-4" />
                  Sign In
                </Button>
              </div>
            )}

            {/* Security note */}
            {step !== "success" && (
              <div className="mt-6 flex items-start gap-2 rounded-lg bg-[#e8f0fb]/60 px-3 py-2 text-xs text-[#2563EB]">
                <Icon name="ShieldCheck" className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Reset tokens are single-use, hashed (SHA-256), and expire after 1 hour. All
                  password resets are audit-logged.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Badge variant="outline" className="mr-1.5 border-[#E2E8F0]">
            Security
          </Badge>
          We never store passwords in plain text. If you didn&apos;t request this reset, you can
          safely ignore the email.
        </p>
      </div>
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div
      className={`flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
        done
          ? "border-[#2563EB] bg-[#2563EB] text-white"
          : active
            ? "border-[#2563EB] bg-white text-[#2563EB]"
            : "border-[#E2E8F0] bg-white text-muted-foreground"
      }`}
      aria-label={`Step ${label}`}
    >
      {done ? <Icon name="Check" className="size-4" /> : label}
    </div>
  );
}
export default AuthResetPassword;
