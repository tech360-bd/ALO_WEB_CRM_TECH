"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Mail,
  MapPin,
  ShieldCheck,
  Globe2,
  ArrowUp,
  Facebook,
  CalendarRange,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { LegalModals } from "./legal-modals";
import { SOCIAL_LINKS, FACEBOOK_URL, whatsappLink, WHATSAPP_NUMBER } from "@/lib/site-data";
import { BRAND_ICONS, WhatsAppIcon } from "@/components/site/brand-icons";

const FOOTER_NAV = {
  Platform: [
    { label: "About & Expertise", href: "/about" },
    { label: "Impact", href: "/impact" },
    { label: "Projects", href: "/projects" },
    { label: "Insights", href: "/insights" },
    { label: "Higher Study", href: "/higher-study" },
  ],
  Engage: [
    { label: "Work With Me", href: "/work-with-me" },
    { label: "Schedule a Meeting", href: "/work-with-me#schedule" },
    { label: "Insights", href: "/insights" },
    { label: "Higher Study", href: "/higher-study" },
    { label: "Contact", href: "/work-with-me#inquiry" },
  ],
  Ecosystem: [
    { label: "ALO Education", href: "#projects" },
    { label: "ALO Labs", href: "#alo-labs" },
    { label: "TECH360", href: "#projects" },
    { label: "English AI", href: "#projects" },
    { label: "ICLA Global Academy", href: "#projects" },
  ],
  // "Legal" column is rendered separately by <LegalModals /> so the four
  // links open accessible Radix Dialog modals instead of navigating to
  // separate routes (single-route constraint).
};

// Footer icon resolver — maps the string icon key from the centralized
// SOCIAL_LINKS config to the brand SVG component. Facebook and WhatsApp are
// verified real accounts; other platforms route through Facebook.
const FOOTER_SOCIAL_LINKS = SOCIAL_LINKS.map((s) => ({
  label: s.label,
  href: s.href,
  handle: s.handle,
  icon: BRAND_ICONS[s.icon] ?? Globe2,
  brandColor: s.brandColor,
  primary: s.primary,
}));

const SOCIAL_PROOF_STATS = [
  { value: "8", label: "Expertise modules" },
  { value: "7", label: "Ecosystem platforms" },
  { value: "8-stage", label: "Growth process" },
];

const YEAR_HIGHLIGHTS = [
  "6 AI-governed workflows",
  "8-stage operating system",
  "7 ecosystem platforms",
];

// Framer Motion variants for staggered CTA strip reveal
const containerStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
  },
};

type SubscribeState = "idle" | "loading" | "success" | "error";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState<SubscribeState>("idle");
  const [subError, setSubError] = useState("");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (subState === "loading" || subState === "success") return;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setSubState("error");
      setSubError("Please enter a valid email address.");
      return;
    }
    setSubState("loading");
    setSubError("");
    try {
      const res = await fetch("/api/v1/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          consent: true,
          interest: "executive",
          utmSource: "footer",
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setSubState("success");
        setEmail("");
      } else {
        setSubState("error");
        setSubError(
          json?.message ?? "Subscription failed. Please try again later.",
        );
      }
    } catch {
      setSubState("error");
      setSubError("Network error. Please try again later.");
    }
  }

  return (
    <footer className="mt-auto relative overflow-hidden bg-ink-950 text-blue-100">
      {/* Top border gradient (transparent → orange/30 → transparent) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(242,97,19,0.35) 50%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      {/* Faint dot-grid pattern background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden="true"
      />
      {/* ambient gradients */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 12% 0%, rgba(11,99,206,0.30), transparent 40%), radial-gradient(circle at 88% 10%, rgba(242,97,19,0.18), transparent 38%)",
        }}
      />
      <div className="relative mx-auto max-w-[1320px] px-4 sm:px-6">
        {/* Top CTA strip */}
        <motion.div
          variants={containerStagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-8 border-b border-white/10 py-12 lg:grid-cols-12 lg:py-14"
        >
          <div className="lg:col-span-5">
            <motion.div variants={itemUp} className="flex items-center gap-2 text-orange-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500 node-active" />
              </span>
              <span className="eyebrow">Al Aminn · Alaminn.info</span>
            </motion.div>
            <motion.h2
              variants={itemUp}
              className="mt-3 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl"
            >
              Build the structure your next stage of growth requires.
            </motion.h2>
            <motion.p
              variants={itemUp}
              className="mt-3 max-w-md text-sm text-blue-200"
            >
              Transforming strategy into scalable operations, growth and intelligent systems.
            </motion.p>
            <motion.div variants={itemUp} className="mt-5 flex flex-wrap gap-3">
              <Link
                href="#contact"
                data-analytics="cta-click"
                data-cta="footer-strategic"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-orange transition-all hover:bg-orange-700"
              >
                Start a Strategic Conversation
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="#work-with-me"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                Explore the Ecosystem
              </Link>
            </motion.div>

            {/* Mini newsletter signup */}
            <motion.div variants={itemUp} className="mt-6 w-full lg:max-w-sm">
              {subState === "success" ? (
                <div
                  className="flex h-10 items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 text-sm text-emerald-200"
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Subscribed! Check your inbox.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} noValidate>
                  <label
                    htmlFor="footer-newsletter-email"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-blue-300"
                  >
                    Join the bi-weekly brief
                  </label>
                  <div className="flex h-10 items-stretch gap-2">
                    <input
                      id="footer-newsletter-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (subState === "error") setSubState("idle");
                      }}
                      disabled={subState === "loading"}
                      aria-invalid={subState === "error"}
                      aria-describedby="footer-newsletter-caption footer-newsletter-error"
                      className="h-10 w-full flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-blue-300/60 outline-none transition-colors focus:border-orange-400/60 focus:bg-white/10"
                    />
                    <button
                      type="submit"
                      disabled={subState === "loading"}
                      data-analytics="cta-click"
                      data-cta="newsletter-subscribe"
                      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 text-sm font-semibold text-white shadow-orange transition-all hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Subscribe to newsletter"
                    >
                      {subState === "loading" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Subscribe
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                  {subState === "error" && subError && (
                    <p
                      id="footer-newsletter-error"
                      role="alert"
                      className="mt-1.5 text-xs font-medium text-red-300"
                    >
                      {subError}
                    </p>
                  )}
                  <p
                    id="footer-newsletter-caption"
                    className="mt-1.5 text-[10px] text-blue-300/70"
                  >
                    Bi-weekly · No spam · Unsubscribe anytime
                  </p>
                </form>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-7">
            {/* Social proof stats row */}
            <motion.div
              variants={itemUp}
              className="mb-8 grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              {SOCIAL_PROOF_STATS.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center justify-center px-3 py-4 text-center"
                >
                  <div className="font-display text-3xl font-extrabold leading-none text-orange-400">
                    {s.value}
                  </div>
                  <div className="mt-1.5 text-[11px] uppercase tracking-wider text-blue-300">
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Nav grid */}
            <motion.div
              variants={itemUp}
              className="grid grid-cols-2 gap-8 sm:grid-cols-4"
            >
              {Object.entries(FOOTER_NAV).map(([title, items]) => (
                <div key={title}>
                  <div className="eyebrow text-blue-300">{title}</div>
                  <ul className="mt-4 space-y-2.5">
                    {items.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="hover-underline text-sm text-blue-200 transition-colors hover:text-white"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {/* Legal column — buttons that open accessible modals */}
              <LegalModals />
            </motion.div>
          </div>
        </motion.div>

        {/* Mid info bar — 4 columns (adds Year in review card) */}
        <div className="grid gap-6 border-b border-white/10 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-orange-300">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-300">Email</div>
              <a
                href="mailto:hello@alaminn.info"
                className="text-sm font-medium text-white transition-colors hover:text-orange-300"
              >
                hello@alaminn.info
              </a>
              <div className="mt-0.5 text-[10px] text-blue-400/50">Response within 24 hours</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#25D366]">
              <WhatsAppIcon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-300">WhatsApp</div>
              <a
                href={whatsappLink(
                  "Hi Al Aminn, I'd like to explore working together.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-white transition-colors hover:text-[#25D366]"
              >
                {WHATSAPP_NUMBER}
              </a>
              <div className="mt-0.5 text-[10px] text-blue-400/50">Direct chat — fastest response</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-blue-300">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-300">Based in</div>
              <div className="text-sm font-medium text-white">Dhaka, Bangladesh</div>
              <div className="mt-0.5 text-[10px] text-blue-400/50">Working across time zones (UTC+6)</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-300">Governance</div>
              <div className="text-sm font-medium text-white">Evidence-controlled · AI approval-gated</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-emerald-400/80">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 node-active" />
                </span>
                All systems operational
              </div>
            </div>
          </div>

          {/* Year in review mini card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-orange-300">
                <CalendarRange className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-blue-300">Year in review</div>
                <div className="font-display text-sm font-bold text-white">2026 Highlights</div>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {YEAR_HIGHLIGHTS.map((h) => (
                <li
                  key={h}
                  className="flex items-start gap-2 text-[11px] leading-snug text-blue-200"
                >
                  <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-orange-400" />
                  {h}
                </li>
              ))}
            </ul>
            <Link
              href="#case-studies"
              className="hover-underline mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-orange-300 transition-colors hover:text-orange-200"
            >
              Read summary
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Verified social hub banner — Facebook primary, all platforms routed */}
        <div className="border-b border-white/10 py-7">
          <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-gradient-to-r from-[#1877F2]/10 via-white/[0.02] to-orange-600/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-4">
              <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-lg shadow-[#1877F2]/30">
                <Facebook className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-ink-950">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-display text-base font-extrabold text-white">
                    Find Al Aminn on social media
                  </div>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    Verified hub
                  </span>
                </div>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-blue-200">
                  Facebook is the primary verified account. LinkedIn, Instagram, X and YouTube
                  route through it so every icon leads to a real, working profile.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-analytics="cta-click"
                data-cta="footer-facebook"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1877F2] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0E5FC9]"
              >
                <Facebook className="h-4 w-4" />
                Open Facebook
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="mailto:hello@alaminn.info"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-start justify-between gap-4 py-7 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg grad-intelligence">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              </span>
              <div className="text-sm text-blue-300">
                © {new Date().getFullYear()} Al Aminn · Alaminn.info. All rights reserved.
              </div>
            </div>
            {/* Social links row — real, verified hub (Facebook primary) */}
            <div className="flex items-center gap-1.5">
              {FOOTER_SOCIAL_LINKS.map(({ label, href, handle, icon: Icon, brandColor, primary }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={`${label} — ${handle}${primary ? " (verified)" : ""}`}
                  title={`${label} — ${handle}${primary ? " (verified)" : ""}`}
                  className="group relative inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-blue-200 transition-all hover:scale-110"
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.backgroundColor = brandColor;
                    el.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.backgroundColor = "";
                    el.style.color = "";
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {primary && (
                    <span
                      className="absolute -right-0.5 -top-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-ink-950"
                      title="Verified primary hub"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-blue-300">
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5" />
              English · Bengali
            </span>
            <span className="opacity-50">|</span>
            <span
              className="inline-flex items-center gap-1.5"
              title="First-party, cookie-less analytics. No third-party tracking. Respects Do Not Track."
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              Privacy-friendly analytics · No cookies · No third-party tracking
            </span>
            <span className="opacity-50">|</span>
            <span>Student services route to ALO Education</span>
            <span className="opacity-50">|</span>
            <span>AI publishing requires approval</span>
            <span className="opacity-50">|</span>
            {/* Back to top link with arrow animation */}
            <a
              href="#home"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-orange-300"
            >
              <ArrowUp className="h-3.5 w-3.5 animate-arrow-bounce" />
              Back to top
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
