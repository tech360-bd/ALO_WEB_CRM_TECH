"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Icon,
  SectionCard,
  StatCard,
  EmptyState,
  LoadingGrid,
} from "@/components/alo/shared";
import { Breadcrumb } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { useToast } from "@/hooks/use-toast";
import { type ViewKey } from "@/lib/alo-types";

interface PublicSuccessStoriesProps {
  slug?: string;
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface Story {
  id: string;
  studentName: string;
  homeDistrict?: string | null;
  countrySlug?: string | null;
  universityName?: string | null;
  courseName?: string | null;
  outcome?: string | null;
  testimonial: string;
  photo?: string | null;
  consentStatus: string;
}

interface HomepageData {
  stories: Story[];
}

const COUNTRY_FLAGS: Record<string, string> = {
  uk: "🇬🇧",
  usa: "🇺🇸",
  canada: "🇨🇦",
  australia: "🇦🇺",
  ireland: "🇮🇪",
  "new-zealand": "🇳🇿",
  germany: "🇩🇪",
  dubai: "🇦🇪",
  malaysia: "🇲🇾",
  denmark: "🇩🇰",
  japan: "🇯🇵",
  "south-korea": "🇰🇷",
  europe: "🇪🇺",
};

const COUNTRY_NAMES: Record<string, string> = {
  uk: "United Kingdom",
  usa: "USA",
  canada: "Canada",
  australia: "Australia",
  ireland: "Ireland",
  "new-zealand": "New Zealand",
  germany: "Germany",
  dubai: "Dubai",
  malaysia: "Malaysia",
  denmark: "Denmark",
  japan: "Japan",
  "south-korea": "South Korea",
  europe: "Europe",
};

export function PublicSuccessStories({ slug, onNavigate }: PublicSuccessStoriesProps) {
  if (slug) return <StoryDetail slug={slug} onNavigate={onNavigate} />;
  return <StoryList onNavigate={onNavigate} />;
}

// ──────────────────────────────────────────────────────────────────────────────

function StoryList({ onNavigate }: { onNavigate: (v: ViewKey, slug?: string) => void }) {
  const { toast } = useToast();
  const [stories, setStories] = React.useState<Story[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/homepage", { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data: HomepageData = await res.json();
        if (cancelled) return;
        // Only show stories with explicit consent
        setStories((data.stories || []).filter((s) => s.consentStatus === "APPROVED" || s.consentStatus === "CONSENTED"));
      } catch (e: any) {
        if (!cancelled) {
          toast({
            title: "Couldn't load success stories",
            description: "Please try again in a moment.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  // Stats
  const totalStories = stories.length;
  const uniqueCountries = new Set(stories.map((s) => s.countrySlug).filter(Boolean)).size;
  const uniqueUniversities = new Set(stories.map((s) => s.universityName).filter(Boolean)).size;

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[#0066CC]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Success Stories" },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge className="bg-[#FFF3EA] text-[#F37021] border border-[#F37021]/20 hover:bg-[#FFF3EA]">
              <Icon name="Sparkles" className="mr-1 size-3" />
              Real Students, Real Journeys
            </Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0B2447] sm:text-5xl">
              Student <span className="text-[#0066CC]">Success Stories</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#5A7299] sm:text-lg">
              Every story published here has been shared with the explicit consent of the student. We never fabricate
              testimonials. Every name, university, and journey is real.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6 lg:py-14">
        {/* Stats */}
        {!loading && stories.length > 0 && (
          <div className="mb-10 grid gap-5 sm:grid-cols-3">
            <StatCard label="Success Stories" value={totalStories} icon="Sparkles" accent="blue" hint="with explicit consent" />
            <StatCard label="Destinations" value={uniqueCountries} icon="Globe" accent="orange" hint="countries reached" />
            <StatCard label="Universities" value={uniqueUniversities} icon="Building2" accent="blue" hint="unique universities" />
          </div>
        )}

        {loading ? (
          <LoadingGrid count={6} />
        ) : stories.length === 0 ? (
          <EmptyState
            icon="Sparkles"
            title="Success stories coming soon"
            description="We're collecting consent from our recent students. Check back soon for real testimonials from ALO graduates."
            action={
              <Button onClick={() => onNavigate("public-about")} className="bg-[#0066CC] text-white hover:bg-[#0066CC]/90">
                <Icon name="Info" className="size-4" /> About ALO Education
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <Card
                key={story.id}
                className="alo-card-hover group flex cursor-pointer flex-col rounded-2xl border border-[#E2E8F0] bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
                onClick={() => onNavigate("public-success-stories", story.id)}
              >
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-alo-gradient text-lg font-black text-white">
                      {story.studentName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-[#0B2447] group-hover:text-[#0066CC]">{story.studentName}</h3>
                      {story.homeDistrict && (
                        <p className="text-xs text-[#5A7299]">From {story.homeDistrict}</p>
                      )}
                    </div>
                  </div>
                  {story.countrySlug && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-lg">{COUNTRY_FLAGS[story.countrySlug] || "🌍"}</span>
                      <span className="text-xs font-semibold text-[#0066CC]">
                        {COUNTRY_NAMES[story.countrySlug] || story.countrySlug}
                      </span>
                    </div>
                  )}
                  {story.universityName && (
                    <p className="mt-1 text-xs text-[#0B2447]">
                      <Icon name="Building2" className="mr-1 inline size-3 text-[#5A7299]" />
                      {story.universityName}
                    </p>
                  )}
                  {story.courseName && (
                    <p className="mt-0.5 text-xs text-[#5A7299]">{story.courseName}</p>
                  )}
                  <p className="mt-3 line-clamp-3 flex-1 text-sm italic leading-relaxed text-[#5A7299]">
                    "{story.testimonial}"
                  </p>
                  {story.outcome && (
                    <div className="mt-3 inline-flex items-center gap-1 self-start rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <Icon name="Check" className="size-3" />
                      {story.outcome}
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-[#5A7299]">
                    <Icon name="ShieldCheck" className="size-3" />
                    Published with consent
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Consent note */}
        <div className="mt-10 rounded-2xl border border-[#0066CC]/15 bg-[#EAF3FF]/30 p-6">
          <div className="flex items-start gap-3">
            <Icon name="ShieldCheck" className="mt-0.5 size-5 shrink-0 text-[#0066CC]" />
            <div>
              <p className="text-sm font-bold text-[#0B2447]">Every story published with explicit consent</p>
              <p className="mt-1 text-sm leading-relaxed text-[#5A7299]">
                ALO Education never publishes a student testimonial without their written consent. We never modify
                a student's words. If you're an ALO graduate and would like to share your story,{" "}
                <button onClick={() => onNavigate("public-contact")} className="font-semibold text-[#0066CC] hover:underline">
                  contact us
                </button>{" "}
                — we'll send you a secure review invitation.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12">
          <PublicLeadForm
            sourceTag="Success Stories page — bottom CTA"
            title="Be our next success story"
            subtitle="Start your study abroad journey today — and one day, your story could inspire others."
          />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

function StoryDetail({ slug, onNavigate }: { slug: string; onNavigate: (v: ViewKey, slug?: string) => void }) {
  const { toast } = useToast();
  const [story, setStory] = React.useState<Story | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/homepage", { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data: HomepageData = await res.json();
        if (cancelled) return;
        const found = (data.stories || []).find((s) => s.id === slug || s.studentName.toLowerCase().replace(/\s+/g, "-") === slug);
        setStory(found || null);
      } catch (e: any) {
        if (!cancelled) {
          toast({
            title: "Couldn't load story",
            description: "Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, toast]);

  if (loading) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 lg:px-6">
          <LoadingGrid count={4} />
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-16 lg:px-6">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Success Stories", onClick: () => onNavigate("public-success-stories") },
              { label: "Not found" },
            ]}
          />
          <EmptyState
            icon="FileQuestion"
            title="Story not found"
            description="We couldn't find that success story."
            action={
              <Button onClick={() => onNavigate("public-success-stories")} className="bg-[#0066CC] text-white hover:bg-[#0066CC]/90">
                <Icon name="ArrowLeft" className="size-4" /> Back to Stories
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <section className="border-b border-[#0066CC]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]">
        <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6 lg:py-14">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Success Stories", onClick: () => onNavigate("public-success-stories") },
              { label: story.studentName },
            ]}
          />
          <div className="mt-6 flex items-start gap-5">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-alo-gradient text-2xl font-black text-white">
              {story.studentName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-black leading-tight tracking-tight text-[#0B2447] sm:text-4xl">
                {story.studentName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                {story.countrySlug && (
                  <Badge className="bg-[#FFF3EA] text-[#F37021] hover:bg-[#FFF3EA]">
                    {COUNTRY_FLAGS[story.countrySlug] || "🌍"} {COUNTRY_NAMES[story.countrySlug] || story.countrySlug}
                  </Badge>
                )}
                {story.outcome && (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    <Icon name="Check" className="mr-1 size-3" />
                    {story.outcome}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-10 lg:px-6 lg:py-14">
        {/* Quick facts */}
        <div className="grid gap-3 sm:grid-cols-3">
          {story.homeDistrict && (
            <Card className="rounded-xl border border-[#0066CC]/15 bg-[#EAF3FF]/40">
              <CardContent className="p-4">
                <p className="text-xs text-[#5A7299]">Home District</p>
                <p className="mt-0.5 text-sm font-bold text-[#0B2447]">{story.homeDistrict}</p>
              </CardContent>
            </Card>
          )}
          {story.universityName && (
            <Card className="rounded-xl border border-[#0066CC]/15 bg-[#EAF3FF]/40">
              <CardContent className="p-4">
                <p className="text-xs text-[#5A7299]">University</p>
                <p className="mt-0.5 text-sm font-bold text-[#0B2447]">{story.universityName}</p>
              </CardContent>
            </Card>
          )}
          {story.courseName && (
            <Card className="rounded-xl border border-[#0066CC]/15 bg-[#EAF3FF]/40">
              <CardContent className="p-4">
                <p className="text-xs text-[#5A7299]">Course</p>
                <p className="mt-0.5 text-sm font-bold text-[#0B2447]">{story.courseName}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Testimonial */}
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-wider text-[#F37021]">Testimonial</p>
          <blockquote className="mt-3 border-l-4 border-[#F37021] bg-[#FFF3EA]/40 px-6 py-5 text-base italic leading-relaxed text-[#0B2447] sm:text-lg">
            {story.testimonial}
          </blockquote>
        </div>

        {/* Consent */}
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <Icon name="ShieldCheck" className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-emerald-900">Published with explicit student consent</p>
            <p className="mt-1 text-xs text-emerald-800">
              This testimonial was shared with the explicit written consent of {story.studentName}. ALO Education
              never fabricates testimonials or modifies a student's words.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-2xl border-2 border-[#0066CC]/15 bg-gradient-to-br from-[#EAF3FF]/60 to-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-bold text-[#0B2447]">Want to write your own success story?</p>
              <p className="text-sm text-[#5A7299]">Start your free consultation today.</p>
            </div>
            <Button onClick={() => onNavigate("public-contact")} className="h-11 shrink-0 bg-[#F37021] text-white hover:bg-[#c8451a]">
              <Icon name="CalendarCheck" className="size-4" />
              Book Free Consultation
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
