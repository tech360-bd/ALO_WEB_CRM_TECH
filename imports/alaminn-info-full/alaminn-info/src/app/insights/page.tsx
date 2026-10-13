import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicPage } from "@/components/site/public-chrome";
import { ArrowUpRight, Clock, Newspaper, Library, FileText, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Articles, resources, professional posts and updates — practical, evidence-aware content on operations, growth, AI and systems.",
};

const ARTICLE_CATEGORIES: Record<string, string> = {
  "executive-leadership": "Executive Leadership",
  "business-operations": "Business Operations",
  "sales-growth": "Sales & Growth",
  "international-education": "International Education",
  "university-partnerships": "University Partnerships",
  "bangladesh-market": "Bangladesh Market",
  "ai-automation": "AI & Automation",
  "crm-technology": "CRM Technology",
  "digital-marketing": "Digital Marketing",
  "personal-branding": "Personal Branding",
  "professional-development": "Professional Development",
};

const RESOURCE_TYPE_ICON: Record<string, typeof FileText> = {
  guide: FileText,
  template: FileText,
  checklist: FileText,
  report: FileText,
  video: FileText,
  download: Download,
};

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const [articles, resources] = await Promise.all([
    db.article.findMany({
      where: { status: "published" },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      select: {
        id: true, title: true, slug: true, summary: true, category: true,
        tags: true, author: true, readingMinutes: true, publishedAt: true, featured: true,
      },
    }),
    db.resource.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, slug: true, description: true, category: true,
        type: true, readTime: true,
      },
    }),
  ]);

  return (
    <PublicPage>
      <section className="container mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="max-w-3xl mb-12">
          <span className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-4">
            <Newspaper className="h-4 w-4" /> Insights
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Working notes on operations, growth, AI and systems.
          </h1>
          <p className="text-lg text-muted-foreground">
            A single hub for articles, resources, professional posts and updates.
            Practical, evidence-aware content on the systems behind sustainable growth.
          </p>
        </div>

        {/* Tab-like category filters */}
        <div className="mb-10 flex flex-wrap items-center gap-2 border-b pb-4">
          <a
            href="#articles"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
          >
            <Newspaper className="h-4 w-4" /> Articles ({articles.length})
          </a>
          <a
            href="#resources"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
          >
            <Library className="h-4 w-4" /> Resources ({resources.length})
          </a>
        </div>

        {/* Articles */}
        <div id="articles" className="scroll-mt-24">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" /> Articles
          </h2>
          {articles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Articles will appear here once published. The content pipeline is evidence-controlled —
                every claim is verifiable.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {articles.map((a) => (
                <Link key={a.id} href={`/articles/${a.slug}`}>
                  <Card className="h-full hover:border-primary/40 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px]">{ARTICLE_CATEGORIES[a.category] || a.category}</Badge>
                        {a.featured && <Badge variant="default" className="text-[10px]">Featured</Badge>}
                      </div>
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{a.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{a.summary}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.readingMinutes} min</span>
                        <span>{new Date(a.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Resources */}
        <div id="resources" className="scroll-mt-24">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" /> Resources
          </h2>
          {resources.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Practical resources — checklists, templates and briefs — will appear here.
                Each resource is designed to be immediately actionable.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {resources.map((r) => {
                const Icon = RESOURCE_TYPE_ICON[r.type] || FileText;
                return (
                  <Card key={r.id} className="h-full hover:border-primary/40 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] uppercase">{r.type}</Badge>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{r.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{r.description}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {r.readTime} min read
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button asChild size="lg">
            <Link href="/work-with-me">Work with me <ArrowUpRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
      </section>
    </PublicPage>
  );
}
