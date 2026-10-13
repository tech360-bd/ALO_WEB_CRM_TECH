import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicPage } from "@/components/site/public-chrome";
import { ArrowUpRight, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Projects & Case Studies",
  description:
    "Projects and case studies across operations, sales, education, AI, CRM and digital transformation.",
};

export default async function ProjectsPage() {
  const [projects, caseStudies] = await Promise.all([
    db.project.findMany({
      where: { visibility: "public" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      select: { id: true, name: true, slug: true, subtitle: true, category: true, shortDescription: true, status: true, featured: true, technologies: true },
    }),
    db.caseStudy.findMany({
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      select: { id: true, title: true, slug: true, category: true, outcome: true, featured: true, readTime: true },
    }),
  ]);

  return (
    <PublicPage>
      <section className="container mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="max-w-3xl mb-12">
          <span className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-4">
            <Sparkles className="h-4 w-4" /> Projects & Case Studies
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Working systems, not just ideas.
          </h1>
          <p className="text-lg text-muted-foreground">
            Selected projects and case studies across the ecosystem. Every entry respects
            confidentiality — sensitive details are anonymised or summarised.
          </p>
        </div>

        <h2 className="text-2xl font-bold mb-6">Projects</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.slug}`}>
              <Card className="h-full hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                    {p.featured && <Badge variant="default" className="text-[10px]">Featured</Badge>}
                  </div>
                  <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                  {p.subtitle && <p className="text-xs text-muted-foreground mb-3">{p.subtitle}</p>}
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{p.shortDescription}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.status}</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-6">Case Studies</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {caseStudies.map((c) => (
            <Link key={c.id} href={`/case-studies/${c.slug}`}>
              <Card className="h-full hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <Badge variant="outline" className="text-[10px] mb-2">{c.category}</Badge>
                  <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{c.outcome}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{c.readTime} min read</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button asChild size="lg">
            <Link href="/contact">Start a project <ArrowUpRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
      </section>
    </PublicPage>
  );
}
