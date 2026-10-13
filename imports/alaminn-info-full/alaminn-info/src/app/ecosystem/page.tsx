import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicPage } from "@/components/site/public-chrome";
import { ArrowUpRight, Sparkles, Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Ecosystem",
  description:
    "A connected ecosystem of platforms: ALO Education, ALO Labs, TECH360, English AI, ICLA Global Academy and Alaminn.info.",
};

const ECOSYSTEM = [
  {
    slug: "alo-education",
    name: "ALO Education",
    tagline: "International student consultancy & education service platform",
    description:
      "The dedicated student-services platform handling the complete international education journey — from counselling and university selection to applications, scholarships, CAS, visa support and application tracking.",
    category: "Education",
    color: "bg-emerald-500",
    featured: true,
  },
  {
    slug: "alo-labs",
    name: "ALO Labs",
    tagline: "Central AI workforce & technology command center",
    description:
      "The central AI command center where agents, skills and workflows live. Sister platforms request approved workflows through secure APIs; outputs return as drafts requiring human approval, and all activity is logged.",
    category: "AI",
    color: "bg-purple-500",
    featured: true,
  },
  {
    slug: "tech360",
    name: "TECH360",
    tagline: "Technology services, CRM, automation & digital transformation",
    description:
      "The technical delivery arm — websites, business systems, CRM, automation, workflow architecture and reporting dashboards. Selected client work appears as approved portfolio entries on Alaminn.info.",
    category: "Technology",
    color: "bg-blue-500",
    featured: true,
  },
];

export default async function EcosystemPage() {
  // Pull live project records for additional context
  const projects = await db.project.findMany({
    where: { visibility: "public" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true, category: true, shortDescription: true, status: true, featured: true },
  });

  return (
    <PublicPage>
      <section className="container mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="max-w-3xl mb-12">
          <span className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-4">
            <Sparkles className="h-4 w-4" /> Ecosystem Overview
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            One ecosystem. Focused platforms. Secure collaboration.
          </h1>
          <p className="text-lg text-muted-foreground">
            Each platform has a focused scope. They collaborate through secure, governed integrations —
            with approval routing, sensitivity tagging and full audit logging. No agents are duplicated;
            no data crosses boundaries without consent.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {ECOSYSTEM.map((e) => (
            <Card key={e.slug} className="h-full">
              <CardHeader>
                <div className={`h-2 w-12 rounded-full ${e.color} mb-3`} />
                <CardTitle className="text-xl">{e.name}</CardTitle>
                <Badge variant="outline" className="w-fit">{e.category}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium mb-2">{e.tagline}</p>
                <p className="text-sm text-muted-foreground">{e.description}</p>
                <Link
                  href={`/ecosystem/${e.slug}`}
                  className="inline-flex items-center gap-1 text-sm text-primary mt-4 hover:underline"
                >
                  Learn more <ArrowUpRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> All Projects in the Ecosystem
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={p.slug === "alo-education" || p.slug === "alo-labs-agent-hub" || p.slug === "tech360"
                  ? `/ecosystem/${p.slug === "alo-labs-agent-hub" ? "alo-labs" : p.slug}`
                  : `/projects/${p.slug}`}
                className="block"
              >
                <Card className="h-full hover:border-primary/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{p.name}</p>
                      {p.featured && <Badge variant="default" className="text-[10px]">Featured</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.shortDescription}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{p.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
