"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Calendar,
  Lock,
  Ban,
  MailX,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { captureUtmParams } from "@/lib/utm";

type SubmitState = "idle" | "loading" | "success" | "error";

const BENEFITS = [
  { icon: "📊", text: "Operations & growth insights" },
  { icon: "🤖", text: "AI automation best practices" },
  { icon: "🎓", text: "Education business strategies" },
  { icon: "🔒", text: "No spam, unsubscribe anytime" },
];

const INTEREST_OPTIONS = [
  { value: "executive", label: "Executive / Leadership" },
  { value: "operations", label: "Operations Manager" },
  { value: "education", label: "Education Professional" },
  { value: "technology", label: "Technology / AI" },
  { value: "partnership", label: "Partnership Inquiry" },
  { value: "student", label: "Student / Parent" },
  { value: "other", label: "Other" },
];

const RECENT_EDITIONS = [
  {
    month: "Feb 2025",
    title: "The Operating System Behind Growth",
    preview: "Why structured operations outperform ad-hoc effort every time.",
  },
  {
    month: "Jan 2025",
    title: "AI Governance for Service Businesses",
    preview: "Controlled adoption beats uncontrolled experimentation.",
  },
  {
    month: "Dec 2024",
    title: "Bangladesh Education Market Outlook",
    preview: "Partnership strategies for universities entering the market.",
  },
  {
    month: "Nov 2024",
    title: "From CRM Chaos to Pipeline Clarity",
    preview: "How to build a single source of truth for relationships.",
  },
];

const TRUST_SIGNALS = [
  { icon: Lock, text: "GDPR compliant" },
  { icon: Ban, text: "No spam, ever" },
  { icon: MailX, text: "Unsubscribe anytime" },
  { icon: BarChart3, text: "Evidence-controlled content" },
];

export function Newsletter({ subscriberCount = 0 }: { subscriberCount?: number }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [interest, setInterest] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [displayCount, setDisplayCount] = useState(0);
  const [utmSource, setUtmSource] = useState<string | undefined>(undefined);

  // Capture UTM params from the URL once, on the client.
  // Using a ref guard avoids the React Compiler "setState synchronously in effect"
  // warning by deferring the set to a microtask.
  const utmInitialized = useRef(false);
  useEffect(() => {
    if (utmInitialized.current) return;
    utmInitialized.current = true;
    const { utmSource: captured } = captureUtmParams();
    queueMicrotask(() => setUtmSource(captured));
  }, []);

  // Animate subscriber count
  useEffect(() => {
    if (subscriberCount <= 0) return;
    let current = 0;
    const step = Math.max(1, Math.floor(subscriberCount / 30));
    const timer = setInterval(() => {
      current += step;
      if (current >= subscriberCount) {
        current = subscriberCount;
        clearInterval(timer);
      }
      setDisplayCount(current);
    }, 30);
    return () => clearInterval(timer);
  }, [subscriberCount]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/v1/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          interest: interest || undefined,
          consent,
          utmSource: utmSource || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitState("success");
        setEmail("");
        setName("");
        setInterest("");
        setConsent(false);
      } else {
        setSubmitState("error");
        setErrorMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setSubmitState("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  return (
    <section
      id="newsletter"
      className="relative scroll-mt-24 overflow-hidden bg-ink-950 px-4 py-16 sm:px-6 sm:py-20 lg:py-24"
    >
      {/* Ambient gradients */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 20% 15%, rgba(11,99,206,0.30), transparent 44%), radial-gradient(circle at 80% 20%, rgba(242,97,19,0.22), transparent 42%), radial-gradient(circle at 50% 80%, rgba(11,99,206,0.15), transparent 50%)",
        }}
      />

      {/* Floating geometric shapes — triangles & hexagons */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Hexagon 1 */}
        <svg
          className="absolute left-[8%] top-[12%] h-32 w-32 animate-[float-geo_18s_ease-in-out_infinite]"
          viewBox="0 0 100 100"
          fill="none"
          style={{ opacity: 0.04 }}
        >
          <polygon
            points="50,3 97,25 97,75 50,97 3,75 3,25"
            stroke="rgba(242,97,19,0.6)"
            strokeWidth="1"
            fill="rgba(242,97,19,0.05)"
          />
        </svg>
        {/* Triangle 1 */}
        <svg
          className="absolute right-[12%] top-[18%] h-24 w-24 animate-[float-geo_22s_ease-in-out_infinite_reverse]"
          viewBox="0 0 100 100"
          fill="none"
          style={{ opacity: 0.035 }}
        >
          <polygon
            points="50,5 95,90 5,90"
            stroke="rgba(11,99,206,0.6)"
            strokeWidth="1"
            fill="rgba(11,99,206,0.04)"
          />
        </svg>
        {/* Hexagon 2 */}
        <svg
          className="absolute bottom-[15%] left-[65%] h-28 w-28 animate-[float-geo_20s_ease-in-out_infinite]"
          viewBox="0 0 100 100"
          fill="none"
          style={{ opacity: 0.03 }}
        >
          <polygon
            points="50,3 97,25 97,75 50,97 3,75 3,25"
            stroke="rgba(11,99,206,0.5)"
            strokeWidth="1"
            fill="rgba(11,99,206,0.03)"
          />
        </svg>
        {/* Triangle 2 */}
        <svg
          className="absolute bottom-[25%] right-[30%] h-20 w-20 animate-[float-geo_15s_ease-in-out_infinite_reverse]"
          viewBox="0 0 100 100"
          fill="none"
          style={{ opacity: 0.05 }}
        >
          <polygon
            points="50,5 95,90 5,90"
            stroke="rgba(242,97,19,0.5)"
            strokeWidth="1"
            fill="rgba(242,97,19,0.04)"
          />
        </svg>
        {/* Small hexagon accent */}
        <svg
          className="absolute left-[45%] top-[8%] h-16 w-16 animate-[float-geo_25s_ease-in-out_infinite]"
          viewBox="0 0 100 100"
          fill="none"
          style={{ opacity: 0.03 }}
        >
          <polygon
            points="50,3 97,25 97,75 50,97 3,75 3,25"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.8"
            fill="rgba(255,255,255,0.02)"
          />
        </svg>
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Subtle animated dot pattern in background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Decorative horizontal accent line */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(242,97,19,0.4), rgba(11,99,206,0.4), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-[1320px]">
        {/* Recent Editions Preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/60">
            Recent Editions
          </p>
          <div className="flex gap-4 overflow-x-auto pb-2 sm:gap-5 lg:justify-center">
            {RECENT_EDITIONS.map((edition, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="group relative flex min-w-[220px] flex-col gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-md transition-colors hover:border-orange-500/20 hover:bg-white/[0.07] sm:min-w-[260px]"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-400/80">
                  {edition.month}
                </span>
                <h4 className="text-sm font-bold leading-snug text-white/90 line-clamp-2">
                  {edition.title}
                </h4>
                <p className="text-xs leading-relaxed text-blue-200/50 line-clamp-2">
                  {edition.preview}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-medium text-orange-400/70 transition-colors group-hover:text-orange-300">
                  Read
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left: copy + benefits */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            {/* Eyebrow with frequency badge */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
                <Sparkles className="h-3.5 w-3.5" />
                Newsletter
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium text-blue-200/60">
                <Calendar className="h-3 w-3" />
                Published bi-weekly
              </div>
            </div>

            <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] font-extrabold leading-[1.1] tracking-tight text-white text-balance">
              Stay Ahead With Executive Insights
            </h2>
            <p className="mt-4 text-base leading-relaxed text-blue-200 sm:text-lg">
              Receive curated insights on operations, growth, AI automation and
              international education — evidence-controlled, never spam.
            </p>

            {/* Benefits list */}
            <div className="mt-6 space-y-3">
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
                  className="flex items-center gap-3 text-sm text-blue-100"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-base">
                    {b.icon}
                  </span>
                  {b.text}
                </motion.div>
              ))}
            </div>

            {/* Subscriber count with mini avatars */}
            <div className="mt-6 flex items-center gap-3">
              {subscriberCount > 0 && (
                <div className="flex -space-x-1.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink-950 bg-orange-600/80 text-[9px] font-bold text-white">
                    A
                  </span>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink-950 bg-blue-600/80 text-[9px] font-bold text-white">
                    K
                  </span>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink-950 bg-emerald-600/80 text-[9px] font-bold text-white">
                    M
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-blue-300/70">
                <ShieldCheck className="h-3.5 w-3.5" />
                {subscriberCount > 0 ? (
                  <>
                    Join{" "}
                    <span className="tabular font-semibold text-blue-200">
                      {displayCount}
                    </span>{" "}
                    professionals already subscribed
                  </>
                ) : (
                  <>Join professionals receiving evidence-controlled insights</>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            {submitState === "success" ? (
              <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
                {/* Confetti-like dots */}
                {[...Array(8)].map((_, idx) => {
                  const colors = ["#0B63CE", "#F26113", "#3B91F5", "#FF751F", "#1677E8", "#FFB27E", "#75B5FF", "#FF914D"];
                  const angle = (idx / 8) * 360;
                  const dist = 40 + ((idx * 37) % 30);
                  const cx = Math.cos((angle * Math.PI) / 180) * dist;
                  const cy = Math.sin((angle * Math.PI) / 180) * dist;
                  return (
                    <span
                      key={idx}
                      className="confetti-dot"
                      style={
                        {
                          top: "50%",
                          left: "50%",
                          backgroundColor: colors[idx],
                          "--cx": `${cx}px`,
                          "--cy": `${cy}px`,
                        } as React.CSSProperties
                      }
                    />
                  );
                })}
                <CheckCircle2 className="relative h-10 w-10 animate-check-expand text-emerald-400" />
                <p className="relative text-lg font-semibold text-emerald-300">
                  You&apos;re subscribed!
                </p>
                <p className="relative text-sm text-emerald-200/80">
                  Please confirm via the email we just sent. Check your inbox (and
                  spam folder).
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8"
              >
                <div className="mb-2 flex items-center gap-2 text-xs text-blue-300/60">
                  <Mail className="h-3.5 w-3.5" />
                  Free subscription — no credit card required
                </div>

                {/* Name + Email row */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300/60" />
                    <Input
                      type="text"
                      placeholder="Your name (optional)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 border-white/15 bg-white/5 pl-9 text-sm text-white placeholder:text-blue-300/50 focus-visible:border-orange-500/50 focus-visible:ring-orange-500/20"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300/60" />
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 border-white/15 bg-white/5 pl-9 text-sm text-white placeholder:text-blue-300/50 focus-visible:border-orange-500/50 focus-visible:ring-orange-500/20"
                    />
                  </div>
                </div>

                {/* Role / Interest dropdown */}
                <Select value={interest} onValueChange={setInterest}>
                  <SelectTrigger className="h-11 w-full border-white/15 bg-white/5 text-sm text-blue-300/70 focus:ring-orange-500/20 focus:border-orange-500/50 [&_svg]:text-blue-300/50">
                    <SelectValue placeholder="Your role / interest (optional)" />
                  </SelectTrigger>
                  <SelectContent className="border-white/15 bg-ink-950/95 backdrop-blur-lg">
                    {INTEREST_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-sm text-blue-200/80 focus:bg-white/10 focus:text-white"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Consent */}
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="nl-consent"
                    checked={consent}
                    onCheckedChange={(checked) => setConsent(checked === true)}
                    className="mt-0.5 border-white/30 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                  />
                  <Label
                    htmlFor="nl-consent"
                    className="text-xs leading-snug text-blue-200/80"
                  >
                    I consent to receive email communications. I understand I can
                    unsubscribe at any time.
                  </Label>
                </div>

                {/* Error message */}
                {submitState === "error" && (
                  <div className="flex items-center gap-2 animate-slide-up rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <p className="text-xs text-red-300">{errorMessage}</p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={submitState === "loading" || !consent || !email}
                  className="group relative h-11 w-full overflow-hidden bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 sm:w-auto sm:px-8"
                >
                  {submitState === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subscribing…
                    </>
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>

                {/* Trust signals row */}
                <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
                  {TRUST_SIGNALS.map((signal, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 text-[10px] text-blue-300/45"
                    >
                      <signal.icon className="h-3 w-3 shrink-0" />
                      {signal.text}
                    </div>
                  ))}
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
