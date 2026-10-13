"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={cn(
            "mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
            dark
              ? "bg-white/10 text-orange-300"
              : "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 node-active" />
          {eyebrow}
        </motion.div>
      )}
      <h2
        className={cn(
          "font-display text-[clamp(1.75rem,3vw,2.75rem)] font-extrabold leading-[1.1] tracking-tight text-balance",
          dark ? "text-white" : "text-ink-900"
        )}
      >
        {title}
      </h2>
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn(
            "mt-4 text-base leading-relaxed text-pretty sm:text-lg",
            dark ? "text-blue-200" : "text-ink-600"
          )}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}

export function SectionWrap({
  id,
  children,
  className,
  dark = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:py-24 font-display",
        dark ? "bg-ink-950 text-blue-100" : "bg-white dark:bg-background",
        className
      )}
    >
      {/* Top gradient divider line with glow effect */}
      <div className="absolute inset-x-0 top-0 h-px opacity-50" style={{
        background: "linear-gradient(90deg, transparent, #0B63CE 25%, #F26113 75%, transparent)",
      }} />
      {/* Subtle glow under the divider */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-8 opacity-20 dark:opacity-10" style={{
        background: "linear-gradient(180deg, rgba(11,99,206,0.08), transparent)",
      }} />
      <div className="mx-auto max-w-[1320px]">{children}</div>
    </section>
  );
}
