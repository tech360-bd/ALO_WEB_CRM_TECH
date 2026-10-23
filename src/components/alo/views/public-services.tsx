"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, SectionCard, EmptyState } from "@/components/alo/shared";
import { type ViewKey } from "@/lib/alo-types";

interface Props {
  slug?: string;
  onNavigate: (v: ViewKey, s?: string) => void;
}

const SERVICES = [
  { slug: "personalized-counselling", icon: "MessageCircle", title: "Personalized Counseling", desc: "One-on-one guidance from expert counselors to map your study abroad journey." },
  { slug: "university-selection", icon: "Building2", title: "University Selection", desc: "Shortlist universities based on ranking, tuition, location, and acceptance likelihood." },
  { slug: "course-matching", icon: "Search", title: "Course Matching", desc: "Find the perfect course from 467+ programs matched to your profile and budget." },
  { slug: "application-assistance", icon: "FileText", title: "Application Assistance", desc: "Complete application filing — from form filling to document submission." },
  { slug: "sop-cv-support", icon: "PenLine", title: "SOP & CV Support", desc: "AI-assisted Statement of Purpose and CV building with counselor review." },
  { slug: "document-checking", icon: "FolderCheck", title: "Document Checking", desc: "Thorough verification of all your documents before submission." },
  { slug: "visa-guidance", icon: "Plane", title: "Visa Guidance", desc: "Complete visa application guidance — checklist, financials, and interview prep." },
  { slug: "interview-preparation", icon: "Users", title: "Interview Preparation", desc: "Mock visa and university interviews with detailed scoring and feedback." },
  { slug: "english-test-preparation", icon: "GraduationCap", title: "English Test Preparation", desc: "IELTS, PTE, TOEFL preparation with free mock tests and AI scoring." },
  { slug: "financial-planning", icon: "DollarSign", title: "Financial Planning", desc: "Bank statement, sponsor docs, and source-of-fund preparation guidance." },
  { slug: "scholarship-guidance", icon: "Award", title: "Scholarship Guidance", desc: "Identify and apply for scholarships you're eligible for." },
  { slug: "pre-departure-orientation", icon: "Luggage", title: "Pre-Departure Orientation", desc: "Briefing on travel, accommodation, banking, and cultural adaptation." },
  { slug: "post-arrival-support", icon: "MapPin", title: "Post-Arrival Support", desc: "Airport pickup, SIM card, bank account, and university registration help." },
  { slug: "career-counselling", icon: "Briefcase", title: "Career Counseling", desc: "Career planning and guidance for your post-study journey." },
];

const SERVICE_DETAILS: Record<string, { process: string[]; benefits: string[]; whoFor: string; docs: string[] }> = {
  "personalized-counselling": {
    process: ["Book a free session", "Discuss your goals and background", "Get a personalized roadmap", "Choose your destinations and courses"],
    benefits: ["No cost, no obligation", "Expert counselor with 10+ years experience", "Personalized roadmap", "Clear timeline and cost estimate"],
    whoFor: "Any student considering studying abroad — from HSC graduates to working professionals.",
    docs: ["Academic transcripts (SSC, HSC, Bachelor if applicable)", "English test score (if available)", "Passport copy (if available)"],
  },
  "sop-cv-support": {
    process: ["Share your background", "AI drafts your SOP/CV", "Counselor reviews and refines", "University-specific customization"],
    benefits: ["AI-powered first draft in minutes", "Expert counselor review", "Unlimited revisions", "University-specific tailoring"],
    whoFor: "Students applying to any university that requires a Statement of Purpose or CV.",
    docs: ["Academic history", "Work experience summary", "Career goals statement", "University and course details"],
  },
  "visa-guidance": {
    process: ["Gather visa checklist", "Prepare financial documents", "Complete visa application", "Attend visa interview (if required)"],
    benefits: ["Country-specific guidance", "Document verification", "Financial proof preparation", "Interview coaching"],
    whoFor: "Students who have received a university offer and need to apply for a student visa.",
    docs: ["University offer letter / CAS / eCoE", "Passport (6+ months validity)", "Bank statement (28-day history)", "Sponsor documents", "TB test certificate (if required)"],
  },
};

export function PublicServices({ slug, onNavigate }: Props) {
  // Detail view
  if (slug) {
    const service = SERVICES.find((s) => s.slug === slug);
    if (!service) {
      return (
        <div className="mx-auto max-w-[1280px] px-4 py-20 lg:px-6">
          <EmptyState icon="Search" title="Service not found" description="The service you're looking for doesn't exist." action={<Button onClick={() => onNavigate("public-services")}>View All Services</Button>} />
        </div>
      );
    }
    const details = SERVICE_DETAILS[slug] || { process: ["Contact us to get started", "Get personalized guidance", "Complete your application"], benefits: ["Expert guidance", "Personalized support", "Proven results"], whoFor: "Students seeking study abroad support.", docs: ["Contact us for requirements"] };

    return (
      <div>
        {/* Hero */}
        <section className="relative overflow-hidden bg-alo-hero">
          <div className="mx-auto max-w-[1280px] px-4 py-16 lg:px-6">
            <div className="flex items-center gap-2 text-sm text-[var(--alo-text-muted)]">
              <button onClick={() => onNavigate("public-services")} className="hover:text-[var(--alo-brand)]">Services</button>
              <Icon name="ChevronRight" className="size-4" />
              <span className="text-[var(--alo-brand)]">{service.title}</span>
            </div>
            <div className="mt-6 flex items-start gap-5">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-alo-gradient text-white alo-shadow-lg">
                <Icon name={service.icon} className="size-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[var(--alo-text)] md:text-4xl">{service.title}</h1>
                <p className="mt-2 max-w-2xl text-lg text-[var(--alo-text-muted)]">{service.desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <SectionCard title="How It Works" icon="GitBranch">
                <div className="space-y-4">
                  {details.process.map((step, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-alo-gradient text-sm font-bold text-white">{i + 1}</div>
                      <p className="pt-1 text-[var(--alo-text)]">{step}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Benefits" icon="Sparkles">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {details.benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--alo-brand-border)] bg-[var(--alo-page)] p-4">
                      <Icon name="CheckCircle2" className="size-5 shrink-0 text-[var(--alo-success)]" />
                      <span className="text-sm font-medium text-[var(--alo-text)]">{b}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Who Is This For?" icon="Users">
                <p className="text-[var(--alo-text)]">{details.whoFor}</p>
              </SectionCard>
            </div>

            <div className="space-y-6">
              <SectionCard title="Required Documents" icon="FolderLock">
                <ul className="space-y-2">
                  {details.docs.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--alo-text)]">
                      <Icon name="FileText" className="mt-0.5 size-4 shrink-0 text-[var(--alo-brand)]" />
                      {d}
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <div className="rounded-2xl bg-alo-gradient p-6 text-center text-white alo-shadow-lg">
                <h3 className="text-xl font-bold">Get Started Today</h3>
                <p className="mt-2 text-sm text-white/90">Book a free consultation with an ALO counselor.</p>
                <Button onClick={() => onNavigate("public-contact")} className="mt-4 w-full bg-white text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]">Book Free Consultation</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Listing view
  return (
    <div>
      <section className="relative overflow-hidden bg-alo-hero">
        <div className="mx-auto max-w-[1280px] px-4 py-16 lg:px-6">
          <Badge variant="outline" className="mb-4 border-[var(--alo-brand)]/30 bg-white/80 text-[var(--alo-brand)] backdrop-blur-sm">
            <Icon name="Sparkles" className="mr-1.5 size-3.5" /> ALO Education Services
          </Badge>
          <h1 className="text-4xl font-black text-[var(--alo-brand)] md:text-5xl">Complete Study Abroad Support</h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--alo-text-muted)]">From your first counseling session to post-arrival support — we're with you every step of the way.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Card key={s.slug} className="alo-card-hover cursor-pointer rounded-2xl border border-[var(--alo-brand-border)] bg-white alo-shadow" onClick={() => onNavigate("public-services", s.slug)}>
              <CardContent className="p-6">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                  <Icon name={s.icon} className="size-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[var(--alo-text)]">{s.title}</h3>
                <p className="mt-2 text-sm text-[var(--alo-text-muted)]">{s.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[var(--alo-brand)]">
                  Learn More <Icon name="ArrowRight" className="size-3.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-[var(--alo-page)] py-16">
        <div className="mx-auto max-w-[1280px] px-4 text-center lg:px-6">
          <h2 className="text-2xl font-bold text-[var(--alo-text)]">Ready to Start Your Journey?</h2>
          <p className="mt-2 text-[var(--alo-text-muted)]">Book a free consultation today and get a personalized study abroad roadmap.</p>
          <Button onClick={() => onNavigate("public-contact")} className="mt-6 rounded-xl bg-[var(--alo-cta)] px-6 py-3 text-white hover:bg-[var(--alo-cta-hover)]">
            <Icon name="CalendarCheck" className="mr-2 size-4" /> Book Free Consultation
          </Button>
        </div>
      </section>
    </div>
  );
}
export default PublicServices;
