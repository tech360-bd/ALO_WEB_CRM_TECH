import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicPage } from "@/components/site/public-chrome";
import { ArrowLeft, ArrowUpRight, Bot, ShieldCheck, Lock, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "ALO Labs",
  description:
    "ALO Labs is the central AI command center where agents, skills and workflows live. Governed, audited, never duplicated.",
};

const LABS = {
  name: "ALO Labs",
  tagline: "Central AI workforce & technology command center",
  body: [
    "ALO Labs is the central AI command center where agents, skills and workflows live. Sister platforms like Alaminn.info request approved workflows through secure APIs; outputs return as drafts, sensitive tasks require permission, and all activity is logged.",
    "The principle is simple: AI proposes, people approve, the system logs. Outputs that touch the public, finances, contracts or student data require human approval before delivery.",
    "Agents are never duplicated across companies. Each platform authenticates with its own scoped credentials, and every request is signed, logged and auditable.",
  ],
  role: "Architecture, governance design, approval workflows",
  features: [
    "Scoped company credentials (per-platform authentication)",
    "Signed webhooks for workflow orchestration",
    "Approval routing with sensitivity tagging",
    "Full audit logging of every AI request and output",
    "RBAC-governed workflow triggers",
    "Private skills library",
  ],
};

export default async function AloLabsPage() {
  const project = await db.project.findUnique({
    where: { slug: "alo-labs-agent-hub" },
    select: { name: true, shortDescription: true, fullDescription: true, status: true, technologies: true },
  });

  return (
    <PublicPage>
      <article className="container mx-auto max-w-4xl px-4 py-16 sm:py-20">
        <Link href="/ecosystem" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3 w-3" /> Ecosystem
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Bot className="h-6 w-6 text-purple-600" />
          </div>
          <Badge variant="outline">AI</Badge>
          {project && <Badge variant="secondary">{project.status}</Badge>}
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{LABS.name}</h1>
        <p className="text-xl text-muted-foreground mb-8">{LABS.tagline}</p>

        <div className="space-y-4 mb-12">
          {LABS.body.map((p, i) => <p key={i} className="text-foreground leading-relaxed">{p}</p>)}
        </div>

        {/* Governance model */}
        <Card className="mb-8 border-purple-500/20 bg-purple-500/5">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> The Four-Layer Governance Model</CardTitle></CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3"><Badge variant="outline">1</Badge><span><strong>Company authentication</strong> — every platform authenticates with its own scoped credentials. No shared keys.</span></li>
              <li className="flex gap-3"><Badge variant="outline">2</Badge><span><strong>Scoped permissions</strong> — RBAC governs which workflows each user can trigger.</span></li>
              <li className="flex gap-3"><Badge variant="outline">3</Badge><span><strong>Approval routing</strong> — sensitive outputs require human approval before delivery.</span></li>
              <li className="flex gap-3"><Badge variant="outline">4</Badge><span><strong>Audit logging</strong> — every request, output and decision is logged immutably.</span></li>
            </ol>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-muted/30">
          <CardHeader><CardTitle className="text-base">My Role</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{LABS.role}</p></CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-4">What the platform delivers</h2>
        <ul className="space-y-3 mb-12">
          {LABS.features.map((f) => (
            <li key={f} className="flex gap-3">
              <ShieldCheck className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
              <span className="text-foreground">{f}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/articles/ai-without-losing-control"><FileText className="h-4 w-4 mr-1" /> Read the governance article</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Discuss an AI workflow <ArrowUpRight className="h-3 w-3" /></Link>
          </Button>
        </div>
      </article>
    </PublicPage>
  );
}
