"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";
import type { ViewKey } from "@/lib/alo-types";

interface AuthRegisterProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

type Role = "STUDENT" | "PARTNER";

const PASSWORD_STRENGTH = [
  { label: "Weak", color: "bg-red-500", min: 0 },
  { label: "Fair", color: "bg-amber-500", min: 8 },
  { label: "Good", color: "bg-sky-500", min: 10 },
  { label: "Strong", color: "bg-emerald-500", min: 12 },
];

function scorePassword(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

export function AuthRegister({ onNavigate }: AuthRegisterProps) {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("STUDENT");
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pwScore = scorePassword(password);

  const validate = (): string | null => {
    if (!name.trim()) return "Please enter your full name.";
    if (name.trim().length < 3) return "Name must be at least 3 characters.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return "Please enter your email address.";
    if (!emailRegex.test(email.trim())) return "Please enter a valid email address.";
    if (phone && !/^[+\d\s()-]{6,20}$/.test(phone.trim())) {
      return "Please enter a valid phone number.";
    }
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (confirmPassword !== password) return "Passwords do not match.";
    if (!agreeTerms) return "Please agree to the Terms of Service and Privacy Policy.";
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          phone: phone.trim() || undefined,
          termsAccepted: agreeTerms,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Success — navigate to OTP verification, passing email as slug context
      toast({
        title: role === "PARTNER" ? "Application submitted" : "Account created",
        description:
          role === "PARTNER"
            ? "Partner account pending ALO Education approval. Verify your email to complete the request."
            : "Verify your email to activate your account.",
      });

      if (data?.otp) {
        // Dev only — surface OTP so the user can verify
        toast({
          title: "Dev OTP",
          description: `Your verification code is ${data.otp}`,
        });
      }

      // Stash the email on the window so AuthVerifyOtp can pre-fill it
      // (the verify view only receives onNavigate as a prop — no slug prop —
      // so we use a side-channel. The slug param below is a backup.)
      if (typeof window !== "undefined") {
        (window as any).__aloOtpEmail = email.trim().toLowerCase();
      }

      onNavigate("auth-verify-otp", email.trim().toLowerCase());
    } catch {
      setError("Registration failed. Please check your connection and try again.");
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-[#2563EB] sm:text-3xl">Create Your Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join ALO Education to start your study abroad journey
          </p>
        </div>

        {/* Register Card */}
        <Card className="rounded-2xl border-2 border-[#E2E8F0] shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              {/* Role selector */}
              <div className="space-y-1.5">
                <Label htmlFor="register-role" className="text-sm font-medium text-foreground">
                  I am registering as a
                </Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger id="register-role" className="h-11">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">
                      <span className="flex items-center gap-2">
                        <Icon name="GraduationCap" className="size-4 text-[#2563EB]" />
                        Student
                      </span>
                    </SelectItem>
                    <SelectItem value="PARTNER">
                      <span className="flex items-center gap-2">
                        <Icon name="Handshake" className="size-4 text-[#2563EB]" />
                        Partner / Agency
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Employees are created by Super Admin only. Contact ALO Education if you need an
                  employee account.
                </p>
              </div>

              {/* Partner notice */}
              {role === "PARTNER" && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  <Icon name="Info" className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    Partner accounts require ALO Education approval before activation. You will
                    receive an email once your application is reviewed.
                  </span>
                </div>
              )}

              {/* Full name */}
              <div className="space-y-1.5">
                <Label htmlFor="register-name" className="text-sm font-medium text-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <Icon
                    name="User"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="register-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Taslima Akter"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 pl-9"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="register-email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Icon
                    name="Mail"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="register-email"
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

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="register-phone" className="text-sm font-medium text-foreground">
                  Phone <span className="text-muted-foreground">(optional)</span>
                </Label>
                <div className="relative">
                  <Icon
                    name="Phone"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="register-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+8801805020100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 pl-9"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="register-password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Icon
                    name="Lock"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {/* Strength meter */}
                {password && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all ${PASSWORD_STRENGTH[pwScore - 1]?.color || "bg-muted"}`}
                        style={{ width: `${(pwScore / 4) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {PASSWORD_STRENGTH[pwScore - 1]?.label || "Too short"}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="register-confirm-password"
                  className="text-sm font-medium text-foreground"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Icon
                    name="LockKeyhole"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="register-confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 pl-9"
                    required
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-red-600">Passwords do not match.</p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="agree-terms"
                  checked={agreeTerms}
                  onCheckedChange={(v) => setAgreeTerms(!!v)}
                  className="mt-0.5"
                />
                <Label htmlFor="agree-terms" className="cursor-pointer text-sm text-muted-foreground">
                  I agree to ALO Education&apos;s{" "}
                  <button
                    type="button"
                    onClick={() => onNavigate("public-home")}
                    className="font-medium text-[#2563EB] hover:underline"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => onNavigate("public-home")}
                    className="font-medium text-[#2563EB] hover:underline"
                  >
                    Privacy Policy
                  </button>
                  . All account actions are audit-logged.
                </Label>
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

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full bg-[#F97316] text-sm font-semibold text-white hover:bg-[#F97316]/90 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" className="size-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <Icon name="UserPlus" className="size-4" />
                    Create Account
                  </>
                )}
              </Button>

              {/* Sign in link */}
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => onNavigate("auth-login")}
                  className="font-semibold text-[#2563EB] hover:underline"
                >
                  Sign In
                </button>
              </p>
            </form>

            {/* Security note */}
            <div className="mt-6 flex items-start gap-2 rounded-lg bg-[#e8f0fb]/60 px-3 py-2 text-xs text-[#2563EB]">
              <Icon name="ShieldCheck" className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Your password is bcrypt-hashed (12 rounds). Email verification required. All
                registration actions are audit-logged.
              </span>
            </div>

            {/* What happens next */}
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <Icon name="MailCheck" className="mt-0.5 size-3.5 shrink-0" />
              <span>
                After registration, you will receive a 6-digit OTP at your email. Enter it on the
                next screen to activate your account.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Badge variant="outline" className="mr-1.5 border-[#E2E8F0]">
            RBAC
          </Badge>
          All accounts are subject to ALO Education&apos;s role-based access control policy.
        </p>
      </div>
    </div>
  );
}
export default AuthRegister;
