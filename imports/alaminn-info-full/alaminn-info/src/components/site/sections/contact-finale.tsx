"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Send,
  ShieldCheck,
  Mail,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  Tag,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { INQUIRY_TYPES } from "@/lib/site-data";
import { captureUtmParams, type UtmParams } from "@/lib/utm";

type FormState = {
  type: string;
  fullName: string;
  organization: string;
  role: string;
  email: string;
  phone: string;
  whatsapp: string;
  country: string;
  city: string;
  preferredChannel: string;
  currentChallenge: string;
  desiredOutcome: string;
  timeline: string;
  scope: string;
  existingSystem: string;
  preferredTime: string;
  notes: string;
  privacyConsent: boolean;
  commsConsent: boolean;
  marketingConsent: boolean;
  studentDataConsent: boolean;
};

const STEPS = ["Inquiry Type", "Contact", "Details", "Consent"];

export function ContactFinale() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // UTM / referral params captured from the URL on mount (client-only).
  const [utm, setUtm] = useState<UtmParams>({});
  useEffect(() => {
    setUtm(captureUtmParams());
  }, []);
  const [form, setForm] = useState<FormState>({
    type: "",
    fullName: "",
    organization: "",
    role: "",
    email: "",
    phone: "",
    whatsapp: "",
    country: "",
    city: "",
    preferredChannel: "email",
    currentChallenge: "",
    desiredOutcome: "",
    timeline: "",
    scope: "",
    existingSystem: "",
    preferredTime: "",
    notes: "",
    privacyConsent: false,
    commsConsent: false,
    marketingConsent: false,
    studentDataConsent: false,
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validateStep = (s: number): string | null => {
    if (s === 0 && !form.type) return "Please select an inquiry type.";
    if (s === 1) {
      if (!form.fullName.trim()) return "Full name is required.";
      if (!form.email.trim()) return "Work email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address.";
    }
    if (s === 3) {
      if (!form.privacyConsent) return "Privacy consent is required.";
      if (!form.commsConsent) return "Communication consent is required.";
      if (form.type === "student-referral" && !form.studentDataConsent)
        return "Student-data transfer consent is required for referrals.";
    }
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    const err = validateStep(3);
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // Refresh UTM capture at submit time in case the URL changed (e.g. SPA nav).
      const utmNow = captureUtmParams();
      const res = await fetch("/api/v1/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          utmSource: utmNow.utmSource,
          utmMedium: utmNow.utmMedium,
          utmCampaign: utmNow.utmCampaign,
          utmContent: utmNow.utmContent,
          utmTerm: utmNow.utmTerm,
          referralSource: utmNow.referralSource,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Submission failed.");
      }
      setReference(data.data?.reference || "—");
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyRef = () => {
    navigator.clipboard?.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="contact" className="relative overflow-hidden bg-ink-950 px-4 py-16 text-white sm:px-6 sm:py-20 lg:py-24">
      {/* controlled orange-blue light field */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 18% 12%, rgba(11,99,206,0.32), transparent 42%), radial-gradient(circle at 82% 8%, rgba(242,97,19,0.26), transparent 38%), radial-gradient(circle at 50% 110%, rgba(242,97,19,0.14), transparent 50%)",
        }}
      />
      <div className="absolute inset-0 grid-bg opacity-20" />

      <div className="relative mx-auto max-w-[1320px]">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 node-active" />
            Conversion Finale
          </div>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-tight text-white text-balance">
            Build the structure your next stage of{" "}
            <span className="text-grad-momentum">growth requires</span>.
          </h2>
          <p className="mt-4 text-base text-blue-100">
            Start a strategic conversation. Multi-step, validated, consent-controlled.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
            {/* Progress bar */}
            <div className="border-b border-white/10 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                {STEPS.map((label, i) => (
                  <div key={label} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "inline-flex h-9 w-9 items-center justify-center rounded-full border-2 font-display text-xs font-extrabold transition-all duration-300",
                          i < step && "border-emerald-400 bg-emerald-500 text-white scale-100",
                          i === step && "border-orange-400 bg-orange-500 text-white shadow-orange animate-step-glow scale-110",
                          i > step && "border-white/20 text-blue-200 scale-100"
                        )}
                      >
                        {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </div>
                      <span
                        className={cn(
                          "mt-1.5 text-[10px] font-semibold uppercase tracking-wider",
                          i === step ? "text-orange-300" : "text-blue-200"
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="mx-2 h-0.5 flex-1 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-blue-500 transition-all duration-500"
                          style={{ width: i < step ? "100%" : "0%" }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (submitted) return;
                  if (step < STEPS.length - 1) next();
                  else submit();
                }}
                aria-label="Multi-step inquiry form"
              >
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <div className="relative mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 animate-check-expand">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-extrabold text-white">
                      Inquiry received
                    </h3>
                    <p className="mt-2 text-sm text-blue-100">
                      Thank you. Your inquiry has been logged and routed securely.
                    </p>

                    <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">
                        Inquiry reference
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-2">
                        <span className="font-display text-lg font-extrabold tracking-wider text-orange-300">
                          {reference}
                        </span>
                        <button
                          onClick={copyRef}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-blue-200 hover:bg-white/10"
                          aria-label="Copy reference"
                        >
                          {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="mt-4 space-y-1.5 text-left text-xs text-blue-100">
                        <Row label="Expected next step" value="Acknowledgement within one business day" />
                        <Row label="Communication method" value={form.preferredChannel} />
                        <Row label="Email confirmation" value="Sent to provided address" />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <a
                        href="#home"
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10"
                      >
                        Return to homepage
                      </a>
                      <a
                        href="#resources"
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-orange hover:bg-orange-700"
                      >
                        Relevant resource
                      </a>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -24, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                  >
                    {/* Step 0: Inquiry type */}
                    {step === 0 && (
                      <div>
                        <StepTitle
                          title="What kind of conversation?"
                          desc="Select the inquiry type that best matches your goal."
                        />
                        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {INQUIRY_TYPES.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => set("type", t.id)}
                              className={cn(
                                "rounded-xl border px-3 py-3 text-left text-xs font-semibold transition-all duration-200",
                                form.type === t.id
                                  ? "border-orange-400 bg-orange-500/15 text-orange-200 shadow-orange"
                                  : "border-white/10 bg-white/5 text-blue-100 hover:border-blue-400/40 hover:bg-white/10 hover:shadow-[0_0_12px_rgba(59,145,245,0.15)]"
                              )}
                            >
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    form.type === t.id ? "bg-orange-400" : "bg-blue-400/60"
                                  )}
                                />
                                {t.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 1: Contact info */}
                    {step === 1 && (
                      <div>
                        <StepTitle
                          title="How can we reach you?"
                          desc="Your contact details are stored securely and never shared without consent."
                        />
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <Field label="Full name" required>
                            <Input
                              value={form.fullName}
                              onChange={(e) => set("fullName", e.target.value)}
                              placeholder="Your full name"
                              className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                            />
                          </Field>
                          <Field label="Organization">
                            <Input
                              value={form.organization}
                              onChange={(e) => set("organization", e.target.value)}
                              placeholder="Company / institution"
                              className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                            />
                          </Field>
                          <Field label="Role">
                            <Input
                              value={form.role}
                              onChange={(e) => set("role", e.target.value)}
                              placeholder="Your role"
                              className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                            />
                          </Field>
                          <Field label="Work email" required>
                            <Input
                              type="email"
                              value={form.email}
                              onChange={(e) => set("email", e.target.value)}
                              placeholder="you@organization.com"
                              className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                            />
                          </Field>
                          <Field label="Phone">
                            <Input
                              value={form.phone}
                              onChange={(e) => set("phone", e.target.value)}
                              placeholder="+880 ..."
                              className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                            />
                          </Field>
                          <Field label="WhatsApp">
                            <Input
                              value={form.whatsapp}
                              onChange={(e) => set("whatsapp", e.target.value)}
                              placeholder="WhatsApp number"
                              className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                            />
                          </Field>
                          <Field label="Country">
                            <Input
                              value={form.country}
                              onChange={(e) => set("country", e.target.value)}
                              placeholder="Country"
                              className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                            />
                          </Field>
                          <Field label="City">
                            <Input
                              value={form.city}
                              onChange={(e) => set("city", e.target.value)}
                              placeholder="City"
                              className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                            />
                          </Field>
                          <Field label="Preferred contact method">
                            <div className="flex flex-wrap gap-2">
                              {["email", "phone", "whatsapp"].map((ch) => (
                                <button
                                  key={ch}
                                  type="button"
                                  onClick={() => set("preferredChannel", ch)}
                                  className={cn(
                                    "rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-all",
                                    form.preferredChannel === ch
                                      ? "border-orange-400 bg-orange-500/15 text-orange-200"
                                      : "border-white/10 bg-white/5 text-blue-100 hover:bg-white/10"
                                  )}
                                >
                                  {ch}
                                </button>
                              ))}
                            </div>
                          </Field>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Request details */}
                    {step === 2 && (
                      <div>
                        <StepTitle
                          title="Tell us about your situation"
                          desc="The more context you share, the more focused the response."
                        />
                        <div className="mt-5 grid gap-4">
                          <Field label="Current challenge">
                            <Textarea
                              value={form.currentChallenge}
                              onChange={(e) => set("currentChallenge", e.target.value)}
                              placeholder="What are you trying to solve?"
                              rows={3}
                              className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                            />
                          </Field>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Desired outcome">
                              <Input
                                value={form.desiredOutcome}
                                onChange={(e) => set("desiredOutcome", e.target.value)}
                                placeholder="What does success look like?"
                                className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                              />
                            </Field>
                            <Field label="Timeline">
                              <Input
                                value={form.timeline}
                                onChange={(e) => set("timeline", e.target.value)}
                                placeholder="e.g. next quarter"
                                className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                              />
                            </Field>
                            <Field label="Estimated scope">
                              <Input
                                value={form.scope}
                                onChange={(e) => set("scope", e.target.value)}
                                placeholder="e.g. advisory, project, retainer"
                                className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                              />
                            </Field>
                            <Field label="Existing system">
                              <Input
                                value={form.existingSystem}
                                onChange={(e) => set("existingSystem", e.target.value)}
                                placeholder="Current tools / setup"
                                className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                              />
                            </Field>
                            <Field label="Preferred meeting time">
                              <Input
                                value={form.preferredTime}
                                onChange={(e) => set("preferredTime", e.target.value)}
                                placeholder="e.g. weekday mornings (BDT)"
                                className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                              />
                            </Field>
                          </div>
                          <Field label="Additional notes">
                            <Textarea
                              value={form.notes}
                              onChange={(e) => set("notes", e.target.value)}
                              placeholder="Anything else we should know?"
                              rows={2}
                              className="bg-white/5 border-white/15 text-white placeholder:text-blue-300/50"
                            />
                          </Field>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Consent */}
                    {step === 3 && (
                      <div>
                        <StepTitle
                          title="Consent & permissions"
                          desc="Your consent controls how your data is used. You can withdraw at any time."
                        />
                        <div className="mt-5 space-y-3">
                          <ConsentRow
                            checked={form.privacyConsent}
                            onChange={(v) => set("privacyConsent", v)}
                            title="Privacy consent"
                            desc="I agree to the processing of my data to handle this inquiry."
                            required
                          />
                          <ConsentRow
                            checked={form.commsConsent}
                            onChange={(v) => set("commsConsent", v)}
                            title="Communication consent"
                            desc="I agree to be contacted about this inquiry via my preferred method."
                            required
                          />
                          <ConsentRow
                            checked={form.marketingConsent}
                            onChange={(v) => set("marketingConsent", v)}
                            title="Marketing consent (optional)"
                            desc="I'd like to receive occasional insights and resources."
                          />
                          {form.type === "student-referral" && (
                            <ConsentRow
                              checked={form.studentDataConsent}
                              onChange={(v) => set("studentDataConsent", v)}
                              title="Student-data transfer consent"
                              desc="I consent to this referral being routed to ALO Education for formal student services."
                              required
                            />
                          )}
                        </div>
                        <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start gap-2.5">
                            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
                            <p className="text-xs leading-relaxed text-blue-100">
                              Your inquiry is validated, spam-checked, rate-limited and stored with an
                              audit log. Student referrals route securely to ALO Education only when
                              consent is given.
                            </p>
                          </div>
                        </div>

                        {/* Referral source indicator — only shown when UTM/ref was captured */}
                        {Object.keys(utm).length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-orange-400/25 bg-orange-500/10 px-4 py-2.5">
                            <Tag className="h-3.5 w-3.5 shrink-0 text-orange-300" />
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-300">
                              Referral tracked
                            </span>
                            <span className="text-xs text-blue-100">
                              {[
                                utm.referralSource && `source: ${utm.referralSource}`,
                                utm.utmSource && `utm_source: ${utm.utmSource}`,
                                utm.utmMedium && `medium: ${utm.utmMedium}`,
                                utm.utmCampaign && `campaign: ${utm.utmCampaign}`,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* error */}
              {error && !submitted && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* nav buttons */}
              {!submitted && (
                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={back}
                    disabled={step === 0}
                    className={cn(
                      "inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-all",
                      step === 0
                        ? "cursor-not-allowed text-blue-300/30"
                        : "text-blue-100 hover:bg-white/10"
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                  {step < STEPS.length - 1 ? (
                    <Button
                      type="button"
                      onClick={next}
                      className="h-11 gap-1.5 rounded-xl bg-orange-600 px-6 text-sm font-semibold text-white shadow-orange hover:bg-orange-700"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={submit}
                      disabled={submitting}
                      data-analytics="cta-click"
                      data-cta="contact-submit"
                      className="h-11 gap-2 rounded-xl bg-orange-600 px-6 text-sm font-semibold text-white shadow-orange hover:bg-orange-700 animate-glow-pulse"
                    >
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit inquiry
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
              </form>
            </div>
          </div>

          {/* secondary CTAs */}
          <div className="mt-6 flex flex-col items-center gap-4 text-sm">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(
                      new CustomEvent("alaminn:open-schedule-meeting"),
                    );
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-orange-400/40 bg-orange-500/10 px-4 py-2 font-semibold text-orange-200 transition-colors hover:bg-orange-500/20"
              >
                <Calendar className="h-4 w-4" />
                Schedule a meeting
              </button>
              <a
                href="mailto:hello@alaminn.info"
                className="inline-flex items-center gap-2 text-blue-200 hover:text-white"
              >
                <Mail className="h-4 w-4" />
                hello@alaminn.info
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-blue-300/80">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Remote-first · Based in Dhaka, Bangladesh (UTC+6)
              </span>
              <span className="text-blue-300/40">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                We respond within 1 business day
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h3 className="font-display text-xl font-extrabold text-white">{title}</h3>
      <p className="mt-1 text-sm text-blue-200">{desc}</p>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-blue-100">
        {label}
        {required && <span className="ml-1 text-orange-300">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ConsentRow({
  checked,
  onChange,
  title,
  desc,
  required,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  desc: string;
  required?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
        checked
          ? "border-orange-400/40 bg-orange-500/10"
          : "border-white/10 bg-white/5 hover:bg-white/10"
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(!!v)}
        className="mt-0.5 border-white/30 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
      />
      <div className="flex-1">
        <div className="text-sm font-semibold text-white">
          {title}
          {required && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-300">Required</span>}
        </div>
        <div className="mt-0.5 text-xs text-blue-200">{desc}</div>
      </div>
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-blue-200">{label}</span>
      <span className="font-medium capitalize text-white">{value}</span>
    </div>
  );
}
