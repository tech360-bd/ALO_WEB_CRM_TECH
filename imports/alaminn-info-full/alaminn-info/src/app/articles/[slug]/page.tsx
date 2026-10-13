import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicPage } from "@/components/site/public-chrome";
import { ArrowLeft, Clock, Calendar, User } from "lucide-react";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = await db.article.findUnique({ where: { slug }, select: { title: true, summary: true } });
  if (!a) return { title: "Article not found" };
  return { title: a.title, description: a.summary };
}

export default async function ArticleDetailPage({ params }: Params) {
  const { slug } = await params;
  const article = await db.article.findUnique({ where: { slug } });
  if (!article || article.status !== "published") notFound();

  // Render body as preformatted markdown (we don't add an MDX runtime here for safety)
  const paragraphs = article.body.split(/\n\n+/);

  return (
    <PublicPage>
      <article className="container mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <Link href="/articles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3 w-3" /> All articles
        </Link>

        <Badge variant="outline" className="mb-4">{article.category.replace(/-/g, " ")}</Badge>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{article.title}</h1>
        <p className="text-xl text-muted-foreground mb-6">{article.summary}</p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-10 pb-6 border-b">
          <span className="flex items-center gap-1"><User className="h-4 w-4" /> {article.author}</span>
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(article.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {article.readingMinutes} min read</span>
        </div>

        <div className="prose prose-lg max-w-none space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-foreground/85 leading-relaxed whitespace-pre-wrap">{p}</p>
          ))}
        </div>

        {article.tags && (
          <div className="mt-10 pt-6 border-t">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.split(",").map((t) => (
                <Badge key={t} variant="outline">{t.trim()}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild variant="outline"><Link href="/articles">More articles</Link></Button>
          <Button asChild><Link href="/contact">Work with me</Link></Button>
        </div>
      </article>
    </PublicPage>
  );
}
