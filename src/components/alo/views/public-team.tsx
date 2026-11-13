"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Icon,
  SectionCard,
  EmptyState,
  LoadingGrid,
} from "@/components/alo/shared";
import { Breadcrumb } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { type ViewKey } from "@/lib/alo-types";

interface PublicTeamProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty?: string | null;
  bio?: string | null;
  photo?: string | null;
  sortOrder: number;
}

interface HomepageData {
  team: TeamMember[];
}

const DEPARTMENTS = [
  { key: "Counseling", icon: "Headset", label: "Counseling" },
  { key: "Application", icon: "ClipboardCheck", label: "Application Team" },
  { key: "Visa", icon: "Plane", label: "Visa & Compliance" },
  { key: "English", icon: "Languages", label: "English Training" },
  { key: "Marketing", icon: "Megaphone", label: "Marketing" },
  { key: "Operations", icon: "Settings", label: "Operations" },
];

export function PublicTeam({ onNavigate }: PublicTeamProps) {
  const [team, setTeam] = React.useState<TeamMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/homepage", { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data: HomepageData = await res.json();
        if (cancelled) return;
        setTeam(data.team || []);
      } catch {
        // Silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Filter team by department based on role/specialty keywords
  const filtered = filter
    ? team.filter((m) => {
        const haystack = `${m.role} ${m.specialty || ""} ${m.bio || ""}`.toLowerCase();
        const map: Record<string, string[]> = {
          Counseling: ["counsel", "advisor"],
          Application: ["application", "sop", "cv", "admission"],
          Visa: ["visa", "cas", "immigration"],
          English: ["english", "ielts", "pte", "language", "trainer"],
          Marketing: ["marketing", "content", "social"],
          Operations: ["operation", "finance", "admin", "hr"],
        };
        return (map[filter] || []).some((kw) => haystack.includes(kw));
      })
    : team;

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[var(--alo-brand)]/10 bg-gradient-to-b from-[var(--alo-brand-light)]/60 to-white">
        <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6 lg:py-14">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "About", onClick: () => onNavigate("public-about") },
              { label: "Team" },
            ]}
          />
          <div className="mt-5">
            <Badge className="bg-[var(--alo-cta-soft)] text-[var(--alo-cta)] border border-[var(--alo-cta)]/20 hover:bg-[var(--alo-cta-soft)]">
              <Icon name="Users" className="mr-1 size-3" />
              Meet the ALO Team
            </Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--alo-brand)] sm:text-4xl lg:text-5xl">
              Counselors who walked this path themselves
            </h1>
            <p className="mt-3 max-w-2xl text-base text-[var(--alo-text-muted)]">
              Our team includes graduates from UK, US, Australian, and Canadian universities. We've sat the same
              exams, applied to the same universities, and navigated the same visa process you're about to start.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6 lg:py-14">
        {/* Filter chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter(null)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              !filter ? "bg-[var(--alo-brand)] text-white" : "border border-[var(--alo-brand)]/20 bg-white text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
            }`}
          >
            All ({team.length})
          </button>
          {DEPARTMENTS.map((d) => {
            const count = team.filter((m) => {
              const haystack = `${m.role} ${m.specialty || ""} ${m.bio || ""}`.toLowerCase();
              const kws: Record<string, string[]> = {
                Counseling: ["counsel", "advisor"],
                Application: ["application", "sop", "cv", "admission"],
                Visa: ["visa", "cas", "immigration"],
                English: ["english", "ielts", "pte", "language", "trainer"],
                Marketing: ["marketing", "content", "social"],
                Operations: ["operation", "finance", "admin", "hr"],
              };
              return (kws[d.key] || []).some((kw) => haystack.includes(kw));
            }).length;
            return (
              <button
                key={d.key}
                onClick={() => setFilter(d.key)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  filter === d.key ? "bg-[var(--alo-brand)] text-white" : "border border-[var(--alo-brand)]/20 bg-white text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                }`}
              >
                <Icon name={d.icon} className="size-3.5" />
                {d.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Team grid */}
        {loading ? (
          <LoadingGrid count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="Users"
            title="Team profiles coming shortly"
            description="Our counselors are updating their bios. In the meantime, reach out and we'll connect you with the right person."
            action={
              <Button onClick={() => onNavigate("public-contact")} className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90">
                <Icon name="Phone" className="size-4" /> Contact Us
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <Card key={m.id} className="alo-card-hover rounded-2xl border border-[var(--alo-border)] bg-white transition-all hover:-translate-y-0.5 hover:border-[var(--alo-brand)]/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-alo-gradient text-xl font-black text-white">
                      {m.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-[var(--alo-text)]">{m.name}</h3>
                      <p className="text-sm font-semibold text-[var(--alo-brand)]">{m.role}</p>
                      {m.specialty && (
                        <p className="text-xs text-[var(--alo-text-muted)]">{m.specialty}</p>
                      )}
                    </div>
                  </div>
                  {m.bio && (
                    <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-[var(--alo-text-muted)]">{m.bio}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14">
          <SectionCard
            title="Want to speak with a specific counselor?"
            description="Tell us what you're studying, where you want to go, and we'll match you with the best-fit counselor for your profile."
            icon="UserSearch"
            className="rounded-2xl border-2 border-[var(--alo-cta)]/15 bg-gradient-to-br from-[var(--alo-cta-soft)]/60 to-white"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--alo-text-muted)]">
                Free 30-minute consultation, no commitment required.
              </p>
              <Button onClick={() => onNavigate("public-contact")} className="h-12 bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta-hover)]">
                <Icon name="CalendarCheck" className="size-4" />
                Request Consultation
              </Button>
            </div>
          </SectionCard>
        </div>

        {/* Lead form */}
        <div className="mt-12">
          <PublicLeadForm
            sourceTag="Team page — bottom CTA"
            title="Send us your details"
            subtitle="We'll match you with the right counselor and reach out within 24 hours."
          />
        </div>
      </div>
    </div>
  );
}
export default PublicTeam;
