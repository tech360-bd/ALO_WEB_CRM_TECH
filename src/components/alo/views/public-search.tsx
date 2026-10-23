"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Icon,
  EmptyState,
  LoadingGrid,
} from "@/components/alo/shared";
import { Breadcrumb } from "@/components/alo/public-shared";
import { useToast } from "@/hooks/use-toast";
import { fmtDate, type ViewKey } from "@/lib/alo-types";

interface PublicSearchProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface UniversityResult {
  slug: string;
  name: string;
  city: string;
  countrySlug: string;
  quickFacts: string;
  overview: string;
}

interface CourseResult {
  slug: string;
  name: string;
  level: string;
  subject: string;
  duration: string;
  tuition: string;
  city: string;
  countrySlug: string;
  universitySlug: string;
}

interface BlogResult {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
}

interface NewsResult {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  country?: string | null;
  publishedAt: string;
}

interface EventResult {
  slug: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  eventType: string;
  category: string;
}

interface CountryResult {
  slug: string;
  name: string;
  shortName: string;
  flag: string;
  capital: string;
}

interface ExamResult {
  slug: string;
  name: string;
  fullName: string;
}

interface SearchData {
  universities: UniversityResult[];
  courses: CourseResult[];
  blogPosts: BlogResult[];
  newsArticles: NewsResult[];
  events: EventResult[];
  countries: CountryResult[];
  exams: ExamResult[];
  total: number;
}

const POPULAR_SEARCHES = ["IELTS", "UK visa", "Computer Science", "Scholarship", "Australia", "MBA", "Foundation"];

const COUNTRY_NAMES: Record<string, string> = {
  uk: "🇬🇧 UK",
  usa: "🇺🇸 USA",
  canada: "🇨🇦 Canada",
  australia: "🇦🇺 Australia",
  ireland: "🇮🇪 Ireland",
  "new-zealand": "🇳🇿 New Zealand",
  germany: "🇩🇪 Germany",
  dubai: "🇦🇪 Dubai",
  malaysia: "🇲🇾 Malaysia",
  denmark: "🇩🇰 Denmark",
  japan: "🇯🇵 Japan",
  "south-korea": "🇰🇷 South Korea",
  europe: "🇪🇺 Europe",
};

export function PublicSearch({ onNavigate }: PublicSearchProps) {
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"all" | "universities" | "courses" | "blog" | "news" | "events" | "countries" | "exams">("all");

  async function runSearch(q: string) {
    if (q.trim().length < 2) {
      toast({ title: "Search too short", description: "Please enter at least 2 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data: SearchData = await res.json();
      setResults(data);
    } catch {
      toast({ title: "Search failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  function onPopular(q: string) {
    setQuery(q);
    runSearch(q);
  }

  const tabs = [
    { key: "all" as const, label: "All", count: results?.total ?? 0 },
    { key: "universities" as const, label: "Universities", count: results?.universities.length ?? 0 },
    { key: "courses" as const, label: "Courses", count: results?.courses.length ?? 0 },
    { key: "blog" as const, label: "Blog", count: results?.blogPosts.length ?? 0 },
    { key: "news" as const, label: "News", count: results?.newsArticles.length ?? 0 },
    { key: "events" as const, label: "Events", count: results?.events.length ?? 0 },
    { key: "countries" as const, label: "Countries", count: results?.countries.length ?? 0 },
    { key: "exams" as const, label: "English Tests", count: results?.exams.length ?? 0 },
  ];

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[var(--alo-brand)]/10 bg-gradient-to-br from-[var(--alo-brand-light)] via-white to-[var(--alo-cta-soft)]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Search" },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge className="bg-[var(--alo-cta-soft)] text-[var(--alo-cta)] border border-[var(--alo-cta)]/20 hover:bg-[var(--alo-cta-soft)]">
              <Icon name="Search" className="mr-1 size-3" />
              Search 794 courses, 408 universities, 13 countries
            </Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[var(--alo-text)] sm:text-5xl">
              Search ALO <span className="text-[var(--alo-brand)]">Education</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--alo-text-muted)] sm:text-lg">
              Find universities, courses, blog posts, news, events, countries, and English tests — all in one search.
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={onSubmit} className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <Icon name="Search" className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--alo-text-muted)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search universities, courses, blog posts, news, events..."
                className="h-14 w-full rounded-xl border-2 border-[var(--alo-brand)]/15 bg-white pl-12 pr-4 text-base text-[var(--alo-text)] placeholder:text-[var(--alo-text-muted)] focus:border-[var(--alo-brand)] focus:outline-none focus:ring-4 focus:ring-[var(--alo-brand)]/10"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={loading || query.trim().length < 2} className="h-14 px-6 bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta-hover)]">
              {loading ? <Icon name="Loader2" className="size-5 animate-spin" /> : <Icon name="Search" className="size-5" />}
              <span className="ml-2 font-semibold">Search</span>
            </Button>
          </form>

          {/* Popular searches */}
          {!searched && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-[var(--alo-text-muted)]">Popular searches:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((q) => (
                  <button
                    key={q}
                    onClick={() => onPopular(q)}
                    className="rounded-full border border-[var(--alo-brand)]/20 bg-white px-3 py-1.5 text-xs font-medium text-[var(--alo-brand)] transition-colors hover:bg-[var(--alo-brand-light)]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6 lg:py-14">
        {/* Results */}
        {loading ? (
          <LoadingGrid count={6} />
        ) : !searched ? (
          <EmptyState
            icon="Search"
            title="Start your search above"
            description="Search across universities, courses, blog posts, news, events, countries, and English tests."
          />
        ) : !results || results.total === 0 ? (
          <EmptyState
            icon="SearchX"
            title={`No results for "${query}"`}
            description="Try a different search term, or browse our popular categories below."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {POPULAR_SEARCHES.map((q) => (
                  <button
                    key={q}
                    onClick={() => onPopular(q)}
                    className="rounded-full border border-[var(--alo-brand)]/20 bg-white px-3 py-1.5 text-xs font-medium text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            }
          />
        ) : (
          <>
            <p className="mb-6 text-sm text-[var(--alo-text-muted)]">
              <span className="font-semibold text-[var(--alo-text)]">{results.total} results</span> found for{" "}
              <span className="font-semibold text-[var(--alo-brand)]">"{query}"</span>
            </p>

            {/* Tabs */}
            <div className="mb-6 flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                    activeTab === t.key
                      ? "bg-[var(--alo-brand)] text-white"
                      : "border border-[var(--alo-brand)]/20 bg-white text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                  )}
                >
                  {t.label} ({t.count})
                </button>
              ))}
            </div>

            {/* Results by type */}
            <div className="space-y-10">
              {(activeTab === "all" || activeTab === "universities") && results.universities.length > 0 && (
                <ResultGroup title="Universities" icon="Building2" accent="blue">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.universities.map((u) => (
                      <ResultCard
                        key={u.slug}
                        title={u.name}
                        subtitle={`${u.city} · ${COUNTRY_NAMES[u.countrySlug] || u.countrySlug}`}
                        description={u.overview.slice(0, 120) + "..."}
                        onClick={() => onNavigate("public-university", u.slug)}
                      />
                    ))}
                  </div>
                </ResultGroup>
              )}

              {(activeTab === "all" || activeTab === "courses") && results.courses.length > 0 && (
                <ResultGroup title="Courses" icon="BookOpen" accent="orange">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.courses.map((c) => (
                      <ResultCard
                        key={c.slug}
                        title={c.name}
                        subtitle={`${c.level} · ${c.subject} · ${c.duration}`}
                        description={`${c.tuition} tuition · ${c.city}, ${COUNTRY_NAMES[c.countrySlug] || c.countrySlug}`}
                        onClick={() => onNavigate("public-course", c.slug)}
                      />
                    ))}
                  </div>
                </ResultGroup>
              )}

              {(activeTab === "all" || activeTab === "blog") && results.blogPosts.length > 0 && (
                <ResultGroup title="Blog Posts" icon="Newspaper" accent="blue">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.blogPosts.map((b) => (
                      <ResultCard
                        key={b.slug}
                        title={b.title}
                        subtitle={`${b.category} · ${fmtDate(b.publishedAt)}`}
                        description={b.excerpt}
                        onClick={() => onNavigate("public-blog", b.slug)}
                      />
                    ))}
                  </div>
                </ResultGroup>
              )}

              {(activeTab === "all" || activeTab === "news") && results.newsArticles.length > 0 && (
                <ResultGroup title="News" icon="Megaphone" accent="orange">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.newsArticles.map((n) => (
                      <ResultCard
                        key={n.slug}
                        title={n.title}
                        subtitle={`${n.category}${n.country ? ` · ${n.country}` : ""} · ${fmtDate(n.publishedAt)}`}
                        description={n.excerpt}
                        onClick={() => onNavigate("public-news", n.slug)}
                      />
                    ))}
                  </div>
                </ResultGroup>
              )}

              {(activeTab === "all" || activeTab === "events") && results.events.length > 0 && (
                <ResultGroup title="Events" icon="Calendar" accent="blue">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.events.map((e) => (
                      <ResultCard
                        key={e.slug}
                        title={e.title}
                        subtitle={`${fmtDate(e.eventDate)} · ${e.location}`}
                        description={e.description}
                        onClick={() => onNavigate("public-events", e.slug)}
                      />
                    ))}
                  </div>
                </ResultGroup>
              )}

              {(activeTab === "all" || activeTab === "countries") && results.countries.length > 0 && (
                <ResultGroup title="Countries" icon="Globe" accent="orange">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.countries.map((c) => (
                      <ResultCard
                        key={c.slug}
                        title={`${c.flag} ${c.name}`}
                        subtitle={`Capital: ${c.capital}`}
                        description={`Short name: ${c.shortName}`}
                        onClick={() => onNavigate("public-country", c.slug)}
                      />
                    ))}
                  </div>
                </ResultGroup>
              )}

              {(activeTab === "all" || activeTab === "exams") && results.exams.length > 0 && (
                <ResultGroup title="English Tests" icon="Languages" accent="blue">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.exams.map((e) => (
                      <ResultCard
                        key={e.slug}
                        title={e.name}
                        subtitle={e.fullName}
                        description="AI-scored mock tests available"
                        onClick={() => onNavigate("public-exam", e.slug)}
                      />
                    ))}
                  </div>
                </ResultGroup>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

function ResultGroup({ title, icon, accent, children }: { title: string; icon: string; accent: "blue" | "orange"; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className={cn(
          "flex size-8 items-center justify-center rounded-xl",
          accent === "blue" ? "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]" : "bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]"
        )}>
          <Icon name={icon} className="size-4" />
        </div>
        <h2 className="text-lg font-bold text-[var(--alo-text)]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ResultCard({ title, subtitle, description, onClick }: { title: string; subtitle: string; description: string; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className="alo-card-hover group cursor-pointer rounded-2xl border border-[var(--alo-border)] bg-white transition-all hover:-translate-y-0.5 hover:border-[var(--alo-brand)]/30 hover:shadow-lg"
    >
      <CardContent className="p-5">
        <h3 className="line-clamp-2 text-base font-bold text-[var(--alo-text)] group-hover:text-[var(--alo-brand)]">{title}</h3>
        <p className="mt-1 text-xs font-medium text-[var(--alo-brand)]">{subtitle}</p>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--alo-text-muted)]">{description}</p>
        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[var(--alo-brand)]">
          View details
          <Icon name="ArrowRight" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </CardContent>
    </Card>
  );
}
export default PublicSearch;
