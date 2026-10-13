import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicPage } from "@/components/site/public-chrome";
import { ArrowLeft, ArrowUpRight, GraduationCap, ShieldCheck, Globe2 } from "lucide-react";

export const metadata: Metadata = {
  title: "ALO Education",
  description:
    "ALO Education is the dedicated student-services platform handling the complete international education journey.",
};

const SUBSIDIARIES = {
  slug: "alo-education",
  name: "ALO Education",
  tagline: "International student consultancy & education service platform",
  headline: "A structured, compliant and supportive student journey — from interest to enrolment.",
  body: [
    "ALO Education is the dedicated student-services platform within the ecosystem that handles the complete international education journey. It covers counselling and university selection, applications, scholarships, CAS, visa support and application tracking.",
    "Alaminn.info captures student referrals and routes them securely to ALO Education with full consent. No student data crosses boundaries without explicit, recorded consent — and every referral is logged for accountability.",
    "The platform is built around stage-gated counsellor workflows, daily and weekly reporting cadences, and an accountability matrix that makes ownership explicit at every step.",
  ],
  role: "Operations & growth leadership, partnership strategy, CRM architecture",
  website: "https://aloeducation.com",
  features: [
    "Counsellor workflow system with stage gates and ownership",
    "Partner portal for universities and collaborators",
    "Application tracking with compliance-aware document handling",
    "Student referral routing with consent records",
    "Daily and weekly reporting cadences",
  ],
};

export default async function AloEducationPage() {
  const project = await db.project.findUnique({
    where: { slug: "alo-education" },
    select: { name: true, slug: true, shortDescription: true, fullDescription: true, status: true, technologies: true, approvedUrl: true },
  });

  if (!project) {
    return (
      <PublicPage>
        <div className="container mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-3">Project not found</h1>
          <Button asChild variant="outline"><Link href="/ecosystem"><ArrowLeft className="h-4 w-4 mr-1" /> Back to ecosystem</Link></Button>
        </div>
      </PublicPage>
    );
  }

  return (
    <PublicPage>
      <article className="container mx-auto max-w-4xl px-4 py-16 sm:py-20">
        <Link href="/ecosystem" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3 w-3" /> Ecosystem
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
          </div>
          <Badge variant="outline">Education</Badge>
          <Badge variant="secondary">{project.status}</Badge>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{SUBSIDIARIES.name}</h1>
        <p className="text-xl text-muted-foreground mb-8">{SUBSIDIARIES.tagline}</p>

        <div className="prose prose-lg max-w-none mb-12 space-y-4">
          {SUBSIDIARIES.body.map((p, i) => <p key={i} className="text-foreground leading-relaxed">{p}</p>)}
        </div>

        <Card className="mb-8 bg-muted/30">
          <CardHeader><CardTitle className="text-base">My Role</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{SUBSIDIARIES.role}</p></CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-4">What the platform delivers</h2>
        <ul className="space-y-3 mb-12">
          {SUBSIDIARIES.features.map((f) => (
            <li key={f} className="flex gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <span className="text-foreground">{f}</span>
            </li>
          ))}
        </ul>

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

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a href={SUBSIDIARIES.website} target="_blank" rel="noreferrer">
              <Globe2 className="h-4 w-4 mr-1" /> Visit ALO Education <ArrowUpRight className="h-3 w-3" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Discuss a student referral</Link>
          </Button>
        </div>
      </article>
    </PublicPage>
  );
}
