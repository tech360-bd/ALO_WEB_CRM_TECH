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

interface PublicResourcesProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface ResourceCard {
  icon: string;
  title: string;
  description: string;
  viewKey: ViewKey;
  slug?: string;
  accent: "blue" | "orange";
  count?: string;
}

const RESOURCE_CATEGORIES: ResourceCard[] = [
  {
    icon: "Newspaper",
    title: "Blog",
    description: "Study tips, country guides, SOP advice, and life-abroad stories from ALO counselors.",
    viewKey: "public-blog",
    accent: "blue",
    count: "Insights",
  },
  {
    icon: "Plane",
    title: "Visa Guide",
    description: "Country-specific visa requirements, financial proof guidance, and credibility interview tips.",
    viewKey: "public-visa-support",
    accent: "orange",
    count: "8 countries",
  },
  {
    icon: "Award",
    title: "Scholarship Finder",
    description: "Search hundreds of scholarships for Bangladeshi students by country, level, and subject.",
    viewKey: "scholarship-finder",
    accent: "blue",
    count: "Curated",
  },
  {
    icon: "Sparkles",
    title: "Success Stories",
    description: "Real student testimonials — published only with explicit consent. Never fabricated.",
    viewKey: "public-success-stories",
    accent: "orange",
    count: "Verified",
  },
  {
    icon: "Lightbulb",
    title: "Application Tips",
    description: "How to write a winning SOP, choose recommenders, and ace admissions interviews.",
    viewKey: "public-application-process",
    accent: "blue",
    count: "12 steps",
  },
  {
    icon: "Luggage",
    title: "Pre-Departure",
    description: "Everything you need to know before you fly: flights, banking, SIM cards, and packing.",
    viewKey: "public-services",
    slug: "pre-departure-support",
    accent: "orange",
    count: "Free service",
  },
  {
    icon: "Home",
    title: "Accommodation",
    description: "On-campus vs off-campus, budget estimates, and how to avoid accommodation scams.",
    viewKey: "public-services",
    slug: "accommodation-guidance",
    accent: "blue",
    count: "Free service",
  },
  {
    icon: "Wallet",
    title: "Financial Planning",
    description: "Budget for tuition, living costs, and visa fees. Bank account setup and education loans.",
    viewKey: "public-services",
    slug: "financial-proof-guidance",
    accent: "orange",
    count: "Free service",
  },
  {
    icon: "HelpCircle",
    title: "FAQ",
    description: "Answers to the 25+ most common questions Bangladeshi students ask us.",
    viewKey: "public-faq",
    accent: "blue",
    count: "25+ answers",
  },
  {
    icon: "Mic",
    title: "Interview Prep",
    description: "Mock interviews for credibility, admissions, scholarship, and pre-CAS interviews.",
    viewKey: "public-services",
    slug: "interview-preparation",
    accent: "orange",
    count: "AI + counselor",
  },
  {
    icon: "Files",
    title: "Documents",
    description: "Complete document checklist for every country and study level. Free review service.",
    viewKey: "public-admission-requirements",
    accent: "blue",
    count: "By level",
  },
  {
    icon: "Languages",
    title: "English Tests",
    description: "IELTS, PTE, TOEFL, Duolingo, GRE, GMAT — free AI-scored mock tests for all ALO students.",
    viewKey: "public-exams",
    accent: "orange",
    count: "10 tests",
  },
];

const FEATURED_RESOURCES = [
  { icon: "TrendingUp", title: "Top 10 Scholarships for Bangladeshi Students", viewKey: "public-blog" as ViewKey, slug: "top-10-scholarships-for-bangladeshi-students", category: "Scholarships" },
  { icon: "Plane", title: "UK Student Visa 2025 Complete Guide", viewKey: "public-blog" as ViewKey, slug: "uk-student-visa-2025-complete-guide", category: "Visa Guide" },
  { icon: "FileText", title: "Writing a Winning SOP: 7 Tips", viewKey: "public-blog" as ViewKey, slug: "writing-a-winning-sop-7-tips", category: "Application" },
  { icon: "Luggage", title: "Pre-Departure Checklist: UK", viewKey: "public-blog" as ViewKey, slug: "pre-departure-checklist-uk", category: "Pre-Departure" },
];

export function PublicResources({ onNavigate }: PublicResourcesProps) {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[#0066CC]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Resources" },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge className="bg-[#FFF3EA] text-[#F37021] border border-[#F37021]/20 hover:bg-[#FFF3EA]">
              <Icon name="BookOpen" className="mr-1 size-3" />
              Knowledge Hub
            </Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0B2447] sm:text-5xl">
              Study Abroad <span className="text-[#0066CC]">Resources</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#5A7299] sm:text-lg">
              Everything you need to plan your study abroad journey — in one place. Visa guides, scholarship finders,
              application tips, English test prep, pre-departure support, and more. All verified weekly against
              official sources.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => onNavigate("public-search")} className="h-12 bg-[#0066CC] px-6 text-white hover:bg-[#0066CC]/90">
                <Icon name="Search" className="size-4" />
                Search All Resources
              </Button>
              <Button onClick={() => onNavigate("public-contact")} variant="outline" className="h-12 border-[#F37021]/30 bg-white px-6 text-[#F37021] hover:bg-[#FFF3EA]">
                <Icon name="Phone" className="size-4" />
                Ask a Question
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
        {/* Resource grid */}
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[#F37021]">Browse by category</p>
          <h2 className="mt-2 text-3xl font-black text-[#0B2447]">All ALO Resources</h2>
          <p className="mt-2 text-sm text-[#5A7299]">{RESOURCE_CATEGORIES.length} resource categories — all free for students.</p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RESOURCE_CATEGORIES.map((r) => (
            <Card
              key={r.title}
              className="alo-card-hover group cursor-pointer rounded-2xl border border-[#E2E8F0] bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
              onClick={() => onNavigate(r.viewKey, r.slug)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className={cn(
                    "flex size-12 items-center justify-center rounded-2xl",
                    r.accent === "blue" ? "bg-[#EAF3FF] text-[#0066CC]" : "bg-[#FFF3EA] text-[#F37021]"
                  )}>
                    <Icon name={r.icon} className="size-6" />
                  </div>
                  {r.count && (
                    <Badge variant="outline" className="bg-[#F7FAFE] text-[#5A7299]">{r.count}</Badge>
                  )}
                </div>
                <h3 className="mt-4 text-base font-bold text-[#0B2447] group-hover:text-[#0066CC]">{r.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#5A7299]">{r.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#0066CC]">
                  Explore
                  <Icon name="ArrowRight" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Featured articles */}
        <div className="mt-16">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0066CC]">Featured Articles</p>
              <h2 className="mt-2 text-2xl font-black text-[#0B2447]">Top reads this month</h2>
            </div>
            <Button onClick={() => onNavigate("public-blog")} variant="outline" className="h-11 border-[#0066CC]/30 bg-white text-[#0066CC] hover:bg-[#EAF3FF]">
              View All
              <Icon name="ArrowRight" className="size-4" />
            </Button>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED_RESOURCES.map((r) => (
              <Card
                key={r.title}
                className="alo-card-hover group cursor-pointer rounded-2xl border border-[#E2E8F0] bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => onNavigate(r.viewKey, r.slug)}
              >
                <CardContent className="p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#0066CC]">
                    <Icon name={r.icon} className="size-5" />
                  </div>
                  <Badge variant="outline" className="mt-3 bg-[#F7FAFE] text-[#5A7299] text-[10px]">{r.category}</Badge>
                  <h3 className="mt-2 line-clamp-3 text-sm font-bold text-[#0B2447] group-hover:text-[#0066CC]">{r.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-16">
          <SectionCard
            title="What we monitor and verify"
            description="Every piece of advice on this website is checked against official sources weekly."
            icon="ShieldCheck"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Official sources monitored", value: "97", icon: "Globe" },
                { label: "Universities verified", value: "408", icon: "Building2" },
                { label: "Courses tracked", value: "794", icon: "BookOpen" },
                { label: "Countries covered", value: "13", icon: "MapPin" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-[#0066CC]/15 bg-[#EAF3FF]/40 p-4">
                  <Icon name={s.icon} className="size-5 text-[#0066CC]" />
                  <p className="mt-2 text-2xl font-black text-[#0B2447]">{s.value}</p>
                  <p className="text-xs text-[#5A7299]">{s.label}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* CTA */}
        <div className="mt-12">
          <PublicLeadForm
            sourceTag="Resources page — bottom CTA"
            title="Can't find what you're looking for?"
            subtitle="Send us your question and a counselor will respond within 24 hours with personalised guidance."
          />
        </div>
      </div>
    </div>
  );
}
export default PublicResources;
