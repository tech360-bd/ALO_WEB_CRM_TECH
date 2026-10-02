"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Icon,
  SectionCard,
} from "@/components/alo/shared";
import { Breadcrumb } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { type ViewKey } from "@/lib/alo-types";

interface PublicApplicationProcessProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface Step {
  num: number;
  title: string;
  icon: string;
  description: string;
  duration: string;
  serviceSlug?: string;
  serviceLabel?: string;
}

const STEPS: Step[] = [
  { num: 1, title: "Free Counseling", icon: "Headset", description: "Book a free 30-minute session with an ALO counselor. We discuss your goals, review your profile, and recommend destinations, courses, and universities.", duration: "1 day", serviceSlug: "free-counseling", serviceLabel: "View Counseling Service" },
  { num: 2, title: "Profile Review", icon: "UserCheck", description: "We assess your academics, English level, work experience, and finances. Get a clear chance-of-admission estimate for your target universities.", duration: "2-3 days", serviceSlug: "profile-assessment", serviceLabel: "View Profile Assessment" },
  { num: 3, title: "Course Match", icon: "Sparkles", description: "Our AI engine matches your profile against 794 verified courses. A counselor refines the shortlist based on your priorities.", duration: "1-2 days", serviceSlug: "course-matching", serviceLabel: "View Course Matching" },
  { num: 4, title: "University Shortlist", icon: "Building2", description: "We build a balanced 6-10 university list across reach/match/safety tiers — maximising your chance of admission.", duration: "2-3 days", serviceSlug: "university-shortlisting", serviceLabel: "View Shortlisting Service" },
  { num: 5, title: "Document Upload", icon: "Upload", description: "Upload your documents to our secure Document Hub. We review each one for accuracy, formatting, and completeness.", duration: "1-2 weeks", serviceSlug: "document-review", serviceLabel: "View Document Review" },
  { num: 6, title: "Application Submit", icon: "Send", description: "We fill out application forms, upload documents, and submit on your behalf. You review every application before submission.", duration: "1-2 weeks", serviceSlug: "application-support", serviceLabel: "View Application Support" },
  { num: 7, title: "Offer Receive", icon: "MailOpen", description: "Universities respond with conditional or unconditional offers. We help you compare offers and choose the best one.", duration: "4-8 weeks" },
  { num: 8, title: "Deposit / CAS", icon: "CreditCard", description: "Pay your deposit to accept your offer. Receive your CAS (UK), COE (Australia), LOA (Canada) or I-20 (USA).", duration: "1-2 weeks", serviceSlug: "scholarship-guidance", serviceLabel: "View Scholarship Guidance" },
  { num: 9, title: "Visa Preparation", icon: "Files", description: "Receive your country-specific visa checklist. We help prepare bank statements, sponsor letters, and all required documents.", duration: "1-2 weeks", serviceSlug: "visa-checklist", serviceLabel: "View Visa Checklist" },
  { num: 10, title: "Visa Decision", icon: "ShieldCheck", description: "Submit your visa application. Biometrics appointment at VAC Dhaka. Decision typically within 3-8 weeks depending on country.", duration: "3-8 weeks", serviceSlug: "visa-support", serviceLabel: "View Visa Support" },
  { num: 11, title: "Pre-Departure", icon: "Luggage", description: "Book flights, arrange airport pickup, finalise accommodation, attend pre-departure briefing. We don't disappear after visa approval.", duration: "2-4 weeks", serviceSlug: "pre-departure-support", serviceLabel: "View Pre-Departure Service" },
  { num: 12, title: "Enrollment", icon: "GraduationCap", description: "Arrive in your destination country. We support your first 90 days: bank account, GP registration, BRP collection, settling in.", duration: "First 90 days", serviceSlug: "post-arrival-support", serviceLabel: "View Post-Arrival Support" },
];

export function PublicApplicationProcess({ onNavigate }: PublicApplicationProcessProps) {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[#0B5ED7]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Application Process" },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge className="bg-[#FFF3EA] text-[#F97316] border border-[#F97316]/20 hover:bg-[#FFF3EA]">
              <Icon name="Route" className="mr-1 size-3" />
              12-Step Journey
            </Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0B2447] sm:text-5xl">
              Your Study Abroad <span className="text-[#0B5ED7]">Journey</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#5A7299] sm:text-lg">
              From your first counseling session to your first day at university — here's the complete 12-step
              journey, with average timelines, what to expect at each step, and which ALO service supports you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => onNavigate("public-contact")} className="h-12 bg-[#F97316] px-6 text-white hover:bg-[#c8451a]">
                <Icon name="CalendarCheck" className="size-4" />
                Start Your Journey
              </Button>
              <Button onClick={() => onNavigate("public-services")} variant="outline" className="h-12 border-[#0B5ED7]/30 bg-white px-6 text-[#0B5ED7] hover:bg-[#EAF3FF]">
                <Icon name="Briefcase" className="size-4" />
                View All Services
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[#F97316]">12 Steps to Enrollment</p>
          <h2 className="mt-2 text-3xl font-black text-[#0B2447]">Your journey, mapped out</h2>
          <p className="mt-2 text-sm text-[#5A7299]">Total typical duration: 6-12 months from first call to landing abroad.</p>
        </div>

        <div className="relative mt-12">
          {/* Vertical line for desktop */}
          <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#0B5ED7] via-[#F97316] to-[#0B5ED7] hidden lg:block" />

          <div className="space-y-6 lg:space-y-0">
            {STEPS.map((step, idx) => (
              <div key={step.num} className="relative">
                <div className="grid gap-4 lg:grid-cols-[3rem_1fr] lg:items-start">
                  {/* Number circle */}
                  <div className="flex justify-center lg:justify-end">
                    <div className={cn(
                      "relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-black text-white",
                      step.num <= 4 ? "bg-[#0B5ED7]" : step.num <= 8 ? "bg-alo-gradient" : "bg-[#F97316]"
                    )}>
                      {step.num}
                    </div>
                  </div>

                  {/* Card */}
                  <Card className={cn(
                    "alo-card-hover rounded-2xl border bg-white transition-all hover:shadow-lg",
                    step.num <= 4 ? "border-[#0B5ED7]/20" : step.num <= 8 ? "border-[#0B5ED7]/15" : "border-[#F97316]/20"
                  )}>
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              "flex size-9 items-center justify-center rounded-xl",
                              step.num <= 4 ? "bg-[#EAF3FF] text-[#0B5ED7]" : step.num <= 8 ? "bg-[#EAF3FF] text-[#0B5ED7]" : "bg-[#FFF3EA] text-[#F97316]"
                            )}>
                              <Icon name={step.icon} className="size-5" />
                            </div>
                            <h3 className="text-base font-bold text-[#0B2447]">
                              <span className="text-[#5A7299]">Step {step.num}:</span> {step.title}
                            </h3>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-[#5A7299]">{step.description}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant="outline" className="bg-[#F7FAFE] text-[#5A7299]">
                              <Icon name="Clock" className="mr-1 size-3" />
                              {step.duration}
                            </Badge>
                            {step.serviceSlug && (
                              <button
                                onClick={() => onNavigate("public-services", step.serviceSlug!)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B5ED7] hover:underline"
                              >
                                {step.serviceLabel}
                                <Icon name="ArrowRight" className="size-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why timeline matters */}
        <div className="mt-16">
          <SectionCard
            title="Why the timeline matters"
            description="Understanding your journey helps you plan ahead and avoid rushed decisions."
            icon="Lightbulb"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-[#0B5ED7]/15 bg-[#EAF3FF]/40 p-4">
                <Icon name="Calendar" className="size-5 text-[#0B5ED7]" />
                <h4 className="mt-2 text-sm font-bold text-[#0B2447]">Plan 12 months ahead</h4>
                <p className="mt-1 text-xs leading-relaxed text-[#5A7299]">Top universities have deadlines 8-10 months before intake. Don't start late.</p>
              </div>
              <div className="rounded-xl border border-[#F97316]/15 bg-[#FFF3EA]/40 p-4">
                <Icon name="ShieldCheck" className="size-5 text-[#F97316]" />
                <h4 className="mt-2 text-sm font-bold text-[#0B2447]">Avoid visa refusals</h4>
                <p className="mt-1 text-xs leading-relaxed text-[#5A7299]">Most refusals happen when students rush visa applications. Give yourself 8+ weeks.</p>
              </div>
              <div className="rounded-xl border border-[#0B5ED7]/15 bg-[#EAF3FF]/40 p-4">
                <Icon name="DollarSign" className="size-5 text-[#0B5ED7]" />
                <h4 className="mt-2 text-sm font-bold text-[#0B2447]">Stagger your expenses</h4>
                <p className="mt-1 text-xs leading-relaxed text-[#5A7299]">Application fees, deposits, visa fees, flights — spread across 6-12 months helps cash flow.</p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* CTA */}
        <div className="mt-12">
          <PublicLeadForm
            sourceTag="Application Process page — bottom CTA"
            title="Ready to start your journey?"
            subtitle="Book your free counseling session today. Step 1 takes 30 minutes — and the rest is on us."
          />
        </div>
      </div>
    </div>
  );
}
export default PublicApplicationProcess;
