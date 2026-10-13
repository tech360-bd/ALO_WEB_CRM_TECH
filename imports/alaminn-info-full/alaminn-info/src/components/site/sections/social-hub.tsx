"use client";

/**
 * SocialHub — premium social media hub showing all platforms with their
 * real verified status. Facebook and WhatsApp are verified real accounts;
 * other platforms route through Facebook so no link is ever dead.
 *
 * Truth & evidence governance: verified accounts are clearly badged; all
 * others are honestly labeled "Find via Facebook". No fabricated handles.
 */
import { motion } from "framer-motion";
import { CheckCircle2, ArrowUpRight, ShieldCheck } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/site-data";
import { BRAND_ICONS } from "@/components/site/brand-icons";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function SocialHub() {
  return (
    <section
      id="social"
      aria-labelledby="social-heading"
      className="relative overflow-hidden py-20 sm:py-24 lg:py-28"
    >
      {/* Deep navy background for premium contrast */}
      <div className="absolute inset-0 bg-ink-950" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 15% 0%, rgba(11,99,206,0.35), transparent 45%), radial-gradient(circle at 85% 15%, rgba(242,97,19,0.25), transparent 42%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-4 sm:px-6">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100 backdrop-blur"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Verified Social Hub
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl text-balance [text-wrap:balance]"
          >
            Connect with Al Aminn
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-4 text-base text-blue-200 sm:text-lg"
          >
            Facebook and WhatsApp are verified. Other platforms route through
            the Facebook hub so every link is real and working.
          </motion.p>
        </div>

        {/* Social cards grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {SOCIAL_LINKS.map((social) => {
            const Icon = BRAND_ICONS[social.icon];
            const isExternal = social.href.startsWith("http");
            return (
              <motion.a
                key={social.label}
                variants={item}
                href={social.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                data-analytics="cta-click"
                data-cta={`social-${social.label.toLowerCase()}`}
                className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
                style={{ ["--brand" as string]: social.brandColor }}
              >
                {/* Brand color glow on hover */}
                <span
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
                  style={{ backgroundColor: social.brandColor }}
                  aria-hidden="true"
                />
                {/* Icon + verified badge */}
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-white transition-all duration-300 group-hover:scale-110 group-hover:text-white"
                    style={{
                      backgroundColor: social.brandColor,
                      boxShadow: `0 6px 20px -8px ${social.brandColor}`,
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {social.primary ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-blue-300/60 transition-all duration-300 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  )}
                </div>
                {/* Label + handle */}
                <div>
                  <div className="font-display text-sm font-bold text-white">
                    {social.label}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-blue-300">
                    {social.handle}
                  </div>
                </div>
                {/* Tagline */}
                <p className="mt-auto text-[11px] leading-relaxed text-blue-300/80">
                  {social.tagline}
                </p>
              </motion.a>
            );
          })}
        </motion.div>

        {/* Trust note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 text-center text-xs text-blue-400/70"
        >
          Every link is checked. No dead handles. Verified accounts are badged
          with a green checkmark.
        </motion.p>
      </div>
    </section>
  );
}
