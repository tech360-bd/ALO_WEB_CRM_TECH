import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PublicPage } from "@/components/site/public-chrome";
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const cs = await db.caseStudy.findUnique({ where: { slug }, select: { title: true, outcome: true } });
  if (!cs) return { title: "Case study not found" };
  return { title: cs.title, description: cs.outcome };
}

export default async function CaseStudyDetailPage({ params }: Params) {
  const { slug } = await params;
  const cs = await db.caseStudy.findUnique({ where: { slug } });
  if (!cs) notFound();

  return (
    <PublicPage>
      <article className="container mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3 w-3" /> All case studies
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline">{cs.category}</Badge>
          {cs.featured && <Badge variant="default">Featured</Badge>}
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {cs.readTime} min read
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{cs.title}</h1>

        <div className="prose prose-lg max-w-none mb-10 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">Context</h2>
            <p className="text-foreground/80 leading-relaxed">{cs.context}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">Challenge</h2>
            <p className="text-foreground/80 leading-relaxed">{cs.challenge}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">My Role</h2>
            <p className="text-foreground/80 leading-relaxed">{cs.role}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">Intervention</h2>
            <p className="text-foreground/80 leading-relaxed">{cs.intervention}</p>
          </section>
          {cs.systemBuilt && (
            <section>
              <h2 className="text-xl font-semibold mb-2">System Built</h2>
              <p className="text-foreground/80 leading-relaxed">{cs.systemBuilt}</p>
            </section>
          )}
          <section>
            <h2 className="text-xl font-semibold mb-2">Outcome</h2>
            <p className="text-foreground/80 leading-relaxed">{cs.outcome}</p>
          </section>
        </div>

        <Card className="bg-muted/30 mb-8">
          <CardContent className="p-5 flex items-center gap-3 text-sm">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p>Evidence status: <strong>{cs.evidenceStatus}</strong></p>
              <p className="text-muted-foreground">Confidentiality: {cs.confidentiality}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/projects">More case studies</Link>
          </Button>
          <Button asChild>
            <Link href="/contact">Work with me</Link>
          </Button>
        </div>
      </article>
    </PublicPage>
  );
}
