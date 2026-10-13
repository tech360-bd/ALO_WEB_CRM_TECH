"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  ClipboardCheck,
  TrendingUp,
  GraduationCap,
  Building2,
  Sparkles,
  Database,
  Mic,
  ArrowUpRight,
  Users,
  Target,
  FileOutput,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading, SectionWrap } from "./section-primitives";
import { DetailModal, ModalField } from "../detail-modal";

type Engagement = {
  id: string;
  title: string;
  audience: string;
  challenge: string;
  output: string;
  prep: string;
  icon: LucideIcon;
  accent: "blue" | "orange";
};

const ENGAGEMENTS: Engagement[] = [
  {
    id: "consultation",
    title: "Strategic Consultation",
    audience: "Business, operations, growth, education or technology",
    challenge: "You need a sounding board on a complex strategic decision.",
    output: "Clear direction, prioritisation and next steps.",
    prep: "Share context and current state ahead of the session.",
    icon: Briefcase,
    accent: "blue",
  },
  {
    id: "operations-review",
    title: "Operations Review",
    audience: "Operations leaders and founders",
    challenge: "Workflows, roles, bottlenecks and reporting are unclear.",
    output: "Operations diagnosis and improvement roadmap.",
    prep: "Bring current org chart and key process notes.",
    icon: ClipboardCheck,
    accent: "orange",
  },
  {
    id: "sales-review",
    title: "Sales System Review",
    audience: "Founders, sales leaders",
    challenge: "Lead capture, follow-up, conversion and accountability are inconsistent.",
    output: "Stage-based pipeline with SLAs and reporting.",
    prep: "Share current pipeline and conversion notes.",
    icon: TrendingUp,
    accent: "blue",
  },
  {
    id: "education-advisory",
    title: "Education-Business Advisory",
    audience: "Education business owners",
    challenge: "Student journeys, counselling, admissions and partnerships need structure.",
    output: "Operating system for your education business.",
    prep: "Share your student journey and team structure.",
    icon: GraduationCap,
    accent: "orange",
  },
  {
    id: "university-partnership",
    title: "University Partnership Discussion",
    audience: "Universities and education providers",
    challenge: "Considering Bangladesh market entry or expansion.",
    output: "Partnership strategy and collaboration pathway.",
    prep: "Share your institution's goals and timeline.",
    icon: Building2,
    accent: "blue",
  },
  {
    id: "ai-discovery",
    title: "AI & Automation Discovery",
    audience: "Founders, operators",
    challenge: "You want AI to help but not lose control.",
    output: "Safe, practical automation opportunities and governance plan.",
    prep: "List current manual workflows and tools.",
    icon: Sparkles,
    accent: "orange",
  },
  {
    id: "crm-planning",
    title: "CRM & Digital System Planning",
    audience: "Founders, operations",
    challenge: "You need requirements, architecture and an implementation plan.",
    output: "CRM blueprint with workflows and rollout plan.",
    prep: "Share current tools and pain points.",
    icon: Database,
    accent: "blue",
  },
  {
    id: "speaking-media",
    title: "Speaking & Media",
    audience: "Events, interviews, panels",
    challenge: "You need a credible voice on operations, education or AI.",
    output: "Prepared, evidence-led contribution.",
    prep: "Share event details and audience.",
    icon: Mic,
    accent: "orange",
  },
];

export function WorkWithMe() {
  const [active, setActive] = useState<Engagement | null>(null);

  return (
    <SectionWrap id="work-with-me" className="bg-ink-50/60 dark:bg-ink-900/50">
      <SectionHeading
        eyebrow="Work With Me"
        title={
          <>
            Eight engagement types —{" "}
            <span className="text-grad-intelligence">each with clear audience, output and prep</span>.
          </>
        }
        description="Eight focused ways to engage, each with its audience, common challenge, expected output and how to start. Engagement details are discussed after an initial review of your requirements. Click any card to review the brief."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ENGAGEMENTS.map((e, i) => (
          <motion.button
            key={e.id}
            type="button"
            onClick={() => setActive(e)}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className={`group relative flex flex-col rounded-2xl border bg-white dark:bg-ink-900 p-5 text-left shadow-soft dark:shadow-none transition-all hover:-translate-y-1 hover:shadow-card dark:hover:shadow-none card-hover-sweep ${e.accent === "blue" ? "hover-glow-blue" : "hover-glow-orange"} ${
              e.accent === "blue" ? "border-blue-100 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-600/50" : "border-orange-100 dark:border-orange-800/30 hover:border-orange-300 dark:hover:border-orange-600/50"
            }`}
          >
            {/* Accent top bar */}
            <div
              className="absolute left-4 right-4 top-0 h-0.5 rounded-b-full opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                background: e.accent === "blue" ? "linear-gradient(90deg, #0B63CE, #3B91F5)" : "linear-gradient(90deg, #F26113, #FF751F)",
              }}
            />
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 icon-hover-scale ${
                e.accent === "blue"
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
              }`}
            >
              <e.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-display text-sm font-bold leading-snug text-ink-900">
              {e.title}
            </h3>
            <div className="mt-3 space-y-2 text-xs">
              <div>
                <div className="font-semibold uppercase tracking-wider text-ink-400">Audience</div>
                <div className="text-ink-600">{e.audience}</div>
              </div>
              <div>
                <div className="font-semibold uppercase tracking-wider text-ink-400">Challenge</div>
                <div className="text-ink-600">{e.challenge}</div>
              </div>
              <div>
                <div className="font-semibold uppercase tracking-wider text-ink-400">Output</div>
                <div className="text-ink-700">{e.output}</div>
              </div>
              <div>
                <div className="font-semibold uppercase tracking-wider text-ink-400">Prep</div>
                <div className="text-ink-600">{e.prep}</div>
              </div>
            </div>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400"
              style={{ color: e.accent === "blue" ? "#0B63CE" : "#F26113" }}
            >
              View engagement brief
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 arrow-hover-animate" />
            </span>
          </motion.button>
        ))}
      </div>

      {/* Engagement detail modal */}
      <DetailModal
        open={!!active}
        onClose={() => setActive(null)}
        eyebrow="Engagement Brief"
        accent={active?.accent === "orange" ? "momentum" : "intelligence"}
        title={active?.title ?? ""}
        footer={
          <a
            href="#contact"
            onClick={() => setActive(null)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
          >
            <ArrowUpRight className="h-4 w-4" />
            Start this inquiry
          </a>
        }
      >
        {active && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span
                className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  active.accent === "blue"
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                }`}
              >
                <active.icon className="h-6 w-6" />
              </span>
              <p className="text-sm leading-relaxed text-ink-600">
                A structured engagement type with a defined audience, typical challenge, expected
                output and the preparation that makes the session productive. Fees are not
                published publicly — they are confirmed through the inquiry flow.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ModalField
                label="Intended audience"
                accent="blue"
                value={
                  <span className="inline-flex items-start gap-2">
                    <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                    {active.audience}
                  </span>
                }
              />
              <ModalField
                label="Common challenge"
                accent="orange"
                value={
                  <span className="inline-flex items-start gap-2">
                    <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-600" />
                    {active.challenge}
                  </span>
                }
              />
              <ModalField
                label="Expected output"
                accent="blue"
                value={
                  <span className="inline-flex items-start gap-2">
                    <FileOutput className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                    {active.output}
                  </span>
                }
              />
              <ModalField
                label="Typical preparation"
                accent="ink"
                value={
                  <span className="inline-flex items-start gap-2">
                    <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                    {active.prep}
                  </span>
                }
              />
            </div>

            <div className="rounded-xl border border-blue-100 dark:border-blue-800/30 bg-blue-50/40 dark:bg-blue-900/20 p-4 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
              <strong className="font-semibold text-ink-800 dark:text-ink-200">How to start.</strong> Use the
              multi-step contact form below to submit an inquiry. Select the matching inquiry type,
              share your context, and you will receive a reference number for tracking. Most
              inquiries receive an acknowledgement within one business day.
            </div>
          </div>
        )}
      </DetailModal>
    </SectionWrap>
  );
}
