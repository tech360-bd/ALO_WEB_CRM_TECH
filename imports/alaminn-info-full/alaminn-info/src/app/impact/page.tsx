import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicPage } from "@/components/site/public-chrome";
import { Award, Target, Users, Bot, Database, Building2, Layers, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Impact & Achievements",
  description: "Evidence-controlled records of operational transformations, sales systems, automation and CRM implementations.",
};

const CATEGORY_ICONS: Record<string, typeof Award> = {
  "operational-transformation": Target,
  "sales-workflow": TrendingUp,
  "student-journey": Users,
  "partnership-development": Building2,
  "automation-systems": Bot,
  "crm-implementation": Database,
  "team-accountability": Users,
  "platform-development": Layers,
};

export default async function ImpactPage() {
  const records = await db.impactRecord.findMany({
    orderBy: { date: "desc" },
    select: { id: true, category: true, challenge: true, role: true, action: true, outcome: true, evidenceStatus: true, date: true },
  });

  return (
    <PublicPage>
      <section className="container mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="max-w-3xl mb-12">
          <span className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-4">
            <Award className="h-4 w-4" /> Impact & Achievements
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Outcomes, not activity.
          </h1>
          <p className="text-lg text-muted-foreground">
            Each record below describes a real challenge, the role I played, the action taken and the
            measurable outcome. Evidence is controlled — sensitive details are anonymised or summarised.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((r) => {
            const Icon = CATEGORY_ICONS[r.category] || Award;
            return (
              <Card key={r.id} className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                  </div>
                  <h3 className="font-semibold mb-2 text-sm">{r.challenge}</h3>
                  <p className="text-xs text-muted-foreground mb-3"><strong>Role:</strong> {r.role}</p>
                  <p className="text-sm mb-2"><strong>Action:</strong> {r.action}</p>
                  <p className="text-sm text-foreground/80 mb-3"><strong>Outcome:</strong> {r.outcome}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>{new Date(r.date).toLocaleDateString(undefined, { year: "numeric", month: "short" })}</span>
                    <span className="capitalize">{r.evidenceStatus}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </PublicPage>
  );
}
