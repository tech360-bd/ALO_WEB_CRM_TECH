import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicPage } from "@/components/site/public-chrome";
import { Profile } from "@/components/site/sections/profile";
import { PROFILE } from "@/lib/site-data";
import {
  GraduationCap, Bot, Sparkles, MapPin, Mail, Globe2,
  ArrowUpRight, ShieldCheck, Target, Compass, Award,
  Database, Briefcase, TrendingUp, Users, Lightbulb,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About & Expertise",
  description:
    "Al Aminn — executive operations leader, sales strategist, education-business growth specialist and AI-powered systems builder. Professional profile, biography, career journey, core expertise and selected work.",
};

const PILLARS = [
  {
    icon: Target,
    title: "Operations Leadership",
    body: "Building operating systems that connect strategy, people, process and accountability.",
    capabilities: [
      "Operating system design (strategy → process → accountability → reporting)",
      "Workflow audit and re-engineering for service businesses",
      "Team accountability matrices, daily/weekly cadences",
      "Process documentation and SOP libraries",
    ],
  },
  {
    icon: Compass,
    title: "Sales Strategy & Growth",
    body: "Stage-based pipelines, qualification criteria and follow-up SLAs that turn activity into outcomes.",
    capabilities: [
      "Stage-based opportunity pipeline design (14 stages)",
      "Qualification criteria and follow-up SLAs",
      "Lead capture, attribution and conversion reporting",
      "Sales-to-operations handover systems",
    ],
  },
  {
    icon: GraduationCap,
    title: "International Education",
    body: "Bangladesh market expertise, university partnerships and student-journey design.",
    capabilities: [
      "Counsellor workflow design for student consultancies",
      "Application tracking and compliance-aware document handling",
      "University partnership strategy for the Bangladesh market",
      "Student referral routing with consent",
    ],
  },
  {
    icon: Globe2,
    title: "University Partnerships",
    body: "Institutional collaboration pipelines with due-diligence stages.",
    capabilities: [
      "Institutional collaboration pipelines with due-diligence stages",
      "Bangladesh market entry briefs for universities",
      "Partnership proposal and agreement drafting",
      "Communication and reporting cadences",
    ],
  },
  {
    icon: Bot,
    title: "AI Systems & Automation",
    body: "Governed AI workflows with approval routing, sensitivity tagging and audit logging.",
    capabilities: [
      "Governed AI workspace design with approval routing",
      "Sensitivity tagging and audit logging",
      "AI-assisted content drafts (newsletter, LinkedIn, articles, case studies)",
      "Operations audit and competitor research automation",
    ],
  },
  {
    icon: Database,
    title: "CRM & Digital Transformation",
    body: "Relationship CRM architecture, source attribution and reporting dashboards.",
    capabilities: [
      "Relationship CRM architecture (contacts, opportunities, partnerships)",
      "Source attribution and UTM tracking",
      "Reporting dashboards and analytics",
      "End-to-end technical delivery with documentation and handover",
    ],
  },
];

const CAREER_JOURNEY = [
  {
    phase: "Foundation",
    title: "Operations & Business Systems",
    desc: "Built structured operating systems for service businesses — connecting strategy, process, people and accountability.",
  },
  {
    phase: "Expansion",
    title: "Sales Strategy & Revenue Growth",
    desc: "Designed stage-based pipelines, qualification frameworks and follow-up SLAs that turned activity into measurable outcomes.",
  },
  {
    phase: "Specialisation",
    title: "International Education Operations",
    desc: "Led counselling workflows, application tracking and university partnership development for the Bangladesh market.",
  },
  {
    phase: "Innovation",
    title: "AI Governance & Digital Systems",
    desc: "Architected governed AI workspaces, CRM platforms and digital transformation roadmaps with approval routing and audit trails.",
  },
];

const FOCUS_AREAS = [
  { icon: Briefcase, label: "Business Operations" },
  { icon: TrendingUp, label: "Sales & Revenue Growth" },
  { icon: Users, label: "Team Performance" },
  { icon: GraduationCap, label: "Education Strategy" },
  { icon: Bot, label: "AI Governance" },
  { icon: Lightbulb, label: "Digital Transformation" },
];

export default function AboutExpertisePage() {
  return (
    <PublicPage>
      {/* Hero */}
      <section className="container mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="grid lg:grid-cols-[2fr,1fr] gap-12 items-start">
          <div>
            <span className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-4">
              <Sparkles className="h-4 w-4" /> About &amp; Expertise
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Transforming Strategy Into <span className="text-primary">Scalable Operations</span>, Growth &amp; Intelligent Systems.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              {PROFILE.positioning}. Based in {PROFILE.location}. Working globally across operations, sales,
              international education, university partnerships, AI automation, CRM and digital transformation.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              {PROFILE.supporting}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/work-with-me">Work with me <ArrowUpRight className="h-4 w-4 ml-1" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/projects">View projects</Link>
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{PROFILE.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe2 className="h-4 w-4 text-muted-foreground" />
                <span>Languages: {PROFILE.languages.join(", ")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href="mailto:hello@alaminn.info" className="text-primary hover:underline">hello@alaminn.info</a>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Trust Line</p>
                <p className="text-sm">{PROFILE.trustLine}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Professional Focus */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Professional Focus</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Six focus areas, connected by a single principle: turn ambitious goals into working systems.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {FOCUS_AREAS.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex flex-col items-center gap-2 rounded-xl border bg-background p-4 text-center">
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-xs font-semibold">{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Career Journey */}
      <section className="container mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="max-w-3xl mb-12">
          <span className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-4">
            <Compass className="h-4 w-4" /> Career Journey
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            From operations to intelligent systems.
          </h2>
          <p className="text-lg text-muted-foreground">
            A progression through four phases — each building on the last to create a connected, systems-driven practice.
          </p>
        </div>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border sm:left-1/2" aria-hidden="true" />
          <div className="space-y-8">
            {CAREER_JOURNEY.map((phase, i) => (
              <div key={phase.phase} className={`relative flex gap-6 sm:gap-8 ${i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
                <div className="absolute left-4 -translate-x-1/2 sm:left-1/2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {i + 1}
                  </span>
                </div>
                <div className={`ml-12 sm:ml-0 sm:w-1/2 ${i % 2 === 0 ? "sm:pr-12 sm:text-right" : "sm:pl-12"}`}>
                  <Card>
                    <CardHeader>
                      <div className="text-xs font-semibold uppercase tracking-wider text-primary">{phase.phase}</div>
                      <CardTitle className="text-lg">{phase.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{phase.desc}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Expertise — merged from /expertise */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="max-w-3xl mb-12">
            <span className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-4">
              <Target className="h-4 w-4" /> Core Expertise &amp; Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Six domains, one operating principle.
            </h2>
            <p className="text-lg text-muted-foreground">
              My work spans operations, sales, education, partnerships, AI and digital systems.
              The throughline: turning ambitious goals into measurable, working systems.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <Card key={p.title} className="h-full">
                  <CardHeader>
                    <Icon className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{p.body}</p>
                    <ul className="space-y-2">
                      {p.capabilities.map((item) => (
                        <li key={item} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Operating Philosophy */}
      <section className="container mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-4">
            <Lightbulb className="h-4 w-4" /> Operating Philosophy
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
            Structure replaces chaos. Systems replace guesswork.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Every engagement starts with diagnosis — mapping the current state to the relevant capability
            modules. The goal is not to prescribe a generic solution, but to design the specific system
            that turns this team&apos;s ambitious goals into measurable, working outcomes. Evidence-controlled
            publishing, no fabricated metrics, and governed AI workflows ensure every claim is verifiable.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Governed AI workflows</span>
            <span className="inline-flex items-center gap-2"><Award className="h-4 w-4 text-amber-600" /> Evidence-controlled publishing</span>
          </div>
        </div>
      </section>

      {/* Full executive profile component (bio, principles, timeline, skills) */}
      <Profile />

      {/* Ecosystem CTA */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <Card className="border-primary/20">
          <CardContent className="p-8 sm:p-12">
            <div className="grid lg:grid-cols-[1fr,auto] gap-6 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">A Connected Ecosystem</h2>
                <p className="text-muted-foreground mb-4 max-w-2xl">
                  My work spans a connected ecosystem: ALO Education (student consultancy),
                  ALO Labs (central AI command), TECH360 (technical delivery) and Alaminn.info
                  (executive platform). Each platform has a focused scope, and they collaborate
                  through secure, governed integrations.
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Governed AI workflows</span>
                  <span className="inline-flex items-center gap-2"><Award className="h-4 w-4 text-amber-600" /> Evidence-controlled publishing</span>
                </div>
              </div>
              <Button asChild size="lg">
                <Link href="/ecosystem">Explore the ecosystem <ArrowUpRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-7xl px-4 pb-16">
        <Card className="border-primary/20">
          <CardContent className="p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Need a structured approach to your next growth goal?</h2>
              <p className="text-muted-foreground">Book a discovery call to map the path from where you are to where you want to be.</p>
            </div>
            <Button asChild size="lg">
              <Link href="/work-with-me">Work with me <ArrowUpRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </PublicPage>
  );
}
