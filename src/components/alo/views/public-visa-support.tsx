"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Icon,
  SectionCard,
} from "@/components/alo/shared";
import { Breadcrumb, Disclaimer } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { type ViewKey } from "@/lib/alo-types";

interface PublicVisaSupportProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

const COUNTRY_GUIDANCE = [
  {
    slug: "uk",
    name: "United Kingdom",
    flag: "🇬🇧",
    visaType: "Student Visa (formerly Tier 4)",
    processingTime: "3 weeks standard, 5 days priority (£500), 24 hours super-priority (£1,000)",
    fee: "£490 + Immigration Health Surcharge (£776/year)",
    keyFacts: ["CAS required from university", "Credibility interview required for most applicants", "Funds must be held for 28 consecutive days", "TB test required from Bangladesh"],
  },
  {
    slug: "usa",
    name: "United States",
    flag: "🇺🇸",
    visaType: "F-1 Student Visa",
    processingTime: "3-5 days after interview (wait times for interview vary by embassy)",
    fee: "$185 + SEVIS fee $350",
    keyFacts: ["I-20 form required from university", "DS-160 form + visa interview required", "Must prove strong ties to Bangladesh (return intent)", "On-campus work only (20hrs/week) in first year"],
  },
  {
    slug: "canada",
    name: "Canada",
    flag: "🇨🇦",
    visaType: "Study Permit",
    processingTime: "8-12 weeks (SDS discontinued)",
    fee: "CAD $150 + biometrics $85",
    keyFacts: ["LOA (Letter of Acceptance) from DLI required", "Financial proof: CAD $20,635 + tuition + travel", "Biometrics at VAC Dhaka", "PGWP available after graduation"],
  },
  {
    slug: "australia",
    name: "Australia",
    flag: "🇦🇺",
    visaType: "Subclass 500 Student Visa",
    processingTime: "4-6 weeks",
    fee: "AUD $710 + biometrics $150",
    keyFacts: ["CoE (Confirmation of Enrolment) required", "GTE (Genuine Temporary Entrant) statement", "OSHC health insurance mandatory", "48 hours/fortnight work allowed"],
  },
  {
    slug: "ireland",
    name: "Ireland",
    flag: "🇮🇪",
    visaType: "Long Stay 'D' Visa (Study)",
    processingTime: "4-8 weeks",
    fee: "€60-100",
    keyFacts: ["Letter of acceptance from Irish university", "€10,000 living cost proof + tuition", "Biometrics at VFS Dhaka", "Stamp 2 permission allows part-time work"],
  },
  {
    slug: "new-zealand",
    name: "New Zealand",
    flag: "🇳🇿",
    visaType: "Fee Paying Student Visa",
    processingTime: "4-6 weeks",
    fee: "NZD $295",
    keyFacts: ["Offer letter from NZQA-approved institution", "Living cost proof NZD $20,000/year", "Medical certificate + chest X-ray required", "20 hours/week work allowed"],
  },
  {
    slug: "germany",
    name: "Germany",
    flag: "🇩🇪",
    visaType: "Student Applicant Visa / Student Visa",
    processingTime: "6-12 weeks",
    fee: "€75",
    keyFacts: ["University admission letter required", "Blocked account with €11,208/year", "Health insurance mandatory", "PSW (18 months) to find work after graduation"],
  },
  {
    slug: "dubai",
    name: "Dubai / UAE",
    flag: "🇦🇪",
    visaType: "Student Residence Visa",
    processingTime: "2-4 weeks",
    fee: "AED 1,000-1,500",
    keyFacts: ["Sponsored by the university", "Medical fitness test required", "Emirates ID card issued", "No work allowed on student visa"],
  },
];

const VISA_SERVICES = [
  { icon: "ListChecks", title: "Visa Document Checklist", description: "Country-specific checklist with every document you need, in the format required by visa officers." },
  { icon: "Wallet", title: "Financial Proof Guidance", description: "Calculate exact funds required, prepare bank statements, sponsor letters, and source-of-funds explanations." },
  { icon: "MessageSquare", title: "Credibility Interview Prep", description: "Mock credibility interviews with real ALO visa officers, plus recorded sessions for self-review." },
  { icon: "ShieldCheck", title: "Refusal Prevention", description: "Pre-submission review to identify the top 10 reasons Bangladeshi students get refused — and how to avoid them." },
  { icon: "FileSearch", title: "Document Review", description: "Every document reviewed for accuracy, formatting, and completeness before submission." },
  { icon: "Plane", title: "Pre-Departure Support", description: "After visa approval: flights, airport pickup, accommodation, banking setup, and orientation." },
];

const REFUSAL_REASONS = [
  { reason: "Insufficient funds or sudden large deposits", prevention: "Maintain consistent bank balance for 6+ months. Explain any large deposits with documented source." },
  { reason: "Weak SOP that doesn't show genuine student intent", prevention: "Personalized SOP coaching. Avoid generic templates. Show specific career plan." },
  { reason: "Inconsistencies between SOP, financial documents, and interview answers", prevention: "Cross-check every document. Practice mock interviews to ensure consistency." },
  { reason: "Choice of course doesn't align with previous education", prevention: "Justify the course change with clear academic and career reasoning." },
  { reason: "Previous visa refusals not disclosed", prevention: "Always disclose previous refusals. We help frame them constructively." },
  { reason: "English level below visa requirement", prevention: "Take IELTS UKVI (not just academic IELTS) if your university place is conditional." },
  { reason: "No clear post-study plan", prevention: "Articulate a clear plan to return to Bangladesh or pursue post-study work visa legitimately." },
  { reason: "Sponsor's income doesn't match bank balance", prevention: "Provide sponsor's tax returns, business registration, and source-of-funds documentation." },
];

export function PublicVisaSupport({ onNavigate }: PublicVisaSupportProps) {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[var(--alo-brand)]/10 bg-gradient-to-br from-[var(--alo-brand-light)] via-white to-[var(--alo-cta-soft)]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Visa Support" },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge className="bg-[var(--alo-cta-soft)] text-[var(--alo-cta)] border border-[var(--alo-cta)]/20 hover:bg-[var(--alo-cta-soft)]">
              <Icon name="Plane" className="mr-1 size-3" />
              Verified Weekly
            </Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[var(--alo-text)] sm:text-5xl">
              Visa Support &amp; <span className="text-[var(--alo-brand)]">Guidance</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--alo-text-muted)] sm:text-lg">
              Your visa is the most critical step of your study-abroad journey. Our visa officers have handled
              hundreds of UK, USA, Canada, Australia, Ireland, and New Zealand student visa applications — and
              we monitor 25 government sources weekly so our advice is always current.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => onNavigate("public-contact")} className="h-12 bg-[var(--alo-cta)] px-6 text-white hover:bg-[var(--alo-cta-hover)]">
                <Icon name="CalendarCheck" className="size-4" />
                Book Visa Consultation
              </Button>
              <Button onClick={() => onNavigate("public-services", "visa-support")} variant="outline" className="h-12 border-[var(--alo-brand)]/30 bg-white px-6 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]">
                <Icon name="Briefcase" className="size-4" />
                View Visa Service
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* VISA SERVICES */}
      <section>
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--alo-cta)]">Our Visa Services</p>
            <h2 className="mt-2 text-3xl font-black text-[var(--alo-text)]">Everything you need for a successful visa</h2>
            <p className="mt-2 text-sm text-[var(--alo-text-muted)]">All free for ALO students.</p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VISA_SERVICES.map((s) => (
              <Card key={s.title} className="alo-card-hover rounded-2xl border border-[var(--alo-border)] bg-white transition-all hover:-translate-y-0.5 hover:border-[var(--alo-brand)]/30">
                <CardContent className="p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                    <Icon name={s.icon} className="size-5" />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-[var(--alo-text)]">{s.title}</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--alo-text-muted)]">{s.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* COUNTRY-SPECIFIC GUIDANCE */}
      <section className="bg-[var(--alo-page)]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--alo-brand)]">Country-Specific Guidance</p>
            <h2 className="mt-2 text-3xl font-black text-[var(--alo-text)]">Visa requirements by destination</h2>
            <p className="mt-2 text-sm text-[var(--alo-text-muted)]">Click any country for full requirements, or visit our country pages.</p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COUNTRY_GUIDANCE.map((c) => (
              <Card
                key={c.slug}
                className="alo-card-hover group flex cursor-pointer flex-col rounded-2xl border border-[var(--alo-border)] bg-white transition-all hover:-translate-y-0.5 hover:border-[var(--alo-brand)]/30"
                onClick={() => onNavigate("public-country", c.slug)}
              >
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{c.flag}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-bold text-[var(--alo-text)] group-hover:text-[var(--alo-brand)]">{c.name}</h3>
                      <p className="text-xs text-[var(--alo-text-muted)]">{c.visaType}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-[var(--alo-text-muted)]">
                    <div className="flex items-start gap-2">
                      <Icon name="Clock" className="mt-0.5 size-3.5 shrink-0 text-[var(--alo-brand)]" />
                      <span>{c.processingTime}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="DollarSign" className="mt-0.5 size-3.5 shrink-0 text-[var(--alo-brand)]" />
                      <span>{c.fee}</span>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-[var(--alo-border)] pt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--alo-cta)]">Key facts</p>
                    <ul className="mt-1.5 space-y-1">
                      {c.keyFacts.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--alo-text-muted)]">
                          <Icon name="ChevronRight" className="mt-0.5 size-3 shrink-0 text-[var(--alo-brand)]" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-auto pt-4">
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
 variant="ghost"
 size="sm"
 className=" w-full justify-between px-0 text-[var(--alo-brand)] hover:bg-transparent hover:text-[var(--alo-brand)]"
 >
                      View country page
                      <Icon name="ArrowRight" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* REFUSAL PREVENTION */}
      <section>
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--alo-cta)]">Refusal Prevention</p>
            <h2 className="mt-2 text-3xl font-black text-[var(--alo-text)]">Top 8 reasons Bangladeshi visas get refused</h2>
            <p className="mt-2 text-sm text-[var(--alo-text-muted)]">And how ALO helps you avoid each one.</p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {REFUSAL_REASONS.map((r, i) => (
              <Card key={i} className="rounded-2xl border border-[var(--alo-border)] bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-sm font-black text-red-700">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--alo-text)]">{r.reason}</p>
                      <p className="mt-1 text-xs leading-relaxed text-emerald-700">
                        <Icon name="ShieldCheck" className="mr-1 inline size-3" />
                        Prevention: {r.prevention}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="bg-[var(--alo-page)]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Disclaimer text="Visa and work rules may change frequently. Final requirements must be verified by ALO staff against the official government source at the time of application. This page is updated weekly based on monitoring of 25 official government sources." />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--alo-text)]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-black text-white">Book your visa consultation</h2>
              <p className="mt-3 text-base leading-relaxed text-white/80">
                Speak with an ALO visa officer about your specific case. Free 30-minute consultation — no commitment.
                We'll review your profile, recommend the right destination, and outline a clear path to visa approval.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => onNavigate("public-contact")} className="h-12 bg-[var(--alo-cta)] px-6 text-white hover:bg-[var(--alo-cta-hover)]">
                  <Icon name="CalendarCheck" className="size-4" />
                  Book Consultation
                </Button>
                <Button onClick={() => onNavigate("public-application-process")} variant="outline" className="h-12 border-white/30 bg-transparent px-6 text-white hover:bg-white/10">
                  <Icon name="Route" className="size-4" />
                  See Full Journey
                </Button>
              </div>
            </div>
            <PublicLeadForm
              sourceTag="Visa Support page — bottom CTA"
              title="Talk to a visa officer today"
              subtitle="Submit your details and a visa specialist will reach out within 24 hours."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
export default PublicVisaSupport;
