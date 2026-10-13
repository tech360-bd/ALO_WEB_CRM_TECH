"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, Sparkles, Loader2, GraduationCap, CheckCircle2 } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: (role: string) => void;
}

export default function AuthModal({ open, onClose, onLoginSuccess }: AuthModalProps) {
  const { data: session, status } = useSession();
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const result = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        setLoginError("Invalid email or password. Please try again.");
      } else {
        // Wait for session to update
        setTimeout(() => {
          const role = (session?.user as any)?.role || "STUDENT";
          onLoginSuccess(role);
          onClose();
          resetForms();
        }, 500);
      }
    } catch {
      setLoginError("An error occurred. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegisterError("Name, email, and password are required.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegisterError("Passwords do not match.");
      return;
    }

    if (regPassword.length < 6) {
      setRegisterError("Password must be at least 6 characters.");
      return;
    }

    setRegisterLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim() || undefined,
          password: regPassword,
          role: "STUDENT",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRegisterError(data.error || "Registration failed. Please try again.");
        return;
      }

      setRegisterSuccess(data.message || "Registration successful! Please check your email for verification.");
      setRegName("");
      setRegEmail("");
      setRegPhone("");
      setRegPassword("");
      setRegConfirmPassword("");
    } catch {
      setRegisterError("Network error. Please try again.");
    } finally {
      setRegisterLoading(false);
    }
  };

  const resetForms = () => {
    setLoginEmail("");
    setLoginPassword("");
    setLoginError("");
    setRegisterError("");
    setRegisterSuccess("");
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      onClose();
      resetForms();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-0 shadow-2xl">
        {/* Header with brand gradient */}
        <div className="relative bg-gradient-to-br from-[#F37021] via-[#F37021] to-[#E85D10] px-6 pt-8 pb-10 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 blur-xl" />
          </div>
          <div className="relative flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3"
            >
              <GraduationCap className="w-8 h-8 text-white" />
            </motion.div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">
                Welcome to ALO
              </DialogTitle>
              <DialogDescription className="text-white/80 text-sm mt-1">
                Your gateway to world-class education
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Tabs area */}
        <div className="px-6 pb-6 -mt-5">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-12 bg-slate-100 rounded-xl p-1">
              <TabsTrigger
                value="login"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#F37021] font-semibold text-sm transition-all"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#F37021] font-semibold text-sm transition-all"
              >
                Create Account
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="mt-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <AnimatePresence mode="wait">
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {loginError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium text-slate-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="pl-10 h-11 border-slate-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                      disabled={loginLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 h-11 border-slate-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                      disabled={loginLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-11 bg-[#F37021] hover:bg-[#E85D10] text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#F37021]/25"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <p className="text-center text-xs text-slate-400 mt-3">
                  By signing in, you agree to ALO&apos;s Terms of Service
                </p>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="mt-5">
              <form onSubmit={handleRegister} className="space-y-3">
                <AnimatePresence mode="wait">
                  {registerError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {registerError}
                    </motion.div>
                  )}
                  {registerSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {registerSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-name" className="text-sm font-medium text-slate-700">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Your full name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      className="pl-10 h-11 border-slate-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                      disabled={registerLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-email" className="text-sm font-medium text-slate-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="pl-10 h-11 border-slate-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                      disabled={registerLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-phone" className="text-sm font-medium text-slate-700">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="reg-phone"
                      type="tel"
                      placeholder="+880 1XXX-XXXXXX"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="pl-10 h-11 border-slate-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                      disabled={registerLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-password" className="text-sm font-medium text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 h-11 border-slate-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                      disabled={registerLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-confirm" className="text-sm font-medium text-slate-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="reg-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 h-11 border-slate-200 focus:border-[#F37021] focus:ring-[#F37021]/20"
                      disabled={registerLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full h-11 bg-[#0066CC] hover:bg-[#0055AA] text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#0066CC]/25 mt-2"
                >
                  {registerLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-slate-400 mt-2">
                  By creating an account, you agree to ALO&apos;s Terms of Service & Privacy Policy
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
