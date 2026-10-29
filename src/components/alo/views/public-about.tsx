"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Icon,
  StatCard,
  SectionCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
} from "@/components/alo/shared";
import { Breadcrumb } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { fmtDate, type ViewKey } from "@/lib/alo-types";

interface PublicAboutProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty?: string | null;
  bio?: string | null;
  photo?: string | null;
}

interface HomepageData {
  team: TeamMember[];
  stats: {
    totalCountries: number;
    totalUniversities: number;
    totalCourses: number;
    totalExams: number;
  };
}

const MISSION = "To open doors for Bangladeshi students to the world's best universities — making the journey from ambition to admission simple, transparent, and successful.";

const VISION = "To become South Asia's most trusted study-abroad platform — known for honest counseling, verified information, and a relentless commitment to student success.";

const VALUES = [
  {
    icon: "ShieldCheck",
    title: "Honesty first",
    description: "We tell students the truth, even when it's not what they want to hear. Fake promises harm students; honest guidance protects them.",
  },
  {
    icon: "GraduationCap",
    title: "Student success",
    description: "Every decision we make starts with one question: does this help our students reach their dream university and succeed there?",
  },
  {
    icon: "Search",
    title: "Verified information",
    description: "We monitor 97 official sources weekly and verify every piece of advice against university and government websites.",
  },
  {
    icon: "HeartHandshake",
    title: "End-to-end care",
    description: "From the first call to landing in your destination country — and beyond — we walk every step of the journey with you.",
  },
  {
    icon: "Users",
    title: "Cultural respect",
    description: "We honor each student's background, family expectations, and faith while helping them adapt to life abroad.",
  },
  {
    icon: "Sparkles",
    title: "Continuous innovation",
    description: "We blend human counselors with AI tools to give students faster, smarter, more personalised guidance than any traditional agency.",
  },
];

const WHY_CHOOSE = [
  { icon: "Users", title: "Counselors who studied abroad", description: "Our team includes graduates from UK, US, Australian, and Canadian universities." },
  { icon: "BookMarked", title: "Verified university data", description: "Weekly monitoring of 97 official sources — your advice is always up to date." },
  { icon: "Gift", title: "Free for students", description: "Counseling, application support, SOP/CV reviews, and 3 free mock tests — all free." },
  { icon: "Clock", title: "24-hour response", description: "We respond to every inquiry within 24 hours — guaranteed in writing." },
  { icon: "ShieldCheck", title: "Privacy protected", description: "Your data is RBAC-protected, audit-logged, and never shared without consent." },
  { icon: "Globe", title: "13 destinations", description: "UK, USA, Canada, Australia, Ireland, New Zealand, Germany, Dubai, and more." },
  { icon: "Award", title: "Scholarship specialists", description: "We've helped students win Chevening, Commonwealth, Australia Awards, and university scholarships." },
  { icon: "Plane", title: "Pre-departure support", description: "Airport pickup, accommodation, banking, and SIM card setup — we don't disappear after CAS." },
];

export function PublicAbout({ onNavigate }: PublicAboutProps) {
  const [team, setTeam] = React.useState<TeamMember[]>([]);
  const [stats, setStats] = React.useState({ totalCountries: 0, totalUniversities: 0, totalCourses: 0, totalExams: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/homepage", { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data: HomepageData = await res.json();
        if (cancelled) return;
        setTeam(data.team || []);
        setStats(data.stats || stats);
      } catch {
        // Silent — fallback content still meaningful
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[var(--alo-brand)]/10 bg-gradient-to-br from-[var(--alo-brand-light)] via-white to-[var(--alo-cta-soft)]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-20">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "About Us" },
            ]}
          />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <Badge className="bg-[var(--alo-cta-soft)] text-[var(--alo-cta)] border border-[var(--alo-cta)]/20 hover:bg-[var(--alo-cta-soft)]">
                <Icon name="Sparkles" className="mr-1 size-3" />
                Founded February 2023
              </Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--alo-text)] sm:text-5xl lg:text-6xl">
                About <span className="text-[var(--alo-brand)]">ALO Education</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--alo-text-muted)] sm:text-lg">
                ALO Education was founded in February 2023 by{" "}
                <span className="font-semibold text-[var(--alo-text)]">Taslima Akter</span> with a simple mission:
                give Bangladeshi students honest, expert, and end-to-end guidance for studying abroad — without the
                hidden fees, fake promises, or pressure sales tactics common in the industry.
              </p>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--alo-text-muted)]">
                In our first 18 months, we helped <span className="font-semibold text-[var(--alo-text)]">over 800 students</span>{" "}
                apply to universities in 13 countries. Our counselor team includes graduates from UK, US, Australian,
                and Canadian universities — we've walked this path ourselves.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  onClick={() => onNavigate("public-contact")}
                  className="h-12 rounded-xl bg-[var(--alo-cta)] px-6 text-white hover:bg-[var(--alo-cta-hover)]"
                >
                  <Icon name="Phone" className="size-4" />
                  Talk to a Counselor
                </Button>
                <Button
                  onClick={() => onNavigate("public-team")}
                  variant="outline"
                  className="h-12 rounded-xl border-[var(--alo-brand)]/30 bg-white px-6 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                >
                  <Icon name="Users" className="size-4" />
                  Meet the Team
                </Button>
              </div>
            </div>
            {/* Decorative gradient card */}
            <div className="relative">
              <div className="absolute inset-0 -z-10 rotate-3 rounded-3xl bg-gradient-to-br from-[var(--alo-brand)]/10 to-[var(--alo-cta)]/10" />
              <Card className="overflow-hidden rounded-3xl border-2 border-[var(--alo-brand)]/15 bg-white alo-shadow">
                <div className="h-48 bg-alo-gradient" />
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Stat>
                      <span className="text-3xl font-black text-[var(--alo-brand)]">800+</span>
                      <span className="text-xs text-[var(--alo-text-muted)]">Students guided</span>
                    </Stat>
                    <Stat>
                      <span className="text-3xl font-black text-[var(--alo-cta)]">13</span>
                      <span className="text-xs text-[var(--alo-text-muted)]">Study destinations</span>
                    </Stat>
                    <Stat>
                      <span className="text-3xl font-black text-[var(--alo-brand)]">{stats.totalUniversities || "408"}</span>
                      <span className="text-xs text-[var(--alo-text-muted)]">Verified universities</span>
                    </Stat>
                    <Stat>
                      <span className="text-3xl font-black text-[var(--alo-cta)]">{stats.totalCourses || "794"}</span>
                      <span className="text-xs text-[var(--alo-text-muted)]">Courses tracked</span>
                    </Stat>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="border-b border-[var(--alo-brand)]/10">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--alo-cta)]">Our Story</p>
              <h2 className="mt-2 text-3xl font-black text-[var(--alo-text)]">From a small Dhaka office to 13 destinations</h2>
            </div>
            <div className="space-y-4 text-[15px] leading-relaxed text-[var(--alo-text-muted)]">
              <p>
                ALO Education began in February 2023 with one counselor, one laptop, and one belief: Bangladeshi
                students deserve better than commission-driven sales agents who push them toward whichever
                university pays the highest bonus.
              </p>
              <p>
                Our founder, <span className="font-semibold text-[var(--alo-text)]">Taslima Akter</span>, had seen too
                many friends arrive abroad only to discover their "dream university" was a low-ranked institution
                with no scholarship, no post-study work rights, and no support network. She set out to build a
                counseling service that would treat each student like a younger sibling — not a sales target.
              </p>
              <p>
                Two years later, ALO Education has grown into a team of specialist counselors, English trainers,
                visa officers, and application experts. We've built a custom platform that monitors{" "}
                <span className="font-semibold text-[var(--alo-text)]">97 official university and government sources</span>{" "}
                every week — so the advice we give you is always verified against the official source, never
                remembered from a brochure.
              </p>
              <p>
                We remain 100% free for students. Our counseling, SOP/CV reviews, application support, and 3 free
                mock tests are paid for by partner university commissions — but we will never push you toward a
                university because of commission. If a university isn't right for you, we tell you. That's the ALO way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION / VISION / VALUES */}
      <section className="bg-[var(--alo-page)]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/15 bg-white alo-shadow">
              <CardContent className="p-8">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                  <Icon name="Target" className="size-6" />
                </div>
                <h3 className="mt-5 text-2xl font-black text-[var(--alo-brand)]">Our Mission</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--alo-text-muted)]">{MISSION}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-2 border-[var(--alo-cta)]/15 bg-white alo-shadow">
              <CardContent className="p-8">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]">
                  <Icon name="Eye" className="size-6" />
                </div>
                <h3 className="mt-5 text-2xl font-black text-[var(--alo-cta)]">Our Vision</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--alo-text-muted)]">{VISION}</p>
              </CardContent>
            </Card>
          </div>

          <h3 className="mt-12 text-2xl font-black text-[var(--alo-text)]">Our Values</h3>
          <p className="mt-1 text-sm text-[var(--alo-text-muted)]">The non-negotiable principles that shape every decision at ALO.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v) => (
              <Card key={v.title} className="alo-card-hover rounded-2xl border border-[var(--alo-border)] bg-white transition-all hover:-translate-y-0.5 hover:border-[var(--alo-brand)]/30">
                <CardContent className="p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                    <Icon name={v.icon} className="size-5" />
                  </div>
                  <h4 className="mt-3 text-base font-bold text-[var(--alo-text)]">{v.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--alo-text-muted)]">{v.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE ALO */}
      <section>
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--alo-cta)]">Why Choose ALO</p>
            <h2 className="mt-2 text-3xl font-black text-[var(--alo-text)]">8 reasons students choose us</h2>
            <p className="mt-2 text-sm text-[var(--alo-text-muted)]">And why they stay with us from first call to graduation.</p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_CHOOSE.map((w) => (
              <Card key={w.title} className="alo-card-hover rounded-2xl border border-[var(--alo-border)] bg-white transition-all hover:-translate-y-0.5 hover:border-[var(--alo-cta)]/30">
                <CardContent className="p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]">
                    <Icon name={w.icon} className="size-5" />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-[var(--alo-text)]">{w.title}</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--alo-text-muted)]">{w.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM PREVIEW */}
      <section className="bg-[var(--alo-page)]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--alo-brand)]">Our Team</p>
              <h2 className="mt-2 text-3xl font-black text-[var(--alo-text)]">Meet the counselors behind your journey</h2>
              <p className="mt-2 text-sm text-[var(--alo-text-muted)]">Specialist counselors, English trainers, visa officers, and application experts.</p>
            </div>
            <Button
              onClick={() => onNavigate("public-team")}
              variant="outline"
              className="h-11 rounded-xl border-[var(--alo-brand)]/30 bg-white text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
            >
              View Full Team
              <Icon name="ArrowRight" className="size-4" />
            </Button>
          </div>

          {loading ? (
            <div className="mt-8"><LoadingGrid count={4} /></div>
          ) : team.length === 0 ? (
            <EmptyState
              icon="Users"
              title="Team profiles will appear here"
              description="Our counselors are updating their bios. In the meantime, contact us directly."
              action={
                <Button onClick={() => onNavigate("public-contact")} className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90">
                  <Icon name="Phone" className="size-4" /> Contact Us
                </Button>
              }
            />
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {team.slice(0, 4).map((m) => (
                <Card key={m.id} className="alo-card-hover rounded-2xl border border-[var(--alo-border)] bg-white transition-all hover:-translate-y-0.5 hover:border-[var(--alo-brand)]/30">
                  <CardContent className="p-5">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-alo-gradient text-2xl font-black text-white">
                      {m.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </div>
                    <h4 className="mt-4 text-base font-bold text-[var(--alo-text)]">{m.name}</h4>
                    <p className="text-sm font-medium text-[var(--alo-brand)]">{m.role}</p>
                    {m.specialty && (
                      <p className="mt-1 text-xs text-[var(--alo-text-muted)]">{m.specialty}</p>
                    )}
                    {m.bio && (
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--alo-text-muted)]">{m.bio}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* STATS */}
      <section>
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Study Destinations" value={stats.totalCountries || 13} icon="Globe" accent="blue" />
            <StatCard label="Verified Universities" value={stats.totalUniversities || 408} icon="Building2" accent="orange" hint="across 13 countries" />
            <StatCard label="Courses Tracked" value={stats.totalCourses || 794} icon="BookOpen" accent="blue" />
            <StatCard label="English Tests" value={stats.totalExams || 10} icon="Languages" accent="orange" hint="AI-scored mocks" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--alo-text)]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-black text-white">Ready to start your journey?</h2>
              <p className="mt-3 text-base leading-relaxed text-white/80">
                Book a free 30-minute consultation with one of our counselors. We'll review your profile,
                recommend destinations and courses, and outline a clear path to admission — no commitment required.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => onNavigate("public-contact")} className="h-12 bg-[var(--alo-cta)] px-6 text-white hover:bg-[var(--alo-cta-hover)]">
                  <Icon name="CalendarCheck" className="size-4" />
                  Request Consultation
                </Button>
                <Button onClick={() => onNavigate("public-services")} variant="outline" className="h-12 border-white/30 bg-transparent px-6 text-white hover:bg-white/10">
                  <Icon name="Briefcase" className="size-4" />
                  Explore Services
                </Button>
              </div>
            </div>
            <PublicLeadForm
              sourceTag="About page — bottom CTA"
              title="Start your journey in 60 seconds"
              subtitle="Submit your details and an ALO counselor will reach out within 24 hours."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start">
      {children}
    </div>
  );
}
export default PublicAbout;
