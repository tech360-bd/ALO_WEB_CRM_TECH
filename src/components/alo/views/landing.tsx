"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/alo/shared";
import {
  COUNTRIES,
  LEAD_SOURCES,
  type ViewKey,
} from "@/lib/alo-types";

interface LandingViewProps {
  onNavigate: (v: ViewKey) => void;
}

const HERO_STATS = [
  { label: "Students Placed", value: "500+", icon: "GraduationCap" },
  { label: "Partner Universities", value: "50+", icon: "Building2" },
  { label: "Visa Success", value: "98%", icon: "Plane" },
  { label: "AI Guidance", value: "24/7", icon: "Bot" },
];

const JOURNEY_STEPS = [
  { label: "Lead", icon: "UserPlus", detail: "Captured from any channel" },
  { label: "Profile", icon: "UserSquare", detail: "11-section student record" },
  { label: "Eligibility", icon: "ClipboardCheck", detail: "AI course matching" },
  { label: "Documents", icon: "FolderLock", detail: "Private & audit-logged" },
  { label: "Application", icon: "FileText", detail: "Submitted to university" },
  { label: "Offer", icon: "Award", detail: "Conditional & unconditional" },
  { label: "CAS", icon: "FileCheck2", detail: "Confirmation of Acceptance" },
  { label: "Visa Interview", icon: "Mic", detail: "AI officer practice" },
  { label: "Visa Decision", icon: "Stamp", detail: "Approval & refusal tracked" },
  { label: "Pre-departure", icon: "Luggage", detail: "Final briefing & enrollment" },
];

const FEATURES = [
  {
    icon: "UserSquare",
    title: "Student Profile",
    desc: "11-section structured profile covering academic, financial, and family background.",
    view: "student-profile" as ViewKey,
  },
  {
    icon: "FolderLock",
    title: "Secure Document Hub",
    desc: "Private, RBAC-protected storage with full audit trails for every upload and approval.",
    view: "document-hub" as ViewKey,
  },
  {
    icon: "ClipboardList",
    title: "Application Pipeline",
    desc: "Track applications across 20 stages — from counseling to final enrollment.",
    view: "applications" as ViewKey,
  },
  {
    icon: "GraduationCap",
    title: "English Mock Test",
    desc: "Practice IELTS, PTE, TOEFL and 14 other tests with scored mock assessments.",
    view: "english-test" as ViewKey,
  },
  {
    icon: "Mic",
    title: "AI Interview Practice",
    desc: "Human-like AI officer trains students for visa, pre-CAS & credibility interviews.",
    view: "ai-interview" as ViewKey,
  },
  {
    icon: "Plane",
    title: "Visa Officer Dashboard",
    desc: "Manage visa cases, document checks, and interview readiness in one workspace.",
    view: "visa" as ViewKey,
  },
  {
    icon: "Users",
    title: "CRM & Student 360",
    desc: "Every lead, contact, document, and interaction in a single unified timeline.",
    view: "crm" as ViewKey,
  },
  {
    icon: "Megaphone",
    title: "Marketing Manager",
    desc: "Campaign ROI, lead source attribution, and counselor performance analytics.",
    view: "marketing" as ViewKey,
  },
  {
    icon: "Bot",
    title: "AI Command Center",
    desc: "18 departments of autonomous agents writing SOPs, matching courses, and scoring.",
    view: "ai-command" as ViewKey,
  },
];

interface LeadFormState {
  fullName: string;
  email: string;
  phone: string;
  altPhone: string;
  source: string;
  preferredCountry: string;
  preferredCourse: string;
  notes: string;
  whatsappConfirm: boolean;
}

const INITIAL_FORM: LeadFormState = {
  fullName: "",
  email: "",
  phone: "",
  altPhone: "",
  source: "WEBSITE",
  preferredCountry: "",
  preferredCourse: "",
  notes: "",
  whatsappConfirm: true,
};

export function LandingView({ onNavigate }: LandingViewProps) {
  const [form, setForm] = React.useState<LeadFormState>(INITIAL_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<
    | null
    | { ok: true; leadId: string; message: string; duplicate: boolean }
    | { ok: false; error: string }
  >(null);

  const leadFormRef = React.useRef<HTMLDivElement>(null);

  const scrollToLeadForm = () => {
    leadFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const update = <K extends keyof LeadFormState>(key: K, value: LeadFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as string]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key as string];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    if (!form.phone.trim()) next.phone = "Mobile number is required";
    else if (!/^[+]?[\d\s-]{6,}$/.test(form.phone.trim()))
      next.phone = "Enter a valid mobile number with country code";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim(),
          altPhone: form.altPhone.trim() || undefined,
          source: form.source,
          preferredCountry: form.preferredCountry || undefined,
          preferredCourse: form.preferredCourse.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, error: data?.error || "Submission failed. Try again." });
      } else {
        setResult({
          ok: true,
          leadId: data.lead?.leadId || "—",
          message: data.message || "Lead submitted successfully.",
          duplicate: !!data.duplicate,
        });
        setForm(INITIAL_FORM);
      }
    } catch {
      setResult({ ok: false, error: "Network error. Please check your connection." });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setForm(INITIAL_FORM);
    setErrors({});
  };

  return (
    <div className="space-y-16 pb-8">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-[#0057B8]/10 bg-alo-hero">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(0,87,184,0.08),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(232,80,26,0.07),transparent_50%)]" />
        <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0057B8]/20 bg-white/80 px-4 py-1.5 text-xs font-semibold text-[#0057B8] backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#E8501A] opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-[#E8501A]" />
              </span>
              Trusted by 500+ Bangladeshi students
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-[#0057B8] sm:text-5xl lg:text-6xl">
              Your Complete Study Abroad Journey,
              <span className="block text-[#E8501A]">From First Hello to Final Visa</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
              ALO Education guides Bangladeshi students through lead capture, profile building,
              course matching, document verification, AI interview practice, and visa preparation
              — all in one system.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                onClick={scrollToLeadForm}
                className="h-12 w-full bg-[#E8501A] px-8 text-base font-semibold text-white hover:bg-[#E8501A]/90 sm:w-auto"
              >
                <Icon name="Rocket" className="size-5" />
                Start Your Application
              </Button>
              <Button
                onClick={() => onNavigate("student-dashboard")}
                variant="outline"
                className="h-12 w-full border-[#0057B8] px-8 text-base font-semibold text-[#0057B8] hover:bg-[#e8f0fb] sm:w-auto"
              >
                <Icon name="Compass" className="size-5" />
                Explore the System
              </Button>
            </div>
          </div>

          {/* Hero stats */}
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {HERO_STATS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-2xl border-2 border-[#0057B8]/15 bg-white/90 p-3 backdrop-blur sm:p-4"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8] sm:size-10">
                  <Icon name={s.icon} className="size-4 sm:size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-black leading-none text-[#0057B8] sm:text-xl">{s.value}</p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground sm:text-xs">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LEAD SOURCES STRIP ===== */}
      <section>
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[#E8501A]">
            Omnichannel Lead Capture
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[#0057B8] sm:text-3xl">
            Leads come from everywhere
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Every enquiry — online, social, walk-in, or referral — funnels into one unified CRM
            so no prospective student ever falls through the cracks.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {LEAD_SOURCES.map((src) => (
            <div
              key={src.value}
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#0057B8]/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0057B8] shadow-sm transition-colors hover:border-[#0057B8]/40 hover:bg-[#e8f0fb] sm:text-sm"
            >
              <Icon name={SOURCE_ICON[src.value] || "Circle"} className="size-3.5" />
              {src.label}
            </div>
          ))}
        </div>
      </section>

      {/* ===== JOURNEY TIMELINE ===== */}
      <section>
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[#E8501A]">End-to-End Workflow</p>
          <h2 className="mt-1 text-2xl font-bold text-[#0057B8] sm:text-3xl">
            From Lead to Visa — One Workflow
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Ten connected stages, every transition logged, every document audited, every milestone
            tracked.
          </p>
        </div>
        <Card className="rounded-2xl border-2 border-[#0057B8]/15 bg-white">
          <CardContent className="pt-6">
            {/* Desktop: horizontal */}
            <div className="hidden lg:block">
              <div className="relative grid grid-cols-10 gap-1">
                {/* connecting line */}
                <div className="absolute left-[5%] right-[5%] top-5 h-0.5 -translate-y-1/2 bg-gradient-to-r from-[#0057B8]/30 via-[#0057B8]/30 to-[#E8501A]/30" />
                {JOURNEY_STEPS.map((step, i) => (
                  <div key={step.label} className="relative flex flex-col items-center text-center">
                    <div
                      className={`relative z-10 flex size-10 items-center justify-center rounded-full text-sm font-black text-white shadow-md ${
                        i === 0
                          ? "bg-[#0057B8]"
                          : i === JOURNEY_STEPS.length - 1
                          ? "bg-[#E8501A]"
                          : "bg-[#0057B8]/80"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <p className="mt-2 text-xs font-bold text-[#0057B8]">{step.label}</p>
                    <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                      {step.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {/* Mobile / tablet: vertical */}
            <div className="space-y-3 lg:hidden">
              {JOURNEY_STEPS.map((step, i) => (
                <div key={step.label} className="relative flex gap-3 pb-3">
                  {/* vertical connector */}
                  {i < JOURNEY_STEPS.length - 1 && (
                    <div className="absolute left-5 top-10 h-[calc(100%-1.5rem)] w-0.5 bg-[#0057B8]/20" />
                  )}
                  <div
                    className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-md ${
                      i === 0
                        ? "bg-[#0057B8]"
                        : i === JOURNEY_STEPS.length - 1
                        ? "bg-[#E8501A]"
                        : "bg-[#0057B8]/80"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <Icon name={step.icon} className="size-4 text-[#0057B8]" />
                      <p className="text-sm font-bold text-[#0057B8]">{step.label}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section>
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[#E8501A]">Platform Capabilities</p>
          <h2 className="mt-1 text-2xl font-bold text-[#0057B8] sm:text-3xl">
            One system for the entire journey
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Click any module below to step inside and see how ALO Education works end to end.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <button
              key={f.title}
              onClick={() => onNavigate(f.view)}
              className="group flex h-full flex-col rounded-2xl border-2 border-[#0057B8]/20 bg-white p-6 text-left transition-all hover:-translate-y-0.5 hover:border-[#0057B8] hover:shadow-lg"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e8f0fb] text-[#0057B8] transition-colors group-hover:bg-[#0057B8] group-hover:text-white">
                <Icon name={f.icon} className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#0057B8]">{f.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{f.desc}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#E8501A]">
                Explore module
                <Icon
                  name="ArrowRight"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ===== LEAD CAPTURE FORM ===== */}
      <section ref={leadFormRef} id="lead-form" className="scroll-mt-20">
        <Card className="overflow-hidden rounded-3xl border-2 border-[#0057B8]/15 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Left info panel */}
            <div className="bg-alo-gradient p-6 text-white sm:p-8 lg:col-span-2">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Icon name="UserPlus" className="size-6" />
              </div>
              <h2 className="mt-5 text-2xl font-black leading-tight sm:text-3xl">
                Start your journey in 60 seconds
              </h2>
              <p className="mt-3 text-sm text-white/85">
                Fill in the form and a dedicated counselor will reach out within 24 hours with a
                personalised shortlist of universities, courses, and a clear roadmap.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  { icon: "ShieldCheck", text: "RBAC-protected — only authorised staff see your data" },
                  { icon: "MessageSquare", text: "WhatsApp & SMS confirmation sent automatically" },
                  { icon: "Route", text: "Personalised roadmap to offer letter & visa" },
                  { icon: "Bot", text: "AI assistant available 24/7 inside your portal" },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                      <Icon name={item.icon} className="size-4" />
                    </div>
                    <span className="pt-0.5 text-white/90">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right form panel */}
            <div className="p-6 sm:p-8 lg:col-span-3">
              {result?.ok ? (
                <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                  <div
                    className={`flex size-16 items-center justify-center rounded-full ${
                      result.duplicate ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    <Icon
                      name={result.duplicate ? "AlertTriangle" : "CheckCircle2"}
                      className="size-9"
                    />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-[#0057B8]">
                    {result.duplicate ? "We already have your details" : "Welcome aboard!"}
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">{result.message}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-[#0057B8]/15 bg-[#e8f0fb] px-4 py-2 text-sm font-semibold text-[#0057B8]">
                    <Icon name="Hash" className="size-4" />
                    Lead ID: <span className="font-mono">{result.leadId}</span>
                  </div>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() => onNavigate("student-dashboard")}
                      variant="outline"
                      className="h-11 border-[#0057B8] text-[#0057B8] hover:bg-[#e8f0fb]"
                    >
                      <Icon name="LayoutDashboard" className="size-4" />
                      Open Student Dashboard
                    </Button>
                    <Button onClick={resetForm} variant="ghost" className="h-11">
                      Submit another lead
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Icon name="FileText" className="size-5 text-[#0057B8]" />
                    <h3 className="text-lg font-bold text-[#0057B8]">Lead Capture Form</h3>
                  </div>

                  {result?.ok === false && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      <Icon name="AlertCircle" className="mt-0.5 size-4 shrink-0" />
                      <span>{result.error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-sm font-semibold text-[#0057B8]">
                        Full Name <span className="text-[#E8501A]">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        value={form.fullName}
                        onChange={(e) => update("fullName", e.target.value)}
                        placeholder="e.g. Tanvir Ahmed"
                        className={inputCls(errors.fullName)}
                        disabled={submitting}
                      />
                      {errors.fullName && <FieldError msg={errors.fullName} />}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-semibold text-[#0057B8]">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        placeholder="you@example.com"
                        className={inputCls(errors.email)}
                        disabled={submitting}
                      />
                      {errors.email && <FieldError msg={errors.email} />}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-semibold text-[#0057B8]">
                        Mobile (with country code) <span className="text-[#E8501A]">*</span>
                      </Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="+880 17XX-XXXXXX"
                        className={inputCls(errors.phone)}
                        disabled={submitting}
                      />
                      {errors.phone && <FieldError msg={errors.phone} />}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="altPhone" className="text-sm font-semibold text-[#0057B8]">
                        Alternative Mobile
                      </Label>
                      <Input
                        id="altPhone"
                        value={form.altPhone}
                        onChange={(e) => update("altPhone", e.target.value)}
                        placeholder="Optional guardian / backup number"
                        className="h-11"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-[#0057B8]">Lead Source</Label>
                      <Select
                        value={form.source}
                        onValueChange={(v) => update("source", v)}
                        disabled={submitting}
                      >
                        <SelectTrigger className="h-11 w-full border-[#0057B8]/20 focus:ring-[#0057B8]/30">
                          <SelectValue placeholder="How did you hear about us?" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_SOURCES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-[#0057B8]">
                        Preferred Destination
                      </Label>
                      <Select
                        value={form.preferredCountry}
                        onValueChange={(v) => update("preferredCountry", v)}
                        disabled={submitting}
                      >
                        <SelectTrigger className="h-11 w-full border-[#0057B8]/20 focus:ring-[#0057B8]/30">
                          <SelectValue placeholder="Choose a country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="preferredCourse" className="text-sm font-semibold text-[#0057B8]">
                      Preferred Course / Field
                    </Label>
                    <Input
                      id="preferredCourse"
                      value={form.preferredCourse}
                      onChange={(e) => update("preferredCourse", e.target.value)}
                      placeholder="e.g. MSc Computer Science, MBA, BBA..."
                      className="h-11"
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-sm font-semibold text-[#0057B8]">
                      Notes (optional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      placeholder="Tell us about your study plans, intake preference, budget, scholarships..."
                      className="min-h-[88px] border-[#0057B8]/20 focus:ring-[#0057B8]/30"
                      disabled={submitting}
                    />
                  </div>

                  <label
                    htmlFor="whatsappConfirm"
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-[#0057B8]/15 bg-[#e8f0fb]/40 px-3 py-2.5"
                  >
                    <Checkbox
                      id="whatsappConfirm"
                      checked={form.whatsappConfirm}
                      onCheckedChange={(v) => update("whatsappConfirm", v === true)}
                      className="border-[#0057B8]/40 data-[state=checked]:bg-[#0057B8] data-[state=checked]:border-[#0057B8]"
                      disabled={submitting}
                    />
                    <span className="text-sm text-foreground">
                      <span className="font-semibold">Send me WhatsApp confirmation</span>
                      <span className="block text-xs text-muted-foreground">
                        We&apos;ll confirm receipt and share next steps via WhatsApp.
                      </span>
                    </span>
                  </label>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-12 w-full bg-[#E8501A] text-base font-semibold text-white hover:bg-[#E8501A]/90"
                  >
                    {submitting ? (
                      <>
                        <Icon name="Loader2" className="size-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Icon name="Send" className="size-5" />
                        Submit Lead &amp; Start Journey
                      </>
                    )}
                  </Button>

                  <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                    <Icon name="ShieldCheck" className="size-3.5 text-[#0057B8]" />
                    Your data is private &amp; secure. RBAC protected. Audit-logged.
                  </p>
                </form>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* ===== FOOTER CTA ===== */}
      <section>
        <Card className="overflow-hidden rounded-3xl border-2 border-[#0057B8]/15 bg-white">
          <CardContent className="relative overflow-hidden px-6 py-10 sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[#E8501A]/10" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 size-48 rounded-full bg-[#0057B8]/10" />
            <div className="relative flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
              <div>
                <h2 className="text-2xl font-black text-[#0057B8] sm:text-3xl">Ready to begin?</h2>
                <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                  Submit your details once and unlock the full ALO Education experience —
                  documents, applications, mock tests, and AI interview practice, all in one place.
                </p>
              </div>
              <Button
                onClick={scrollToLeadForm}
                className="h-12 shrink-0 bg-[#E8501A] px-8 text-base font-semibold text-white hover:bg-[#E8501A]/90"
              >
                <Icon name="ArrowUp" className="size-5" />
                Submit Your Lead
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

const SOURCE_ICON: Record<string, string> = {
  WEBSITE: "Globe",
  WHATSAPP: "MessageCircle",
  SMS: "MessageSquare",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  PHONE_CALL: "Phone",
  PARTNER_REFERRAL: "Handshake",
  OFFICE_VISIT: "Building2",
  EVENT: "CalendarDays",
  MOCK_TEST: "ClipboardCheck",
};

function inputCls(err?: string) {
  return `h-11 ${err ? "border-red-400 focus-visible:ring-red-200" : "border-[#0057B8]/20 focus:ring-[#0057B8]/30"}`;
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1 text-xs font-medium text-red-600">
      <Icon name="AlertCircle" className="size-3" />
      {msg}
    </p>
  );
}
export default LandingView;
