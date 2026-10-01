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

interface PublicBlogProps {
  slug?: string;
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface BlogPostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  category: string;
  tags: string;
  authorName?: string | null;
  authorRole?: string | null;
  readMinutes: number;
  featured: boolean;
  publishedAt: string;
}

interface BlogPost extends BlogPostListItem {
  content: string;
}

const CATEGORIES = ["All", "Study Tips", "Visa Guide", "Career", "Country Guide", "Scholarships", "English Tests", "Application", "Pre-Departure", "Student Life"];

export function PublicBlog({ slug, onNavigate }: PublicBlogProps) {
  // ── DETAIL VIEW ─────────────────────────────────────────────────────────
  if (slug) {
    return <BlogPostDetail slug={slug} onNavigate={onNavigate} />;
  }

  return <BlogList onNavigate={onNavigate} />;
}

// ──────────────────────────────────────────────────────────────────────────────
// LISTING VIEW
// ──────────────────────────────────────────────────────────────────────────────

function BlogList({ onNavigate }: { onNavigate: (v: ViewKey, slug?: string) => void }) {
  const { toast } = useToast();
  const [posts, setPosts] = React.useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [category, setCategory] = React.useState<string>("All");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const url = category === "All" ? "/api/blog" : `/api/blog?category=${encodeURIComponent(category)}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        if (cancelled) return;
        setPosts(Array.isArray(data.posts) ? data.posts : []);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load blog posts");
          toast({
            title: "Couldn\u2019t load blog posts",
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

  const featured = posts.filter((p) => p.featured);
  const regular = posts.filter((p) => !p.featured);

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[#0B5ED7]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Blog" },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge className="bg-[#FFF3EA] text-[#F97316] border border-[#F97316]/20 hover:bg-[#FFF3EA]">
              <Icon name="Newspaper" className="mr-1 size-3" />
              Insights & Guides
            </Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0B2447] sm:text-5xl">
              ALO Education <span className="text-[#0B5ED7]">Blog</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#5A7299] sm:text-lg">
              Honest, up-to-date study-abroad guidance written by ALO counselors — covering visas, scholarships,
              SOPs, English tests, and life as a Bangladeshi student abroad.
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
                  ? "bg-[#0B5ED7] text-white"
                  : "border border-[#0B5ED7]/20 bg-white text-[#0B5ED7] hover:bg-[#EAF3FF]"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Featured */}
        {!loading && featured.length > 0 && category === "All" && (
          <div className="mb-10">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#F97316]">Featured Articles</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              {featured.slice(0, 2).map((post) => (
                <Card
                  key={post.id}
                  className="alo-card-hover group cursor-pointer rounded-2xl border-2 border-[#0B5ED7]/15 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
                  onClick={() => onNavigate("public-blog", post.slug)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-[16/9] w-full rounded-t-2xl bg-gradient-to-br from-[#0B5ED7] to-[#F97316]" />
                    <div className="p-6">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#FFF3EA] text-[#F97316] hover:bg-[#FFF3EA]">{post.category}</Badge>
                        <span className="text-xs text-[#5A7299]">{fmtDate(post.publishedAt)}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-[#0B2447] group-hover:text-[#0B5ED7]">{post.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#5A7299]">{post.excerpt}</p>
                      <div className="mt-4 flex items-center gap-3 text-xs text-[#5A7299]">
                        {post.authorName && <span className="font-semibold text-[#0B2447]">{post.authorName}</span>}
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Icon name="Clock" className="size-3" />
                          {post.readMinutes} min read
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All posts */}
        <h2 className="mb-4 text-lg font-bold text-[#0B2447]">
          {category === "All" ? "All Articles" : `${category} Articles`}{" "}
          <span className="text-sm font-medium text-[#5A7299]">({regular.length})</span>
        </h2>

        {loading ? (
          <LoadingGrid count={6} />
        ) : error && posts.length === 0 ? (
          <EmptyState
            icon="Newspaper"
            title="Couldn't load blog posts"
            description="Please refresh the page or try again later."
            action={
              <Button onClick={() => window.location.reload()} className="bg-[#0B5ED7] text-white hover:bg-[#0B5ED7]/90">
                <Icon name="RefreshCw" className="size-4" /> Refresh
              </Button>
            }
          />
        ) : regular.length === 0 ? (
          <EmptyState
            icon="Newspaper"
            title="Blog articles coming soon"
            description="Check back for study abroad tips and insights from our counselors."
            action={
              <Button onClick={() => onNavigate("public-resources")} className="bg-[#0B5ED7] text-white hover:bg-[#0B5ED7]/90">
                <Icon name="BookOpen" className="size-4" /> Browse Resources
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {regular.map((post) => (
              <Card
                key={post.id}
                className="alo-card-hover group flex cursor-pointer flex-col rounded-2xl border border-[#E2E8F0] bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => onNavigate("public-blog", post.slug)}
              >
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="mb-4 aspect-[16/9] w-full rounded-xl bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF3EA]" />
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-[#EAF3FF] text-[#0B5ED7]">{post.category}</Badge>
                    <span className="text-xs text-[#5A7299]">{fmtDate(post.publishedAt)}</span>
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-base font-bold text-[#0B2447] group-hover:text-[#0B5ED7]">{post.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#5A7299]">{post.excerpt}</p>
                  <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-[#5A7299]">
                    {post.authorName && <span className="font-semibold text-[#0B2447]">{post.authorName}</span>}
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Icon name="Clock" className="size-3" />
                      {post.readMinutes} min
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14">
          <PublicLeadForm
            sourceTag="Blog page — bottom CTA"
            title="Have a specific question?"
            subtitle="Submit your details and a counselor will write back with personalised guidance within 24 hours."
          />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// BLOG POST DETAIL
// ──────────────────────────────────────────────────────────────────────────────

interface ContentBlock {
  type: "p" | "h2" | "h3" | "quote" | "list";
  text?: string;
  items?: string[];
}

function BlogPostDetail({ slug, onNavigate }: { slug: string; onNavigate: (v: ViewKey, slug?: string) => void }) {
  const { toast } = useToast();
  const [post, setPost] = React.useState<BlogPost | null>(null);
  const [related, setRelated] = React.useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/blog?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 404) throw new Error("Article not found");
          throw new Error("HTTP " + res.status);
        }
        const data = await res.json();
        if (cancelled) return;
        setPost(data.post);
        // Fetch related posts from same category
        const relatedRes = await fetch("/api/blog", { cache: "no-store" });
        const relatedData = await relatedRes.json();
        if (cancelled) return;
        setRelated((relatedData.posts || []).filter((p: BlogPostListItem) => p.slug !== slug).slice(0, 3));
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

  if (error || !post) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-16 lg:px-6">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Blog", onClick: () => onNavigate("public-blog") },
              { label: "Not found" },
            ]}
          />
          <EmptyState
            icon="FileQuestion"
            title="Article not found"
            description={error || "We couldn't find that article."}
            action={
              <Button onClick={() => onNavigate("public-blog")} className="bg-[#0B5ED7] text-white hover:bg-[#0B5ED7]/90">
                <Icon name="ArrowLeft" className="size-4" /> Back to Blog
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const blocks: ContentBlock[] = (() => {
    try { return JSON.parse(post.content) as ContentBlock[]; } catch { return []; }
  })();

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-[#0B5ED7]/10 bg-gradient-to-br from-[#EAF3FF] via-white to-white">
        <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6 lg:py-14">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Blog", onClick: () => onNavigate("public-blog") },
              { label: post.title },
            ]}
          />
          <div className="mt-6 flex items-center gap-2">
            <Badge className="bg-[#FFF3EA] text-[#F97316] hover:bg-[#FFF3EA]">{post.category}</Badge>
            <span className="text-xs text-[#5A7299]">{fmtDate(post.publishedAt)}</span>
            <span className="text-xs text-[#5A7299]">·</span>
            <span className="flex items-center gap-1 text-xs text-[#5A7299]">
              <Icon name="Clock" className="size-3" />
              {post.readMinutes} min read
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#0B2447] sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#5A7299] sm:text-lg">{post.excerpt}</p>
          {post.authorName && (
            <div className="mt-6 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-alo-gradient text-sm font-black text-white">
                {post.authorName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="text-sm font-bold text-[#0B2447]">{post.authorName}</p>
                {post.authorRole && <p className="text-xs text-[#5A7299]">{post.authorRole}</p>}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* BODY */}
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
                <blockquote key={idx} className="border-l-4 border-[#F97316] bg-[#FFF3EA]/50 px-5 py-4 text-base italic text-[#0B2447]">
                  {block.text}
                </blockquote>
              );
            }
            if (block.type === "list" && Array.isArray(block.items)) {
              return (
                <ul key={idx} className="space-y-2">
                  {block.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[15px] leading-relaxed text-[#0B2447]">
                      <Icon name="ChevronRight" className="mt-1 size-4 shrink-0 text-[#0B5ED7]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return <p key={idx} className="text-[15px] leading-relaxed text-[#5A7299]">{block.text}</p>;
          })}
        </div>

        {/* Tags */}
        {post.tags && (() => {
          const tags = (() => { try { return JSON.parse(post.tags) as string[]; } catch { return []; } })();
          if (tags.length === 0) return null;
          return (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-[#0B5ED7]/10 pt-6">
              {tags.map((t) => (
                <Badge key={t} variant="outline" className="bg-[#F7FAFE] text-[#5A7299]">#{t}</Badge>
              ))}
            </div>
          );
        })()}

        {/* CTA */}
        <div className="mt-10 rounded-2xl border-2 border-[#0B5ED7]/15 bg-gradient-to-br from-[#EAF3FF]/60 to-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-bold text-[#0B2447]">Need personalised guidance?</p>
              <p className="text-sm text-[#5A7299]">Book a free 30-minute consultation with an ALO counselor.</p>
            </div>
            <Button onClick={() => onNavigate("public-contact")} className="h-11 shrink-0 bg-[#F97316] text-white hover:bg-[#c8451a]">
              <Icon name="CalendarCheck" className="size-4" />
              Book Free Consultation
            </Button>
          </div>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-[#0B5ED7]/10 bg-[#F7FAFE]">
          <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6 lg:py-14">
            <h2 className="text-xl font-black text-[#0B2447]">Related articles</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Card
                  key={r.id}
                  className="alo-card-hover group cursor-pointer rounded-2xl border border-[#E2E8F0] bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  onClick={() => onNavigate("public-blog", r.slug)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-[#EAF3FF] text-[#0B5ED7]">{r.category}</Badge>
                      <span className="text-xs text-[#5A7299]">{fmtDate(r.publishedAt)}</span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-bold text-[#0B2447] group-hover:text-[#0B5ED7]">{r.title}</h3>
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
export default PublicBlog;
