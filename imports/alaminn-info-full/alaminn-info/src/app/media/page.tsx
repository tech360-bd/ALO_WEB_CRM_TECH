import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/site/public-chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Radio, Camera, Mic, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Media & Press",
  description: "Press kit, media appearances and interview topics for Al Aminn.",
};

const TOPICS = [
  "Operating systems for growth in service businesses",
  "AI adoption without losing control — governance models",
  "Bangladesh market entry for international universities",
  "CRM as relationship infrastructure, not just software",
  "Personal authority platforms for senior operators",
  "Building governed AI workspaces for SMBs",
];

const APPEARANCES = [
  { outlet: "LinkedIn Articles", topic: "Operating systems for growth", date: "2024" },
  { outlet: "Newsletter (monthly)", topic: "Authority report on operations, sales, AI", date: "Ongoing" },
  { outlet: "Speaking & Workshops", topic: "CRM, AI governance, education operations", date: "Various" },
];

export default function MediaPage() {
  return (
    <PublicPage>
      <section className="container mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <div className="max-w-3xl mb-12">
          <span className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-4">
            <Radio className="h-4 w-4" /> Media & Press
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Press kit, media appearances and interview topics.
          </h1>
          <p className="text-lg text-muted-foreground">
            For interview requests, podcast appearances, panels or written commentary, reach out via the contact page.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Mic className="h-5 w-5 text-primary" /> Interview Topics</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {TOPICS.map((t) => (
                  <li key={t} className="text-sm flex gap-2">
                    <span className="text-primary">•</span> {t}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Camera className="h-5 w-5 text-primary" /> Appearances & Writing</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {APPEARANCES.map((a) => (
                  <li key={a.outlet} className="text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{a.outlet}</span>
                      <Badge variant="outline" className="text-[10px]">{a.date}</Badge>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">{a.topic}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 mb-12">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-3">Press Kit</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Bio, headshot, brand assets and quick facts available on request.
              Reach out via the contact page with "Press kit" in the subject line.
            </p>
            <Button asChild><Link href="/contact">Request press kit <ArrowUpRight className="h-3 w-3 ml-1" /></Link></Button>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3 inline-flex items-center gap-2">
            <Newspaper className="h-4 w-4" /> Read my latest thinking
          </p>
          <Button asChild variant="outline"><Link href="/articles">Browse articles</Link></Button>
        </div>
      </section>
    </PublicPage>
  );
}
