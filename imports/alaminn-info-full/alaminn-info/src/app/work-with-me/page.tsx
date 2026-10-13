import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/site/public-chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight, Mail, MapPin, Calendar, MessageSquare,
  Target, Compass, GraduationCap, Bot, Users, TrendingUp,
  Clock, ShieldCheck, CheckCircle2,
} from "lucide-react";
import { ContactForm } from "./contact-form";
import { ScheduleButton } from "./schedule-button";

export const metadata: Metadata = {
  title: "Work With Me",
  description:
    "Work with Al Aminn — engagement types, services, collaboration models and scheduling. One conversion-focused page for discovery calls, strategy sessions, partnerships and education advisory.",
};

const ENGAGEMENT_TYPES = [
  {
    icon: Target,
    title: "Discovery Call",
    duration: "30 min",
    desc: "Explore fit and scope. A structured conversation to understand your challenge and map the path forward.",
    best: "First-time collaboration",
  },
  {
    icon: Compass,
    title: "Strategy Session",
    duration: "60 min",
    desc: "Dig into one specific challenge. Leave with a clear diagnosis and a proposed next step.",
    best: "Operations, sales or growth challenge",
  },
  {
    icon: GraduationCap,
    title: "Education Advisory",
    duration: "45 min",
    desc: "Student referral, university partnership or education-business growth discussion.",
    best: "International education & partnerships",
  },
  {
    icon: Users,
    title: "Partnership Discussion",
    duration: "60 min",
    desc: "Institutional collaboration, market-entry strategy and long-term partnership design.",
    best: "Universities & institutions",
  },
];

const SERVICES = [
  {
    icon: Target,
    title: "Business Operating System",
    desc: "Design operating systems with stage gates, ownership and reporting.",
    tags: ["Process", "Accountability", "Reporting"],
  },
  {
    icon: TrendingUp,
    title: "Sales Strategy & Revenue Growth",
    desc: "Build stage-based pipelines with qualification and SLAs.",
    tags: ["Pipeline", "Conversion", "Forecasting"],
  },
  {
    icon: GraduationCap,
    title: "International Education Operations",
    desc: "Structure counselling, applications and admissions workflows.",
    tags: ["Counselling", "Admissions", "Compliance"],
  },
  {
    icon: Users,
    title: "University & Institutional Partnerships",
    desc: "Run a partnership pipeline with due-diligence and approval stages.",
    tags: ["Outreach", "Due Diligence", "Collaboration"],
  },
  {
    icon: Bot,
    title: "AI Automation & Governance",
    desc: "Governed AI workspace design with approval routing and audit logging.",
    tags: ["AI", "Governance", "Automation"],
  },
  {
    icon: Compass,
    title: "CRM & Digital Transformation",
    desc: "Relationship CRM architecture, reporting dashboards and technical delivery.",
    tags: ["CRM", "Analytics", "Delivery"],
  },
];

const COLLABORATION = [
  { step: "01", title: "Discovery", desc: "A conversation to align on scope, context and desired outcome." },
  { step: "02", title: "Diagnosis", desc: "Map the situation to the relevant capability modules and propose a next step." },
  { step: "03", title: "Engagement", desc: "Structured work with clear deliverables, timelines and accountability." },
  { step: "04", title: "Handover", desc: "Documentation, training and handover so the system runs without me." },
];

export default function WorkWithMePage() {
  return (
    <PublicPage>
      {/* Hero */}
      <section className="container mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-4">
            <MessageSquare className="h-4 w-4" /> Work With Me
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Let&apos;s map the path <span className="text-primary">forward.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            One page for engagement types, services, collaboration models and scheduling.
            Book a discovery call or send a structured inquiry — I respond within 1-2 business days.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#schedule">
                <Calendar className="h-4 w-4 mr-1" /> Schedule a Meeting
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#inquiry">Send an Inquiry</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Engagement Types */}
      <section id="engagements" className="bg-muted/30 py-16 scroll-mt-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Engagement Types</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Four ways to work together — each with a clear audience, scope and outcome.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ENGAGEMENT_TYPES.map((e) => {
              const Icon = e.icon;
              return (
                <Card key={e.title} className="h-full">
                  <CardHeader>
                    <Icon className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">{e.title}</CardTitle>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {e.duration}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{e.desc}</p>
                    <div className="text-xs font-semibold text-primary">{e.best}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="container mx-auto max-w-7xl px-4 py-16 scroll-mt-20">
        <div className="max-w-3xl mb-12">
          <span className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-4">
            <Target className="h-4 w-4" /> Services &amp; Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Six domains of practice.
          </h2>
          <p className="text-lg text-muted-foreground">
            Each engagement is scoped to the specific system that turns your goals into measurable outcomes.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="h-full">
                <CardHeader>
                  <Icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{s.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.tags.map((t) => (
                      <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{t}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Collaboration Process */}
      <section id="collaboration" className="bg-muted/30 py-16 scroll-mt-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">How We&apos;ll Work Together</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A structured four-step process — from discovery to handover.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {COLLABORATION.map((c) => (
              <Card key={c.step} className="h-full">
                <CardContent className="p-6">
                  <div className="text-3xl font-extrabold text-primary/30 mb-2">{c.step}</div>
                  <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule + Inquiry */}
      <section id="schedule" className="container mx-auto max-w-7xl px-4 py-16 scroll-mt-20">
        <div className="grid lg:grid-cols-[2fr,1fr] gap-8" id="inquiry">
          {/* Inquiry form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> Send an Inquiry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card id="schedule-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Schedule a Meeting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Book a discovery call or strategy session. I respond within 1-2 business days.
                </p>
                <ScheduleButton className="w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" /> Direct
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href="mailto:hello@alaminn.info" className="text-primary hover:underline">hello@alaminn.info</a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Dhaka, Bangladesh · Working globally</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 mb-2">
                  <ShieldCheck className="h-4 w-4" /> Trust &amp; Privacy
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-600" /> 1-2 business day response</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-600" /> No obligation discovery call</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-600" /> Evidence-controlled engagement</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-600" /> Your data is never shared</li>
                </ul>
              </CardContent>
            </Card>

            <Button asChild variant="outline" className="w-full">
              <Link href="/admin">Admin login <ArrowUpRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
