import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicPage } from "@/components/site/public-chrome";
import { ArrowLeft, ArrowUpRight, Code2, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "TECH360",
  description:
    "TECH360 — technical delivery for websites, CRM systems, automation and digital transformation projects.",
};

const TECH360 = {
  name: "TECH360",
  tagline: "Technology services, CRM, automation & digital transformation",
  body: [
    "TECH360 represents the technical delivery arm of the ecosystem — websites, business systems, CRM, automation, workflow architecture and reporting dashboards.",
    "Where ALO Labs designs and governs AI, TECH360 delivers the surrounding technical infrastructure: production Next.js applications, Prisma-backed databases, Nginx reverse proxies, systemd-managed services, and end-to-end deployment pipelines.",
    "Selected client work appears as approved portfolio entries on Alaminn.info — with evidence-controlled publishing so confidentiality is never breached.",
  ],
  role: "Delivery leadership & architecture",
  features: [
    "Production Next.js + TypeScript + Tailwind + Prisma stack",
    "Standalone build deployment (Bun runtime, Nginx, systemd)",
    "MariaDB / SQLite database architecture",
    "REST API design with auth-gated endpoints",
    "Workflow automation and integration design",
    "Documentation, handover and ongoing support",
  ],
};

export default async function Tech360Page() {
  const project = await db.project.findUnique({
    where: { slug: "tech360" },
    select: { name: true, shortDescription: true, status: true, technologies: true },
  });

  return (
    <PublicPage>
      <article className="container mx-auto max-w-4xl px-4 py-16 sm:py-20">
        <Link href="/ecosystem" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3 w-3" /> Ecosystem
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Code2 className="h-6 w-6 text-blue-600" />
          </div>
          <Badge variant="outline">Technology</Badge>
          {project && <Badge variant="secondary">{project.status}</Badge>}
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{TECH360.name}</h1>
        <p className="text-xl text-muted-foreground mb-8">{TECH360.tagline}</p>

        <div className="space-y-4 mb-12">
          {TECH360.body.map((p, i) => <p key={i} className="text-foreground leading-relaxed">{p}</p>)}
        </div>

        <Card className="mb-8 bg-muted/30">
          <CardHeader><CardTitle className="text-base">My Role</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{TECH360.role}</p></CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-4">What TECH360 delivers</h2>
        <ul className="space-y-3 mb-12">
          {TECH360.features.map((f) => (
            <li key={f} className="flex gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <span className="text-foreground">{f}</span>
            </li>
          ))}
        </ul>

        {project?.technologies && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Technologies</h3>
            <div className="flex flex-wrap gap-2">
              {project.technologies.split(",").map((t) => (
                <Badge key={t} variant="outline">{t.trim()}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/projects">View portfolio <ArrowUpRight className="h-3 w-3" /></Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Discuss a technical project</Link>
          </Button>
        </div>
      </article>
    </PublicPage>
  );
}
