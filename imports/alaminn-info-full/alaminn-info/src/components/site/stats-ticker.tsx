"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring, animate } from "framer-motion";
import {
  Layers,
  Globe,
  Route,
  Bot,
  ShieldCheck,
  Activity,
  MapPin,
  GraduationCap,
} from "lucide-react";

type StatItem = {
  icon: React.ElementType;
  /** Optional numeric value — rendered with a count-up animation. */
  value?: number;
  /** Suffix appended after the animated number (e.g. "-Stage", "+"). */
  valueSuffix?: string;
  /** Short title shown bold beneath/beside the icon. */
  label: string;
  description: string;
  accent: "orange" | "blue";
};

const STATS: StatItem[] = [
  {
    icon: Layers,
    value: 8,
    label: "Expertise Modules",
    description: "Structured capability domains",
    accent: "orange",
  },
  {
    icon: Globe,
    value: 7,
    label: "Ecosystem Platforms",
    description: "Connected operating network",
    accent: "blue",
  },
  {
    icon: Route,
    value: 8,
    valueSuffix: "-Stage",
    label: "Growth Process",
    description: "From vision to scale",
    accent: "orange",
  },
  {
    icon: Bot,
    label: "AI-Governed Workflows",
    description: "Controlled automation",
    accent: "blue",
  },
  {
    icon: ShieldCheck,
    label: "Evidence-Controlled Publishing",
    description: "Quality assurance gates",
    accent: "orange",
  },
  {
    icon: Activity,
    value: 6,
    label: "AI Agent Statuses",
    description: "Monitored intelligence layer",
    accent: "blue",
  },
  {
    icon: MapPin,
    label: "Bangladesh Market Insight",
    description: "Local expertise, global reach",
    accent: "orange",
  },
  {
    icon: GraduationCap,
    label: "University Partnerships",
    description: "Institutional collaboration",
    accent: "blue",
  },
];

/**
 * AnimatedNumber — counts up from 0 → target when first scrolled into view.
 * Uses framer-motion's `animate()` for smooth easing + a spring for the
 * live value. Returns null when target is null/undefined so non-numeric
 * stats simply render nothing instead of "NaN".
 */
function AnimatedNumber({
  target,
  duration = 1.4,
}: {
  target: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 22 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [inView, target, duration, mv]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => setDisplay(Math.round(v)));
    return () => unsub();
  }, [spring]);

  return (
    <span
      ref={ref}
      className="tabular-nums tracking-tight"
      aria-label={String(target)}
    >
      {display}
    </span>
  );
}

function StatPill({ stat }: { stat: StatItem }) {
  const Icon = stat.icon;
  const iconColor = stat.accent === "orange" ? "text-orange-600" : "text-blue-600";
  const badgeBg = stat.accent === "orange" ? "bg-orange-50" : "bg-blue-50";
  const badgeHoverBg = stat.accent === "orange" ? "group-hover:bg-orange-100" : "group-hover:bg-blue-100";
  const dotColor = stat.accent === "orange" ? "bg-orange-500" : "bg-blue-500";

  return (
    <span className="group/pill inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-2 py-1 transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 focus-visible:ring-offset-1 focus-visible:ring-offset-blue-50/30">
      <span
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${badgeBg} ${badgeHoverBg} transition-all duration-200 group-hover/pill:scale-110 group-hover/pill:rotate-3`}
      >
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="flex items-baseline gap-1 text-xs font-bold uppercase tracking-wide text-ink-900 transition-colors group-hover/pill:text-orange-700">
          {stat.value != null && (
            <AnimatedNumber target={stat.value} />
          )}
          {stat.valueSuffix && (
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-500 group-hover/pill:text-orange-600/80">
              {stat.valueSuffix}
            </span>
          )}
          <span className="ml-0.5">{stat.label}</span>
        </span>
        <span className="text-[10px] font-medium text-ink-500">
          {stat.description}
        </span>
      </span>
      {/* Dot separator */}
      <span
        className={`ml-3 inline-block h-1 w-1 shrink-0 rounded-full ${dotColor} opacity-60 transition-opacity group-hover/pill:opacity-100`}
        aria-hidden
      />
    </span>
  );
}

/**
 * StatsTicker — a horizontal marquee that scrolls platform capability
 * stats between the Hero and ExecutiveIntro sections.
 *
 * Uses pure CSS animation (no JS scroll driver) for buttery-smooth
 * performance. Pauses on hover / focus. Duplicates items to create
 * the seamless infinite-scroll illusion. Numeric values animate with
 * a count-up when the ticker first scrolls into view.
 */
export function StatsTicker() {
  return (
    <section
      aria-label="Platform statistics"
      className="relative overflow-hidden border-y border-ink-200/60 bg-blue-50/30 py-3"
    >
      {/* Fade edges */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-blue-50/30 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-blue-50/30 to-transparent"
        aria-hidden
      />

      {/* Marquee track — duplicated for seamless loop */}
      <div className="group flex animate-marquee hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
        {/** First set */}
        <div className="flex shrink-0 items-center gap-6 pr-6">
          {STATS.map((stat, i) => (
            <StatPill key={`a-${i}`} stat={stat} />
          ))}
        </div>
        {/** Duplicate set for seamless loop */}
        <div className="flex shrink-0 items-center gap-6 pr-6" aria-hidden>
          {STATS.map((stat, i) => (
            <StatPill key={`b-${i}`} stat={stat} />
          ))}
        </div>
        {/** Third set for wider screens */}
        <div className="flex shrink-0 items-center gap-6 pr-6" aria-hidden>
          {STATS.map((stat, i) => (
            <StatPill key={`c-${i}`} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
