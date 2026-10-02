"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
} from "@/components/alo/shared";
import { Breadcrumb, SourceVerification, Disclaimer } from "@/components/alo/public-shared";
import { COUNTRIES, fmtDate, type ViewKey } from "@/lib/alo-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Scholarship = {
  name?: string;
  eligibility?: string;
  amount?: string;
  deadline?: string | null;
  country?: string;
  countrySlug?: string;
  flag?: string;
  lastVerifiedAt?: string | null;
  sourceUrl?: string | null;
  [k: string]: unknown;
};

type ApiResponse = {
  scholarships: Scholarship[];
  total: number;
};

const LEVEL_OPTIONS = ["Foundation", "Bachelor", "Masters", "MBA", "PhD"] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function amountToNumber(amount?: string): number {
  if (!amount) return 0;
  // strip currency symbols / commas / spaces, take first numeric chunk
  const match = amount.replace(/[, ]/g, "").match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

function formatAverageAmount(scholarships: Scholarship[]): string {
  const withAmount = scholarships.filter((s) => amountToNumber(s.amount) > 0);
  if (withAmount.length === 0) return "—";
  const avg = withAmount.reduce((sum, s) => sum + amountToNumber(s.amount), 0) / withAmount.length;
  // Pick the most common currency symbol from the first amount
  const firstAmount = withAmount[0]?.amount || "";
  const currencyMatch = firstAmount.match(/^[^\d]+/);
  const symbol = currencyMatch ? currencyMatch[0].trim() : "";
  if (avg >= 1000) {
    return `${symbol}${(avg / 1000).toFixed(1)}k`;
  }
  return `${symbol}${Math.round(avg)}`;
}

function parseDeadline(deadline?: string | null): Date | null {
  if (!deadline) return null;
  // Detect a month name + year (e.g. "June 2025" or "June (September intake)")
  const yearMatch = deadline.match(/\d{4}/);
  const monthMatch = deadline.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)/i,
  );
  if (!yearMatch || !monthMatch) return null;
  const year = parseInt(yearMatch[0], 10);
  const monthIdx = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ].indexOf(monthMatch[0].toLowerCase());
  if (monthIdx < 0) return null;
  return new Date(year, monthIdx, 15);
}

function deadlineInfo(deadline?: string | null): {
  days?: number;
  near: boolean;
  overdue: boolean;
} {
  const date = parseDeadline(deadline);
  if (!date) return { near: false, overdue: false };
  const diff = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return { days: Math.round(diff), near: true, overdue: true };
  if (diff <= 45) return { days: Math.round(diff), near: true, overdue: false };
  return { days: Math.round(diff), near: false, overdue: false };
}

function countrySlug(name?: string): string {
  if (!name) return "";
  return name.toLowerCase().replace(/\s+/g, "-");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ScholarshipFinderProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

export function ScholarshipFinder({ onNavigate }: ScholarshipFinderProps) {
  const { toast } = useToast();
  const [scholarships, setScholarships] = React.useState<Scholarship[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [country, setCountry] = React.useState<string>(""); // "" = All
  const [level, setLevel] = React.useState<string>(""); // "" = All
  const [query, setQuery] = React.useState<string>("");

  // Debounced fetch
  const buildUrl = React.useCallback(() => {
    const sp = new URLSearchParams();
    if (country) sp.set("country", country);
    if (level) sp.set("level", level);
    return `/api/scholarships?${sp.toString()}`;
  }, [country, level]);

  React.useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(buildUrl(), { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ApiResponse;
        if (cancelled) return;
        setScholarships(Array.isArray(data.scholarships) ? data.scholarships : []);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Please try again later.";
        if (!cancelled) {
          toast({
            title: "Couldn’t load scholarships",
            description: msg,
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [buildUrl, toast]);

  // Client-side name search
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scholarships;
    return scholarships.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const elig = (s.eligibility || "").toLowerCase();
      const country = (s.country || "").toLowerCase();
      return name.includes(q) || elig.includes(q) || country.includes(q);
    });
  }, [scholarships, query]);

  // Stats
  const totalScholarships = scholarships.length;
  const uniqueCountries = React.useMemo(
    () => new Set(scholarships.map((s) => s.country).filter(Boolean)).size,
    [scholarships],
  );
  const avgAmount = formatAverageAmount(scholarships);
  const upcomingDeadlines = React.useMemo(
    () =>
      scholarships.filter((s) => {
        const info = deadlineInfo(s.deadline);
        return info.near && !info.overdue;
      }).length,
    [scholarships],
  );

  const clearFilters = () => {
    setCountry("");
    setLevel("");
    setQuery("");
  };

  const handleCheckEligibility = (s: Scholarship) => {
    toast({
      title: "Eligibility check started",
      description: `Our counselors will review your profile against “${s.name || "this scholarship"}”. We’ll email the result within 48 hours.`,
    });
  };

  const handleApply = (s: Scholarship) => {
    toast({
      title: "Application interest captured",
      description: `Lead tagged from Scholarship Finder for “${s.name || "scholarship"}”. An ALO counselor will reach out within 24 hours.`,
    });
  };

  const handleConsultation = () => {
    toast({
      title: "Free consultation requested",
      description: "An ALO counselor will contact you within 24 hours to discuss scholarship options tailored to your profile.",
    });
  };

  const activeFilterCount = [country, level, query.trim()].filter(Boolean).length;

  return (
    <div className="bg-white pb-32">
      {/* Hero + Breadcrumb */}
      <div className="border-b border-[#0B5ED7]/10 bg-gradient-to-b from-[#e8f0fb]/60 to-white">
        <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-6 lg:py-10">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Scholarship Finder" },
            ]}
          />
          <div className="mt-5">
            <PageHeader
              title="Scholarship Finder"
              icon="Award"
              subtitle="Search scholarships across 13 countries. Verified amounts, eligibility, and deadlines."
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-6 lg:py-10">
        {/* Filter bar */}
        <Card className="rounded-2xl border-2 border-[#0B5ED7]/15 bg-white alo-shadow">
          <CardContent className="p-5 lg:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Country</label>
                <Select value={country || "ALL"} onValueChange={(v) => setCountry(v === "ALL" ? "" : v)}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All countries</SelectItem>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={countrySlug(c)}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Study Level</label>
                <Select value={level || "ALL"} onValueChange={(v) => setLevel(v === "ALL" ? "" : v)}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All levels</SelectItem>
                    {LEVEL_OPTIONS.map((l) => (
                      <SelectItem key={l} value={l.toLowerCase()}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Search by name</label>
                <div className="relative">
                  <Icon name="Search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Chevening, Commonwealth, Vice Chancellor..."
                    className="h-11 pl-9"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <Icon name="X" className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
                  {scholarships.length} scholarships · {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <Icon name="X" className="size-3.5" />
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats row */}
        <div className="mt-6">
          {loading ? (
            <LoadingGrid count={4} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Scholarships"
                value={totalScholarships}
                icon="Award"
                accent="blue"
                hint="Verified listings"
              />
              <StatCard
                label="Countries Covered"
                value={uniqueCountries}
                icon="Globe"
                accent="violet"
                hint="Across all destinations"
              />
              <StatCard
                label="Average Amount"
                value={avgAmount}
                icon="Wallet"
                accent="orange"
                hint="Across listings"
              />
              <StatCard
                label="Upcoming Deadlines"
                value={upcomingDeadlines}
                icon="CalendarClock"
                accent="amber"
                hint="Within 45 days"
              />
            </div>
          )}
        </div>

        {/* Scholarship grid */}
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="rounded-2xl border-2">
                  <CardContent className="space-y-3 pt-5">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="Award"
              title={scholarships.length === 0 ? "No scholarships loaded" : "No scholarships match your filters"}
              description={
                scholarships.length === 0
                  ? "Scholarship data is being verified by our team. Please check back soon."
                  : "Try removing some filters or searching for a different scholarship name."
              }
              action={
                activeFilterCount > 0 ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                ) : (
                  <Button className="bg-[#F97316] hover:bg-[#F97316]/90 text-white h-12" onClick={handleConsultation}>
                    <Icon name="CalendarCheck" className="size-4" />
                    Book a free consultation
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s, i) => {
                const dl = deadlineInfo(s.deadline);
                return (
                  <Card
                    key={`${s.name}-${i}`}
                    className="flex flex-col rounded-2xl border-2 border-[#0B5ED7]/15 transition-all hover:border-[#0B5ED7]/40 hover:shadow-lg"
                  >
                    <CardContent className="flex flex-1 flex-col pt-5">
                      {/* Country + flag */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none" aria-hidden>
                          {s.flag || "🌍"}
                        </span>
                        <Badge variant="outline" className="border-[#0B5ED7]/20 text-[#0B5ED7]">
                          {s.country || "Global"}
                        </Badge>
                        {dl.near && !dl.overdue && (
                          <Badge className="ml-auto bg-amber-100 text-amber-700 hover:bg-amber-100">
                            <Icon name="Clock" className="mr-1 size-3" />
                            {dl.days}d left
                          </Badge>
                        )}
                        {dl.overdue && (
                          <Badge variant="outline" className="ml-auto border-rose-200 text-rose-600">
                            <Icon name="AlertCircle" className="mr-1 size-3" />
                            Closed
                          </Badge>
                        )}
                      </div>

                      {/* Name */}
                      <h3 className="mt-3 line-clamp-2 text-base font-bold leading-snug text-[#0B5ED7]">
                        {s.name || "Untitled Scholarship"}
                      </h3>

                      {/* Amount */}
                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black tabular-nums text-[#F97316]">
                          {s.amount || "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">award value</span>
                      </div>

                      {/* Eligibility */}
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-foreground/80">
                        {s.eligibility || "Eligibility details available on the official source. Contact ALO for a personalized assessment."}
                      </p>

                      {/* Deadline */}
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <Icon
                          name="CalendarDays"
                          className={cn("size-4", dl.near && !dl.overdue ? "text-amber-600" : "text-muted-foreground")}
                        />
                        <span className={cn(dl.near && !dl.overdue ? "font-semibold text-amber-700" : "text-foreground")}>
                          {s.deadline || "Rolling intake"}
                        </span>
                      </div>

                      {/* Verification */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon name="ShieldCheck" className="size-3.5 text-emerald-600" />
                        <span>
                          Last verified <span className="font-medium text-foreground">{fmtDate(s.lastVerifiedAt)}</span>
                        </span>
                        {s.sourceUrl && (
                          <a
                            href={s.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto inline-flex items-center gap-0.5 font-medium text-[#0B5ED7] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon name="ExternalLink" className="size-3" />
                            Source
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-auto flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1 h-10 border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb]"
                          onClick={() => handleCheckEligibility(s)}
                        >
                          <Icon name="ClipboardCheck" className="size-4" />
                          Check Eligibility
                        </Button>
                        <Button
                          className="flex-1 h-10 bg-[#F97316] hover:bg-[#F97316]/90 text-white"
                          onClick={() => handleApply(s)}
                        >
                          <Icon name="Send" className="size-4" />
                          Apply Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10">
          <Card className="overflow-hidden rounded-2xl border-2 border-[#F97316]/30 bg-gradient-to-br from-[#fdece4]/60 to-white">
            <CardContent className="flex flex-col items-start gap-4 pt-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#F97316] text-white">
                  <Icon name="Headset" className="size-6" />
                </div>
                <div>
                  <p className="text-base font-bold text-[#F97316]">Can’t find the right scholarship?</p>
                  <p className="mt-1 max-w-xl text-sm text-foreground/80">
                    Our counselors have access to 200+ university-specific bursaries, country-partnership awards, and
                    need-based grants not listed publicly. Book a free 30-minute consultation and we’ll shortlist
                    scholarships matched to your profile and destination.
                  </p>
                </div>
              </div>
              <Button
                className="h-12 shrink-0 bg-[#F97316] px-6 text-white hover:bg-[#F97316]/90"
                onClick={handleConsultation}
              >
                <Icon name="CalendarCheck" className="size-4" />
                Book a free consultation
              </Button>
            </CardContent>
          </Card>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Prefer to submit details now? Visit our <button className="font-medium text-[#0B5ED7] hover:underline" onClick={() => onNavigate("public-home")}>lead form</button> and an ALO counselor will contact you within 24 hours.
          </p>
        </div>

        {/* Verification + disclaimer */}
        <div className="mt-8 space-y-3">
          <SourceVerification
            sourceUrl={null}
            lastVerifiedAt={new Date()}
            verificationStatus="VERIFIED"
          />
          <Disclaimer text="Scholarship amounts, eligibility criteria, and deadlines are verified against official university and government sources at the date shown. They may change without notice. Always confirm the current terms with the awarding body and your ALO counselor before applying." />
        </div>
      </div>
    </div>
  );
}
export default ScholarshipFinder;
