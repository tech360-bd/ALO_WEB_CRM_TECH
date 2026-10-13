"use client";

/**
 * ContactProfileSocial — a premium professional profile card that bridges
 * the Hero and the rest of the homepage content.
 *
 * Layout:
 *   Desktop  → two columns (left: portrait card, right: intro + contact + social)
 *   Tablet   → adaptive two-column
 *   Mobile   → single column (portrait first, info underneath)
 *
 * Data: 100% real — reuses PROFILE, SOCIAL_LINKS, FACEBOOK_URL, WHATSAPP_*
 * from site-data.ts and the real /brand/portrait.jpg image. No invented
 * credentials, handles, or phone numbers.
 *
 * This is intentionally a COMPACT bridge card (not the full Executive Profile
 * section near the page footer, which carries the bio, principles, timeline
 * and skills radar). Its job is "who I am + how to reach me" — fast.
 */
import Image from "next/image";
import { motion } from "framer-motion";
import {
  MapPin,
  Mail,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  PROFILE,
  SOCIAL_LINKS,
  FACEBOOK_URL,
  WHATSAPP_NUMBER,
  whatsappLink,
} from "@/lib/site-data";
import { BRAND_ICONS } from "@/components/site/brand-icons";
import { PORTRAIT_BLUR } from "@/lib/blur-placeholders";

/** Compact core-expertise chips — distilled from the 8 expertise modules. */
const FOCUS_AREAS = [
  "Operations & Business Systems",
  "Sales Strategy & Revenue Growth",
  "International Education Operations",
  "University & Institutional Partnerships",
  "AI Automation & Governance",
  "CRM & Digital Transformation",
];

/** The social platforms to show in the compact icon row (all real). */
const SOCIAL_ROW = SOCIAL_LINKS.filter((s) =>
  ["facebook", "whatsapp", "linkedin", "instagram", "youtube", "twitter", "mail"].includes(
    s.icon,
  ),
);

export function ContactProfileSocial() {
  return (
    <section
      id="connect-profile"
      aria-labelledby="cps-heading"
      className="relative px-4 pt-10 pb-14 sm:px-6 sm:pt-14 sm:pb-18 lg:pt-16 lg:pb-20"
    >
      {/* Soft ambient background — subtle blue/orange tint, white base */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 12% 18%, rgba(11,99,206,0.06), transparent 38%), radial-gradient(circle at 88% 82%, rgba(242,97,19,0.05), transparent 40%)",
        }}
      />

      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {/* ─── LEFT: Portrait card ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div className="group relative overflow-hidden rounded-3xl border border-ink-200/80 bg-white shadow-card transition-shadow duration-300 hover:shadow-lg">
              {/* Portrait image with gradient overlay */}
              <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[5/4] lg:aspect-[4/5]">
                <Image
                  src="/brand/portrait.jpg"
                  alt="Portrait of Al Aminn — executive operations leader"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  priority
                  quality={85}
                  placeholder="blur"
                  blurDataURL={PORTRAIT_BLUR}
                />
                {/* Bottom gradient for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" />

                {/* Verified badge — top-left */}
                <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Verified Profile
                </div>

                {/* Name + title overlay — bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-6">
                  <h2
                    id="cps-heading"
                    className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl"
                  >
                    {PROFILE.name}
                  </h2>
                  <p className="mt-1.5 text-xs font-medium leading-snug text-blue-100 sm:text-sm">
                    {PROFILE.positioning}
                  </p>
                </div>
              </div>

              {/* Meta strip — location + reach */}
              <div className="grid grid-cols-2 gap-px border-t border-ink-100 bg-ink-100">
                <MetaCell
                  icon={MapPin}
                  label="Based in"
                  value={PROFILE.location}
                />
                <MetaCell
                  icon={Sparkles}
                  label="Reach"
                  value="Global · UTC+6"
                />
              </div>

              {/* Social icon row — real links, clickable */}
              <div className="flex items-center justify-between gap-3 border-t border-ink-100 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {SOCIAL_ROW.map((s) => {
                    const Icon = BRAND_ICONS[s.icon];
                    const isExternal = s.href.startsWith("http");
                    return (
                      <a
                        key={s.label}
                        href={s.href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        aria-label={`${s.label} — ${s.handle}${s.primary ? " (verified)" : ""}`}
                        title={`${s.label} — ${s.handle}${s.primary ? " (verified)" : ""}`}
                        data-analytics="cta-click"
                        data-cta={`profile-social-${s.label.toLowerCase()}`}
                        className="group/icon relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-500 transition-all duration-200 hover:scale-110 hover:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-offset-1"
                        style={{ ["--brand" as string]: s.brandColor }}
                      >
                        <Icon
                          className="h-4 w-4 transition-colors duration-200 group-hover/icon:text-white"
                          style={{ color: undefined }}
                        />
                        {/* Brand-color hover wash */}
                        <span
                          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover/icon:opacity-100"
                          style={{ backgroundColor: s.brandColor }}
                          aria-hidden="true"
                        />
                        {s.primary && (
                          <span className="sr-only">(verified)</span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── RIGHT: Intro + expertise + contact + CTA ───────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center lg:col-span-7"
          >
            {/* Eyebrow */}
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700 ring-1 ring-orange-200">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 node-active" />
              Who I Am
            </div>

            {/* Headline */}
            <h3 className="mt-4 font-display text-[clamp(1.6rem,2.6vw,2.4rem)] font-extrabold leading-[1.12] tracking-tight text-ink-900 text-balance">
              A senior operator building{" "}
              <span className="text-grad-momentum">structured systems for growth</span>.
            </h3>

            {/* Professional description — real promise + supporting */}
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-600 sm:text-[17px]">
              {PROFILE.promise}
            </p>
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-ink-500">
              {PROFILE.supporting}
            </p>

            {/* Core expertise chips */}
            <div className="mt-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">
                Core Expertise
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {FOCUS_AREAS.map((area, i) => (
                  <motion.span
                    key={area}
                    initial={{ opacity: 0, scale: 0.92 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-blue-500 to-orange-500" />
                    {area}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Contact info row — email + whatsapp */}
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              <a
                href="mailto:hello@alaminn.info"
                className="group flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3.5 transition-all duration-200 hover:border-orange-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/40 focus-visible:ring-offset-1"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100">
                  <Mail className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    Email
                  </span>
                  <span className="block truncate text-sm font-semibold text-ink-800">
                    hello@alaminn.info
                  </span>
                </span>
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-ink-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-orange-500" />
              </a>

              <a
                href={whatsappLink("Hi Al Aminn, I'd like to explore working together.")}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3.5 transition-all duration-200 hover:border-emerald-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-1"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                  <BRAND_ICONS.whatsapp className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    WhatsApp · Verified
                  </span>
                  <span className="block truncate text-sm font-semibold text-ink-800">
                    {WHATSAPP_NUMBER}
                  </span>
                </span>
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-ink-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-500" />
              </a>
            </div>

            {/* CTA buttons — Connect (Facebook) + Schedule */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-analytics="cta-click"
                data-cta="profile-connect-facebook"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#1877F2] px-6 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#0E5FC9] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 btn-sheen"
              >
                <BRAND_ICONS.facebook className="h-4 w-4" />
                Connect on Facebook
                <ArrowUpRight className="h-4 w-4 opacity-80" />
              </a>
              <a
                href="/contact"
                data-analytics="cta-click"
                data-cta="profile-contact-page"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-ink-900 bg-white px-6 text-sm font-bold text-ink-900 transition-all duration-200 hover:bg-ink-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/30 focus-visible:ring-offset-2"
              >
                Schedule a Meeting
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            {/* Trust line */}
            <p className="mt-5 text-xs leading-relaxed text-ink-400">
              {PROFILE.trustLine} · Facebook &amp; WhatsApp are verified — other
              platforms route through the Facebook hub so every link works.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/** Small meta cell used in the portrait card's meta strip. */
function MetaCell({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-ink-800">{value}</div>
    </div>
  );
}
