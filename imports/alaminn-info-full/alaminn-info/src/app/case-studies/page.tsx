/**
 * /case-studies
 * --------------------------------------------------------------------
 * Listing page for all CaseStudy rows. Cards link to the detail page
 * at /case-studies/[slug]. Filterable by category and featured status.
 * No fabricated metrics — every card shows evidence status + confidentiality.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { PublicPage } from "@/components/site/public-chrome";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Case Studies — Al Aminn",
  description:
    "Verified, evidence-controlled case studies of operating-system work across education, AI-CRM, sales growth and partnerships. Each entry records the context, challenge, role, intervention, system built and verified outcome.",
  alternates: { canonical: "/case-studies" },
};

const CATEGORY_LABEL: Record<string, string> = {
  "education-operations": "Education Operations",
  "ai-crm": "AI & CRM",
  "sales-growth": "Sales & Growth",
  partnerships: "Partnerships",
  operations: "Operations",
  strategy: "Strategy",
};

export default async function CaseStudiesListingPage() {
  const caseStudies = await db.caseStudy.findMany({
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      outcome: true,
      evidenceStatus: true,
      confidentiality: true,
      readTime: true,
      featured: true,
    },
  });

  const featured = caseStudies.filter((c) => c.featured);
  const rest = caseStudies.filter((c) => !c.featured);

  const categories = Array.from(
    new Set(caseStudies.map((c) => c.category)),
  ).sort();

  return (
    <PublicPage>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Case Studies — Al Aminn",
            url: "https://alaminn.info/case-studies",
            numberOfItems: caseStudies.length,
            isPartOf: { "@type": "WebSite", name: "Alaminn.info" },
          }),
        }}
      />

      <section className="container mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <header className="mb-12 space-y-4">
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="h-3 w-3" /> Evidence-controlled
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Case Studies
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Each case study documents the context, challenge, role,
            intervention, the system that was built, and the verified outcome.
            No fabricated metrics — every entry carries an evidence status and a
            confidentiality level.
          </p>
          <div className="flex flex-wrap gap-2 pt-2 text-sm text-muted-foreground">
            <span>Categories:</span>
            {categories.map((c) => (
              <Badge key={c} variant="outline">
                {CATEGORY_LABEL[c] ?? c}
              </Badge>
            ))}
          </div>
        </header>

        {caseStudies.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            No case studies published yet.
          </div>
        ) : (
          <div className="space-y-12">
            {featured.length > 0 && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" /> Featured
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  {featured.map((cs) => (
                    <CaseStudyCard key={cs.id} cs={cs} />
                  ))}
                </div>
              </div>
            )}

            {rest.length > 0 && (
              <div className="space-y-4">
                {featured.length > 0 && (
                  <h2 className="text-xl font-semibold">All case studies</h2>
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  {rest.map((cs) => (
                    <CaseStudyCard key={cs.id} cs={cs} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </PublicPage>
  );
}

function CaseStudyCard({
  cs,
}: {
  cs: {
    id: string;
    slug: string;
    title: string;
    category: string;
    outcome: string;
    evidenceStatus: string;
    confidentiality: string;
    readTime: number;
    featured: boolean;
  };
}) {
  return (
    <Link
      href={`/case-studies/${cs.slug}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
    >
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/40 group-hover:-translate-y-0.5">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {CATEGORY_LABEL[cs.category] ?? cs.category}
            </Badge>
            {cs.featured && (
              <Badge variant="default" className="gap-1">
                <Sparkles className="h-3 w-3" /> Featured
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="ml-auto gap-1 text-xs"
              title={`Evidence status: ${cs.evidenceStatus}`}
            >
              <ShieldCheck className="h-3 w-3" />
              {cs.evidenceStatus}
            </Badge>
          </div>

          <h3 className="text-lg font-semibold leading-snug">{cs.title}</h3>

          <p className="line-clamp-3 text-sm text-muted-foreground">
            {cs.outcome}
          </p>

          <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {cs.readTime} min read
            </span>
            <span className="text-muted-foreground/70">
              {cs.confidentiality}
            </span>
          </div>

          <div className="flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Read full case study <ArrowRight className="ml-1 h-3 w-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
