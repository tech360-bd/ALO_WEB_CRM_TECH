"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  GitBranch,
  Bot,
  ScanSearch,
  CheckCircle2,
  Send,
  Cpu,
} from "lucide-react";
import { SectionHeading, SectionWrap } from "./section-primitives";
import { AI_WORKFLOW_STEPS, AI_AGENT_STATUSES } from "@/lib/site-data";

const STEP_ICONS = [Send, KeyRound, GitBranch, Bot, Cpu, ScanSearch, CheckCircle2, ShieldCheck];

const STATUS_STYLE: Record<string, string> = {
  "in-testing": "bg-amber-900/40 text-amber-300 ring-amber-700/40",
  planned: "bg-ink-800/40 text-ink-300 ring-ink-700/40",
};

export function AloLabs() {
  return (
    <SectionWrap id="alo-labs" dark className="bg-ink-950">
      {/* ambient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 18% 10%, rgba(11,99,206,0.28), transparent 42%), radial-gradient(circle at 82% 14%, rgba(242,97,19,0.20), transparent 40%)",
        }}
      />
      <div className="relative">
        <SectionHeading
          dark
          eyebrow="ALO Labs Connection"
          title={
            <>
              One central AI workforce. Multiple business ecosystems.{" "}
              <span className="text-grad-momentum">Controlled by people.</span>
            </>
          }
          description="AI agents would live centrally in ALO Labs. Alaminn.info would request approved workflows; outputs return as drafts, sensitive tasks require permission, public content requires human approval, and all activity is logged."
        />

        {/* Workflow visual */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <div className="eyebrow text-orange-300">Governed AI Workflow</div>
            <div className="text-[11px] text-blue-200">8-stage approval pipeline</div>
          </div>

          <div className="grid gap-3 lg:grid-cols-8">
            {AI_WORKFLOW_STEPS.map((step, i) => {
              const Icon = STEP_ICONS[i] ?? ShieldCheck;
              const isGate = i === 6; // Human Approval
              return (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className="relative"
                >
                  <div
                    className={`flex h-full flex-col rounded-2xl border p-3 transition-colors ${
                      isGate
                        ? "border-orange-400/50 bg-orange-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                          isGate ? "bg-orange-500 text-white" : "bg-blue-500/20 text-blue-200"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-display text-xs font-bold text-blue-200">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold leading-tight text-white">
                      {step}
                    </div>
                  </div>
                  {/* connector arrow */}
                  {i < AI_WORKFLOW_STEPS.length - 1 && (
                    <div className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-blue-300/40 lg:block">
                      →
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-white/5 p-3 text-xs text-blue-200">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-orange-300" />
              Agents are never duplicated across companies
            </span>
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              HMAC SHA-256 signed webhooks
            </span>
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-300" />
              All activity is logged
            </span>
          </div>
        </div>

        {/* Agent grid */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-white">Agent Hub status</h3>
            <div className="text-xs text-blue-200">Planned capability roadmap</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AI_AGENT_STATUSES.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                whileHover={{ y: -3 }}
                className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/10 hover:shadow-lg hover:shadow-blue-500/10 card-hover-sweep"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-200 transition-transform group-hover:scale-110 group-hover:bg-blue-500/30">
                      <Bot className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-display text-sm font-bold text-white">{agent.name}</div>
                      <div className="text-[11px] text-blue-200">{agent.desc}</div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${
                      STATUS_STYLE[agent.status] ?? STATUS_STYLE.planned
                    }`}
                  >
                    {agent.status.replace("-", " ")}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* governance note */}
        <div className="mt-8 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-sm font-bold text-white">
                AI governance — actions that always require human approval
              </div>
              <p className="mt-1 text-xs leading-relaxed text-blue-100">
                Publishing public content · sending external proposals · changing pricing · altering
                permissions · deleting data · deploying code · accessing private student data · mass
                communications · legal claims · immigration guarantees · approving contracts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionWrap>
  );
}
