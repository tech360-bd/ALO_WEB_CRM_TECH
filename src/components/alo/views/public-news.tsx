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
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { useToast } from "@/hooks/use-toast";
import { fmtDate, type ViewKey } from "@/lib/alo-types";

interface PublicNewsProps {
  slug?: string;
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface NewsListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  category: string;
  country?: string | null;
  tags: string;
  authorName?: string | null;
  isPinned: boolean;
  publishedAt: string;
}

interface NewsArticle extends NewsListItem {
  content: string;
}

const CATEGORIES = ["All", "Announcement", "University Update", "Immigration Update", "Scholarship Update", "Country Update", "Event"];

const CATEGORY_COLORS: Record<string, string> = {
  Announcement: "bg-[#FFF3EA] text-[#F37021]",
  "University Update": "bg-[#EAF3FF] text-[#0066CC]",
  "Immigration Update": "bg-red-50 text-red-700",
  "Scholarship Update": "bg-emerald-50 text-emerald-700",
  "Country Update": "bg-violet-50 text-violet-700",
  Event: "bg-amber-50 text-amber-700",
};

export function PublicNews({ slug, onNavigate }: PublicNewsProps) {
  if (slug) return <NewsArticleDetail slug={slug} onNavigate={onNavigate} />;
  return <NewsList onNavigate={onNavigate} />;
}

// ──────────────────────────────────────────────────────────────────────────────

function NewsList({ onNavigate }: { onNavigate: (v: ViewKey, slug?: string) => void }) {
  const { toast } = useToast();
  const [articles, setArticles] = React.useState<NewsListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [category, setCategory] = React.useState<string>("All");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const url = category === "All" ? "/api/news" : `/api/news?category=${encodeURIComponent(category)}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        if (cancelled) return;
        setArticles(Array.isArray(data.articles) ? data.articles : []);
      } catch (e: any) {
        if (!cancelled) {
          toast({
            title: "Couldn't load news",
            description: "Please try again in a moment.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [category, toast]);

  const pinned = articles.filter((a) => a.isPinned);
  const regular = articles.filter((a) => !a.isPinned);

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[#0066CC]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "News" },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge className="bg-[#EAF3FF] text-[#0066CC] border border-[#0066CC]/20 hover:bg-[#EAF3FF]">
              <Icon name="Newspaper" className="mr-1 size-3" />
              Updated Weekly
            </Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0B2447] sm:text-5xl">
              Latest <span className="text-[#0066CC]">News</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#5A7299] sm:text-lg">
              Real, verified news about visa policies, university updates, scholarship announcements, and immigration
              changes affecting Bangladeshi students. Verified against official government sources weekly.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6 lg:py-14">
        {/* Category filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                category === c
                  ? "bg-[#0066CC] text-white"
                  : "border border-[#0066CC]/20 bg-white text-[#0066CC] hover:bg-[#EAF3FF]"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Pinned */}
        {!loading && pinned.length > 0 && category === "All" && (
          <div className="mb-10">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#F37021]">📌 Pinned News</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              {pinned.slice(0, 2).map((article) => (
                <Card
                  key={article.id}
                  className="alo-card-hover group cursor-pointer rounded-2xl border-2 border-[#F37021]/25 bg-gradient-to-br from-[#FFF3EA]/30 to-white transition-all hover:-translate-y-1 hover:shadow-lg"
                  onClick={() => onNavigate("public-news", article.slug)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Badge className={cn(CATEGORY_COLORS[article.category] || "bg-slate-100 text-slate-700")}>
                        {article.category}
                      </Badge>
                      {article.country && (
                        <Badge variant="outline" className="bg-white text-[#0B2447]">{article.country}</Badge>
                      )}
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-[#0B2447] group-hover:text-[#F37021]">{article.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#5A7299]">{article.excerpt}</p>
                    <div className="mt-4 text-xs text-[#5A7299]">{fmtDate(article.publishedAt)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All articles */}
        <h2 className="mb-4 text-lg font-bold text-[#0B2447]">
          {category === "All" ? "All News" : `${category}`}{" "}
          <span className="text-sm font-medium text-[#5A7299]">({regular.length})</span>
        </h2>

        {loading ? (
          <LoadingGrid count={6} />
        ) : regular.length === 0 ? (
          <EmptyState
            icon="Newspaper"
            title="No news articles available"
            description="Check back soon — we publish new immigration and university updates weekly."
            action={
              <Button onClick={() => onNavigate("public-resources")} className="bg-[#0066CC] text-white hover:bg-[#0066CC]/90">
                <Icon name="BookOpen" className="size-4" /> Browse Resources
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {regular.map((article) => (
              <Card
                key={article.id}
                className="alo-card-hover group flex cursor-pointer flex-col rounded-2xl border border-[#E2E8F0] bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => onNavigate("public-news", article.slug)}
              >
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="mb-4 aspect-[16/9] w-full rounded-xl bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]" />
                  <div className="flex items-center gap-2">
                    <Badge className={cn(CATEGORY_COLORS[article.category] || "bg-slate-100 text-slate-700")}>
                      {article.category}
                    </Badge>
                    {article.country && (
                      <Badge variant="outline" className="bg-white text-[#0B2447]">{article.country}</Badge>
                    )}
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-base font-bold text-[#0B2447] group-hover:text-[#0066CC]">{article.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#5A7299]">{article.excerpt}</p>
                  <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-[#5A7299]">
                    <Icon name="Calendar" className="size-3" />
                    {fmtDate(article.publishedAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14">
          <PublicLeadForm
            sourceTag="News page — bottom CTA"
            title="Stay informed about your destination country"
            subtitle="Subscribe to updates by submitting your details — we'll send relevant news as it breaks."
          />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

interface ContentBlock {
  type: "p" | "h2" | "h3" | "quote" | "list";
  text?: string;
  items?: string[];
}

function NewsArticleDetail({ slug, onNavigate }: { slug: string; onNavigate: (v: ViewKey, slug?: string) => void }) {
  const { toast } = useToast();
  const [article, setArticle] = React.useState<NewsArticle | null>(null);
  const [related, setRelated] = React.useState<NewsListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/news?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 404) throw new Error("Article not found");
          throw new Error("HTTP " + res.status);
        }
        const data = await res.json();
        if (cancelled) return;
        setArticle(data.article);
        const relatedRes = await fetch("/api/news", { cache: "no-store" });
        const relatedData = await relatedRes.json();
        if (cancelled) return;
        setRelated((relatedData.articles || []).filter((a: NewsListItem) => a.slug !== slug).slice(0, 3));
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load article");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 lg:px-6">
          <LoadingGrid count={4} />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-16 lg:px-6">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "News", onClick: () => onNavigate("public-news") },
              { label: "Not found" },
            ]}
          />
          <EmptyState
            icon="FileQuestion"
            title="Article not found"
            description={error || "We couldn't find that article."}
            action={
              <Button onClick={() => onNavigate("public-news")} className="bg-[#0066CC] text-white hover:bg-[#0066CC]/90">
                <Icon name="ArrowLeft" className="size-4" /> Back to News
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const blocks: ContentBlock[] = (() => {
    try { return JSON.parse(article.content) as ContentBlock[]; } catch { return []; }
  })();

  return (
    <div className="bg-white">
      <section className="border-b border-[#0066CC]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-white">
        <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6 lg:py-14">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "News", onClick: () => onNavigate("public-news") },
              { label: article.title },
            ]}
          />
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge className={cn(CATEGORY_COLORS[article.category] || "bg-slate-100 text-slate-700")}>
              {article.category}
            </Badge>
            {article.country && (
              <Badge variant="outline" className="bg-white text-[#0B2447]">{article.country}</Badge>
            )}
            {article.isPinned && (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                <Icon name="Pin" className="mr-1 size-3" /> Pinned
              </Badge>
            )}
            <span className="text-xs text-[#5A7299]">{fmtDate(article.publishedAt)}</span>
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#0B2447] sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#5A7299] sm:text-lg">{article.excerpt}</p>
          {article.authorName && (
            <p className="mt-4 text-xs text-[#5A7299]">By {article.authorName}</p>
          )}
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-10 lg:px-6 lg:py-14">
        <div className="space-y-6">
          {blocks.map((block, idx) => {
            if (block.type === "h2") {
              return <h2 key={idx} className="mt-8 text-2xl font-black text-[#0B2447]">{block.text}</h2>;
            }
            if (block.type === "h3") {
              return <h3 key={idx} className="mt-6 text-xl font-bold text-[#0B2447]">{block.text}</h3>;
            }
            if (block.type === "quote") {
              return (
                <blockquote key={idx} className="border-l-4 border-[#F37021] bg-[#FFF3EA]/50 px-5 py-4 text-base italic text-[#0B2447]">
                  {block.text}
                </blockquote>
              );
            }
            if (block.type === "list" && Array.isArray(block.items)) {
              return (
                <ul key={idx} className="space-y-2">
                  {block.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[15px] leading-relaxed text-[#0B2447]">
                      <Icon name="ChevronRight" className="mt-1 size-4 shrink-0 text-[#0066CC]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return <p key={idx} className="text-[15px] leading-relaxed text-[#5A7299]">{block.text}</p>;
          })}
        </div>

        {/* Disclaimer */}
        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <Icon name="Info" className="mr-1.5 inline size-3.5" />
          Visa and immigration rules change frequently. Always confirm with an ALO counselor before making decisions based on news.
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl border-2 border-[#0066CC]/15 bg-gradient-to-br from-[#EAF3FF]/60 to-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-bold text-[#0B2447]">Have questions about this update?</p>
              <p className="text-sm text-[#5A7299]">Talk to a counselor — free consultation, no commitment.</p>
            </div>
            <Button onClick={() => onNavigate("public-contact")} className="h-11 shrink-0 bg-[#F37021] text-white hover:bg-[#c8451a]">
              <Icon name="CalendarCheck" className="size-4" />
              Book Free Consultation
            </Button>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-[#0066CC]/10 bg-[#F7FAFE]">
          <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6 lg:py-14">
            <h2 className="text-xl font-black text-[#0B2447]">Related news</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Card
                  key={r.id}
                  className="alo-card-hover group cursor-pointer rounded-2xl border border-[#E2E8F0] bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  onClick={() => onNavigate("public-news", r.slug)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2">
                      <Badge className={cn(CATEGORY_COLORS[r.category] || "bg-slate-100 text-slate-700")}>{r.category}</Badge>
                      <span className="text-xs text-[#5A7299]">{fmtDate(r.publishedAt)}</span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-bold text-[#0B2447] group-hover:text-[#0066CC]">{r.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#5A7299]">{r.excerpt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
