"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";
import type { ViewKey } from "@/lib/alo-types";

interface AuthLoginProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

const ROLE_DASHBOARDS: Record<string, ViewKey> = {
  SUPER_ADMIN: "super-admin-dashboard",
  ADMIN: "crm",
  COUNSELOR: "counselor-dashboard",
  STUDENT: "student-dashboard",
  PARTNER: "partner-admin-dashboard",
  VISA_OFFICER: "visa",
  VISA_INTERVIEW_OFFICER: "visa",
  MARKETING_MANAGER: "marketing",
  MARKETING: "marketing",
  FINANCE: "finance-dashboard",
  HR_MANAGER: "hrm-dashboard",
  APPLICATION_TEAM: "application-team",
  ENGLISH_TRAINER: "english-test-dashboard",
  MOCK_TEST_ADMIN: "english-test-dashboard",
  BRANCH_MANAGER: "crm",
  FRONT_DESK: "crm",
};

const PORTAL_LINKS = [
  { label: "Student Portal", view: "student-dashboard" as ViewKey, icon: "GraduationCap", description: "Track your applications, documents, and visa progress" },
  { label: "Partner Portal", view: "partner-admin-dashboard" as ViewKey, icon: "Handshake", description: "Manage your seats, students, and marketing" },
  { label: "Employee Portal", view: "crm" as ViewKey, icon: "Briefcase", description: "CRM, counselor tools, and operations" },
];

export function AuthLogin({ onNavigate }: AuthLoginProps) {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError(
          "Invalid email or password. If your account is new, it may be pending ALO Education approval."
        );
        setLoading(false);
        return;
      }

      // Fetch session to determine role
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.role) {
        const dashboard =
          ROLE_DASHBOARDS[session.user.role as string] || "student-dashboard";
        toast({
          title: "Login successful",
          description: `Welcome back, ${session.user.name || "User"}!`,
        });
        onNavigate(dashboard);
      } else {
        setError("Unable to determine your account role. Please contact ALO Education support.");
        setLoading(false);
      }
    } catch {
      setError("Login failed. Please check your connection and try again.");
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
              <p className="text-lg font-bold leading-tight text-[#0057B8]">ALO Education</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Study Abroad, Done Right
              </p>
            </div>
          </button>
          <h1 className="text-2xl font-bold text-[#0057B8] sm:text-3xl">Welcome Back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to continue your study abroad journey
          </p>
        </div>

        {/* Login Card */}
        <Card className="rounded-2xl border-2 border-[#E2E8F0] shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Icon
                    name="Mail"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="login-email"
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

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => onNavigate("auth-reset-password")}
                    className="text-xs font-medium text-[#0057B8] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Icon
                    name="Lock"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-9 pr-10"
                    required
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

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember-me"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(!!v)}
                />
                <Label htmlFor="remember-me" className="cursor-pointer text-sm text-muted-foreground">
                  Keep me signed in for 30 days
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

              {/* Sign In */}
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full bg-[#E8501A] text-sm font-semibold text-white hover:bg-[#E8501A]/90 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Icon name="LogIn" className="size-4" />
                    Sign In
                  </>
                )}
              </Button>

              {/* Register */}
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => onNavigate("auth-register")}
                  className="font-semibold text-[#0057B8] hover:underline"
                >
                  Register
                </button>
              </p>
            </form>


            {/* Security note */}
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-[#e8f0fb]/60 px-3 py-2 text-xs text-[#0057B8]">
              <Icon name="ShieldCheck" className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Your password is encrypted with bcrypt. All logins are audit-logged for security.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Portal links */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PORTAL_LINKS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onNavigate(p.view)}
              className="group rounded-2xl border-2 border-[#E2E8F0] bg-white p-4 text-left transition-all hover:border-[#0057B8]/40 hover:shadow-sm"
            >
              <div className="mb-2.5 flex size-9 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
                <Icon name={p.icon} className="size-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">{p.label}</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{p.description}</p>
            </button>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to ALO Education&apos;s{" "}
          <button
            type="button"
            onClick={() => onNavigate("public-home")}
            className="text-[#0057B8] hover:underline"
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            type="button"
            onClick={() => onNavigate("public-home")}
            className="text-[#0057B8] hover:underline"
          >
            Privacy Policy
          </button>
          .
        </p>
      </div>
    </div>
  );
}
export default AuthLogin;
