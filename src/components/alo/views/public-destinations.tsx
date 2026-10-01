"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  LoadingGrid,
  EmptyState,
  InfoRow,
  SectionCard,
} from "@/components/alo/shared";
import { Breadcrumb, Disclaimer } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { fmtDate, type ViewKey } from "@/lib/alo-types";

interface PublicDestinationsProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface CountryListItem {
  slug: string;
  name: string;
  shortName: string;
  flag: string;
  capital: string;
  currency: string;
  intro: string;
  quickFacts: string; // JSON
  lastVerifiedAt?: string | null;
  verificationStatus?: string;
  sourceUrl?: string | null;
}

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const STATS = [
  { icon: "Globe", value: "13", label: "Countries", accent: "blue" as const },
  { icon: "Building2", value: "12+", label: "Universities", accent: "orange" as const },
  { icon: "ShieldCheck", value: "Verified", label: "Data & sources", accent: "emerald" as const },
  { icon: "Bot", value: "AI", label: "Course matching", accent: "violet" as const },
];

export function PublicDestinations({ onNavigate }: PublicDestinationsProps) {
  const { toast } = useToast();
  const [countries, setCountries] = React.useState<CountryListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showConsult, setShowConsult] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/countries");
        const data = await res.json();
        if (cancelled) return;
        setCountries(Array.isArray(data.countries) ? data.countries : []);
      } catch {
        if (!cancelled) setCountries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function handleWhatsApp() {
    toast({
      title: "Opening WhatsApp",
      description: "Our counselor will respond within working hours. Direct line: 01805020101",
    });
  }

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-[#0B5ED7]/10 bg-[#f7f9fc]">
        <div className="mx-auto max-w-[1280px] px-4 py-3 lg:px-6">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Destinations" },
            ]}
          />
        </div>
      </div>

      {/* Header */}
      <section className="bg-alo-hero">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-[#0B5ED7]/30 bg-white/70 text-[#0B5ED7]">
              <Icon name="Globe" className="mr-1.5 size-3.5" />
              {countries.length || 13} verified destinations
            </Badge>
            <h1 className="text-4xl font-black text-[#0B5ED7] md:text-5xl">Study Destinations</h1>
            <p className="mt-3 text-base text-muted-foreground md:text-lg">
              Explore {countries.length || 13} countries with verified tuition, visa, work rights, and scholarship data — all written in ALO's own words.
            </p>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border-2 border-[#0B5ED7]/15 bg-white/80 px-4 py-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    s.accent === "blue" && "bg-[#e8f0fb] text-[#0B5ED7]",
                    s.accent === "orange" && "bg-[#fdece4] text-[#F97316]",
                    s.accent === "emerald" && "bg-emerald-50 text-emerald-600",
                    s.accent === "violet" && "bg-violet-50 text-violet-600",
                  )}>
                    <Icon name={s.icon} className="size-4" />
                  </div>
                  <span className="text-2xl font-black text-foreground">{s.value}</span>
                </div>
                <p className="mt-1.5 text-xs font-medium text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Country grid */}
      <section className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6">
        {loading ? (
          <LoadingGrid count={6} />
        ) : countries.length === 0 ? (
          <EmptyState
            icon="Globe"
            title="No destinations available"
            description="Country pages will appear here once published."
            action={
              <Button onClick={() => onNavigate("public-course-finder")} className="bg-[#F97316] text-white hover:bg-[#F97316]/90">
                Try Course Finder
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {countries.map((c) => {
              const facts = safeParse<any>(c.quickFacts, {});
              const intakes: string[] = Array.isArray(facts.intakes) ? facts.intakes : [];
              const studyLevels: string[] = Array.isArray(facts.studyLevels) ? facts.studyLevels : [];
              const tuition = facts.tuitionRange;
              const tuitionLine = tuition
                ? (typeof tuition === "string" ? tuition : (tuition.ug || tuition.pg || "Varies"))
                : "Varies";
              const englishTests: string[] = Array.isArray(facts.englishTests) ? facts.englishTests : [];

              return (
                <Card
                  key={c.slug}
                  className="flex flex-col rounded-2xl border-2 border-[#0B5ED7]/15 p-6 transition-all hover:border-[#0B5ED7] hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-5xl">{c.flag}</span>
                      <div>
                        <p className="text-xl font-black text-[#0B5ED7]">{c.shortName}</p>
                        <p className="text-xs text-muted-foreground">
                          <Icon name="MapPin" className="mr-1 inline size-3" />
                          {c.shortName} · Capital: {c.capital}
                        </p>
                      </div>
                    </div>
                    {c.verificationStatus === "VERIFIED" && (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                        <Icon name="ShieldCheck" className="mr-1 size-3" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{c.intro}</p>

                  {/* Quick facts mini-grid */}
                  <div className="mt-4 rounded-xl border border-[#0B5ED7]/10 bg-[#f7f9fc] px-3 py-1">
                    <InfoRow
                      label="Intakes"
                      value={intakes.length ? intakes.join(", ") : "—"}
                    />
                    <InfoRow
                      label="Study levels"
                      value={studyLevels.length ? `${studyLevels.length} levels` : "—"}
                    />
                    <InfoRow
                      label="Tuition from"
                      value={<span className="font-bold text-[#F97316]">{tuitionLine}</span>}
                    />
                    <InfoRow
                      label="English tests"
                      value={englishTests.length ? `${englishTests.length} accepted` : "—"}
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon name="ShieldCheck" className="size-3.5 text-emerald-600" />
                    Last verified: <span className="font-semibold text-foreground">{fmtDate(c.lastVerifiedAt)}</span>
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
                    <Button
                      onClick={() => onNavigate("public-country", c.slug)}
                      className="flex-1 bg-[#F97316] text-white hover:bg-[#F97316]/90"
                    >
                      <Icon name="ArrowRight" className="mr-1.5 size-4" />
                      Explore Country
                    </Button>
                    <Button
                      onClick={() => onNavigate("public-course-finder")}
                      variant="outline"
                      className="flex-1 border-[#0B5ED7] text-[#0B5ED7] hover:bg-[#e8f0fb]"
                    >
                      <Icon name="Search" className="mr-1.5 size-4" />
                      Find Courses
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#f7f9fc]">
        <div className="mx-auto max-w-[1280px] px-4 py-14 lg:px-6">
          <div className="rounded-3xl border-2 border-[#0B5ED7]/15 bg-white p-6 md:p-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="flex flex-col justify-center">
                <p className="text-xs font-bold uppercase tracking-wider text-[#F97316]">Still deciding?</p>
                <h2 className="mt-1 text-3xl font-black text-[#0B5ED7] md:text-4xl">Not sure which country is right for you?</h2>
                <p className="mt-3 text-base text-muted-foreground">
                  Use our AI Course Finder to match your background, budget, and goals to the right destination — or book a free consultation with a senior ALO counselor.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    onClick={() => onNavigate("public-course-finder")}
                    className="bg-[#F97316] text-white hover:bg-[#F97316]/90"
                  >
                    <Icon name="Search" className="mr-2 size-4" />
                    Use Course Finder
                  </Button>
                  <Button
                    onClick={() => setShowConsult((v) => !v)}
                    variant="outline"
                    className="border-[#0B5ED7] text-[#0B5ED7] hover:bg-[#e8f0fb]"
                  >
                    <Icon name={showConsult ? "X" : "CalendarCheck"} className="mr-2 size-4" />
                    {showConsult ? "Hide form" : "Book Free Consultation"}
                  </Button>
                  <Button
                    onClick={handleWhatsApp}
                    variant="outline"
                    className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Icon name="Whatsapp" className="mr-2 size-4" />
                    WhatsApp Us
                  </Button>
                </div>
                <div className="mt-5">
                  <Disclaimer text="ALO Education is an independent consultancy. We are not affiliated with any government immigration authority. All guidance is based on publicly available rules and our experience with previous applicants." />
                </div>
              </div>

              {showConsult && (
                <div>
                  <PublicLeadForm
                    sourceTag="Destinations page — bottom CTA"
                    title="Book your free consultation"
                    subtitle="Tell us about your goals — we'll call you within 24 hours."
                    compact
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
export default PublicDestinations;
