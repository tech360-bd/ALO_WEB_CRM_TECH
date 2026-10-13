import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PublicPage } from "@/components/site/public-chrome";
import { ArrowLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug }, select: { name: true, shortDescription: true } });
  if (!project) return { title: "Project not found" };
  return { title: project.name, description: project.shortDescription };
}

export default async function ProjectDetailPage({ params }: Params) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project || project.visibility !== "public") notFound();

  return (
    <PublicPage>
      <article className="container mx-auto max-w-4xl px-4 py-16 sm:py-20">
        <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3 w-3" /> All projects
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline">{project.category}</Badge>
          <Badge variant="secondary">{project.status}</Badge>
          {project.featured && <Badge variant="default">Featured</Badge>}
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{project.name}</h1>
        {project.subtitle && <p className="text-xl text-muted-foreground mb-6">{project.subtitle}</p>}
        <p className="text-base text-foreground/80 leading-relaxed mb-8">{project.shortDescription}</p>

        {project.fullDescription && (
          <div className="prose prose-lg max-w-none mb-10">
            <p className="text-foreground leading-relaxed">{project.fullDescription}</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          {project.businessProblem && (
            <Card><CardContent className="p-5">
              <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Business Problem</h3>
              <p className="text-sm">{project.businessProblem}</p>
            </CardContent></Card>
          )}
          {project.solution && (
            <Card><CardContent className="p-5">
              <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Solution</h3>
              <p className="text-sm">{project.solution}</p>
            </CardContent></Card>
          )}
        </div>

        {project.outcomes && (
          <Card className="mb-8 bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm uppercase text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Outcomes
              </h3>
              <p className="text-sm">{project.outcomes}</p>
            </CardContent>
          </Card>
        )}

        {project.technologies && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Technologies</h3>
            <div className="flex flex-wrap gap-2">
              {project.technologies.split(",").map((t) => (
                <Badge key={t} variant="outline">{t.trim()}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-8">
          <span>Evidence: {project.evidenceStatus}</span>
          <span>·</span>
          <span>Confidentiality: {project.confidentiality}</span>
        </div>

        <div className="flex flex-wrap gap-3">
          {project.approvedUrl && (
            <Button asChild>
              <a href={project.approvedUrl} target="_blank" rel="noreferrer">Visit live <ArrowUpRight className="h-3 w-3 ml-1" /></a>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/contact">Discuss a similar project</Link>
          </Button>
        </div>
      </article>
    </PublicPage>
  );
}
