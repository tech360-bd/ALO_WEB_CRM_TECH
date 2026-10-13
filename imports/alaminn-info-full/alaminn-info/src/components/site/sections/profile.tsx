"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  MapPin,
  Languages,
  BadgeCheck,
  Briefcase,
  Globe2,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Mail,
  ArrowUpRight,
  ExternalLink,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading, SectionWrap } from "./section-primitives";
import { PROFILE, LEADERSHIP_PRINCIPLES, SOCIAL_LINKS, FACEBOOK_URL } from "@/lib/site-data";
import { PORTRAIT_BLUR, PORTRAIT_LIFESTYLE_BLUR } from "@/lib/blur-placeholders";
import { useRef } from "react";
import { SkillsRadar } from "./skills-radar";

const RESPONSIBILITIES = [
  "Operations & business systems design",
  "Sales strategy & pipeline architecture",
  "International education operations",
  "University & institutional partnerships",
  "AI automation & governance",
  "CRM & digital transformation",
];

const TIMELINE = [
  { period: "Current", title: "Executive Operations & Systems Builder", org: "Alaminn.info · ALO ecosystem" },
  { period: "Ongoing", title: "Education-Business Growth & Partnerships", org: "Bangladesh market" },
  { period: "Ongoing", title: "AI Automation & CRM Architecture", org: "ALO Labs · TECH360" },
];

// Icon resolver — maps the string icon key from SOCIAL_LINKS to a lucide component
const ICON_MAP: Record<string, LucideIcon> = {
  facebook: Facebook,
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  mail: Mail,
  globe: Globe2,
};

export function Profile() {
  const portraitRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: portraitRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -20]);

  return (
    <SectionWrap id="profile" className="bg-white dark:bg-ink-900/50">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left: portrait + meta + lifestyle */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45 }}
            className="sticky top-24 overflow-hidden rounded-3xl border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 shadow-card dark:shadow-none hover:shadow-lg dark:hover:shadow-xl transition-shadow"
          >
            {/* Main professional portrait */}
            <div ref={portraitRef} className="relative aspect-[4/5] overflow-hidden">
              <motion.div style={{ y: parallaxY }} className="absolute inset-0">
                <Image
                  src="/brand/portrait.jpg"
                  alt="Portrait of Al Aminn — executive operations leader"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                  priority
                  quality={85}
                  placeholder="blur"
                  blurDataURL={PORTRAIT_BLUR}
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-orange-300" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-orange-200">
                    Executive Profile
                  </span>
                </div>
                <div className="mt-1 font-display text-2xl font-extrabold">{PROFILE.name}</div>
                <div className="text-xs text-blue-100">{PROFILE.positioning}</div>
              </div>
            </div>

            {/* Secondary lifestyle photo strip — real, candid moment */}
            <div className="relative h-28 overflow-hidden border-t border-ink-100 dark:border-blue-900/40">
              <Image
                src="/brand/portrait-lifestyle.jpg"
                alt="Al Aminn in a candid rooftop moment — personal brand context"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center"
                loading="lazy"
                quality={85}
                placeholder="blur"
                blurDataURL={PORTRAIT_LIFESTYLE_BLUR}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink-950/60 via-transparent to-ink-950/30" />
              <div className="absolute inset-0 flex items-center justify-between px-5">
                <div className="text-white">
                  <div className="text-[9px] font-semibold uppercase tracking-widest text-orange-200">
                    Beyond the desk
                  </div>
                  <div className="text-[11px] text-blue-100/90">Dhaka · Working globally</div>
                </div>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 text-[11px] font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  aria-label="View Al Aminn on Facebook (opens in new tab)"
                >
                  <Facebook className="h-3.5 w-3.5" />
                  Follow
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-px bg-ink-100 dark:bg-blue-900/30">
              <Meta icon={MapPin} label="Based in" value={PROFILE.location} />
              <Meta icon={Languages} label="Languages" value={PROFILE.languages.join(" · ")} />
              <Meta icon={Briefcase} label="Role" value="Operations · Growth · AI" />
              <Meta icon={Globe2} label="Reach" value="Global" />
            </div>

            {/* Social row — real links */}
            <div className="flex items-center justify-between gap-3 border-t border-ink-100 dark:border-blue-900/40 p-5">
              <div className="flex flex-wrap gap-2">
                {SOCIAL_LINKS.slice(0, 6).map((s) => {
                  const Icon = ICON_MAP[s.icon] ?? Globe2;
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      target={s.href.startsWith("http") ? "_blank" : undefined}
                      rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      aria-label={`${s.label} — ${s.handle}`}
                      title={`${s.label} — ${s.handle}${s.primary ? " (verified)" : ""}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 dark:border-blue-800/30 text-ink-600 dark:text-ink-300 transition-all hover:scale-110"
                      style={{ ["--brand" as string]: s.brandColor }}
                    >
                      <Icon
                        className="h-4 w-4 transition-colors"
                        style={{ color: undefined }}
                      />
                      {s.primary && (
                        <span className="sr-only">(verified primary hub)</span>
                      )}
                    </a>
                  );
                })}
              </div>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 btn-sheen"
              >
                <Facebook className="h-4 w-4" />
                Connect
              </a>
            </div>
          </motion.div>
        </div>

        {/* Right: bio + principles + timeline + Connect card */}
        <div className="lg:col-span-7">
          <SectionHeading
            eyebrow="Executive Profile"
            title={
              <>
                A senior operator building{" "}
                <span className="text-grad-momentum">structured systems for growth</span>.
              </>
            }
            description={PROFILE.promise}
          />

          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 p-5 shadow-soft dark:shadow-none">
              <div className="eyebrow text-blue-600">Core expertise</div>
              <ul className="mt-3 space-y-2">
                {RESPONSIBILITIES.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm text-ink-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-ink-200 bg-ink-950 p-5 text-white shadow-card">
              <div className="eyebrow text-orange-300">Leadership principles</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {LEADERSHIP_PRINCIPLES.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-blue-100"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Connect card — real social media hub */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="mt-6 overflow-hidden rounded-2xl border border-ink-200 dark:border-blue-800/30 bg-gradient-to-br from-white to-blue-50/40 dark:from-ink-900 dark:to-blue-900/20 p-6 shadow-soft dark:shadow-none"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <div className="eyebrow text-emerald-600 dark:text-emerald-400">
                    Verified social hub
                  </div>
                </div>
                <h3 className="mt-2 font-display text-xl font-extrabold text-ink-900 dark:text-white">
                  Connect with Al Aminn
                </h3>
                <p className="mt-1.5 text-sm text-ink-600 dark:text-blue-200">
                  Facebook is the primary verified hub. Other platforms route through it so you
                  always reach a real, working profile — never a dead link.
                </p>
              </div>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0E5FC9] sm:inline-flex"
              >
                <Facebook className="h-4 w-4" />
                Open Facebook
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>
            </div>

            {/* Social links list */}
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {SOCIAL_LINKS.map((s) => {
                const Icon = ICON_MAP[s.icon] ?? Globe2;
                return (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target={s.href.startsWith("http") ? "_blank" : undefined}
                      rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900/60 px-3.5 py-2.5 transition-all hover:border-transparent hover:shadow-sm"
                      style={{ ["--brand" as string]: s.brandColor }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = s.brandColor;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "";
                      }}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                          style={{ backgroundColor: `${s.brandColor}15`, color: s.brandColor }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-900 dark:text-white">
                            {s.label}
                            {s.primary && (
                              <CheckCircle2
                                className="h-3.5 w-3.5 text-emerald-500"
                                aria-label="Verified"
                              />
                            )}
                          </span>
                          <span className="block truncate text-[11px] text-ink-500 dark:text-blue-300">
                            {s.handle}
                          </span>
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* Timeline preview */}
          <div className="mt-6 rounded-2xl border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 p-5 shadow-soft dark:shadow-none sm:p-6">
            <div className="eyebrow text-blue-600">Career timeline preview</div>
            <div className="mt-4 space-y-4">
              {TIMELINE.map((t, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="inline-flex h-3 w-3 rounded-full bg-orange-500 ring-4 ring-orange-100" />
                    {i < TIMELINE.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-ink-200" />
                    )}
                  </div>
                  <div className="pb-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                      {t.period}
                    </div>
                    <div className="mt-0.5 font-display text-sm font-bold text-ink-900">
                      {t.title}
                    </div>
                    <div className="text-xs text-ink-500">{t.org}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills radar chart */}
          <div className="mt-6">
            <SkillsRadar />
          </div>
        </div>
      </div>
    </SectionWrap>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white dark:bg-ink-900/80 p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-400">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-ink-800 dark:text-ink-200">{value}</div>
    </div>
  );
}
