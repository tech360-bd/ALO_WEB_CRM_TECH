/**
 * /higher-study/intakes
 * --------------------------------------------------------------------
 * Intake calendar directory. Lists all HigherStudyIntake rows grouped
 * by status (open / upcoming / closed). Each card links to the intake
 * detail page where the user can browse all courses starting in that
 * intake, with application deadlines prominently shown.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  Calendar,
  ArrowRight,
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  Hourglass,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  HIGHER_STUDY_BASE_URL,
  serializeJsonLd,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { PageHero, StatsStrip } from "@/components/higher-study/page-hero";
import type { BreadcrumbItem as BreadcrumbItemComponent } from "@/components/higher-study/breadcrumb";
import type { BreadcrumbItem as BreadcrumbItemJsonLd } from "@/lib/higher-study/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "Intake Calendar — Higher Study",
  description:
    "Browse university intakes by start date and application deadline. Plan your application timeline across Fall, Spring and Summer intakes at top universities worldwide.",
  path: "/higher-study/intakes",
  keywords: [
    "university intakes",
    "application deadlines",
    "fall intake",
    "spring intake",
    "intake calendar",
    "study abroad timeline",
  ],
});

const STATUS_ORDER = ["open", "upcoming", "closed"] as const;

const STATUS_META: Record<
  string,
  {
    label: string;
    icon: typeof CheckCircle2;
    badgeClass: string;
    blurb: string;
  }
> = {
  open: {
    label: "Open for applications",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    blurb:
      "These intakes are accepting applications right now. Apply as soon as possible — late applications may be considered on a case-by-case basis.",
  },
  upcoming: {
    label: "Upcoming intakes",
    icon: Hourglass,
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    blurb:
      "Applications for these intakes open soon. Prepare your documents, English test scores and statements of purpose now so you can submit on day one.",
  },
  closed: {
    label: "Closed intakes",
    icon: AlertCircle,
    badgeClass: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400",
    blurb:
      "These intakes have closed. Use them as a reference for the next equivalent cycle (most universities repeat deadlines annually).",
  },
};

function formatDate(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(d: Date | null): number | null {
  if (!d) return null;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function IntakesListingPage() {
  const intakes = await db.higherStudyIntake.findMany({
    orderBy: [{ applicationDeadline: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      startDate: true,
      endDate: true,
      applicationDeadline: true,
      status: true,
      _count: { select: { courses: true } },
    },
  });

  const byStatus = new Map<string, typeof intakes>();
  for (const i of intakes) {
    if (!byStatus.has(i.status)) byStatus.set(i.status, []);
    byStatus.get(i.status)!.push(i);
  }
  const orderedStatuses = [
    ...STATUS_ORDER.filter((s) => byStatus.has(s)),
    ...Array.from(byStatus.keys()).filter(
      (s) => !STATUS_ORDER.includes(s as (typeof STATUS_ORDER)[number]),
    ),
  ];

  const openCount = (byStatus.get("open") ?? []).length;
  const upcomingCount = (byStatus.get("upcoming") ?? []).length;
  const totalCourses = intakes.reduce((sum, i) => sum + i._count.courses, 0);

  const crumbs: BreadcrumbItemComponent[] = [
    { label: "Higher Study", href: "/higher-study" },
    { label: "Intakes", href: "/higher-study/intakes" },
  ];

  const jsonLdCrumbs: BreadcrumbItemJsonLd[] = [
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}` },
    { name: "Intakes", url: `${HIGHER_STUDY_BASE_URL}/intakes` },
  ];

  const jsonLd = serializeJsonLd([
    buildBreadcrumbJsonLd(jsonLdCrumbs),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Higher Study Intake Calendar",
      url: `${HIGHER_STUDY_BASE_URL}/intakes`,
      description:
        "Browse university intakes by start date and application deadline.",
      numberOfItems: intakes.length,
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <PageHero
        eyebrow="Intake Calendar"
        title="Plan your application timeline"
        description="Browse intakes by start date and application deadline. Each intake links to every course starting in that cycle — so you can map an entire application strategy around a single target date."
      />

      <StatsStrip
        stats={[
          { label: "Open intakes", value: openCount.toString() },
          { label: "Upcoming", value: upcomingCount.toString() },
          { label: "Total courses", value: totalCourses.toString() },
        ]}
      />

      <HigherStudyBreadcrumb items={crumbs} />

      <section className="container mx-auto max-w-6xl px-4 pb-20">
        {intakes.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            No intakes indexed yet. Please check back soon.
          </div>
        ) : (
          <div className="space-y-12">
            {orderedStatuses.map((status) => {
              const items = byStatus.get(status)!;
              const meta = STATUS_META[status] ?? STATUS_META.closed;
              const StatusIcon = meta.icon;
              const courseCount = items.reduce(
                (sum, i) => sum + i._count.courses,
                0,
              );
              return (
                <div key={status} className="space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
                    <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                      <StatusIcon className="h-5 w-5 text-primary" />
                      {meta.label}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {items.length} {items.length === 1 ? "intake" : "intakes"}{" "}
                      · {courseCount}{" "}
                      {courseCount === 1 ? "course" : "courses"}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{meta.blurb}</p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((intake) => {
                      const deadlineStr = formatDate(intake.applicationDeadline);
                      const days = daysUntil(intake.applicationDeadline);
                      return (
                        <Link
                          key={intake.id}
                          href={`/higher-study/intakes/${intake.slug}`}
                          className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
                        >
                          <Card className="h-full transition-all hover:shadow-md hover:border-primary/40 group-hover:-translate-y-0.5">
                            <CardContent className="flex h-full flex-col gap-3 p-5">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-medium leading-tight">
                                  {intake.name}
                                </h3>
                                <Badge
                                  variant="secondary"
                                  className={`shrink-0 ${meta.badgeClass}`}
                                >
                                  {intake.status}
                                </Badge>
                              </div>

                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <CalendarClock className="h-3.5 w-3.5" />
                                  <span>
                                    Deadline:{" "}
                                    <span className="font-medium text-foreground">
                                      {deadlineStr ?? "Rolling / TBC"}
                                    </span>
                                  </span>
                                </div>
                                {intake.startDate && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>
                                      Starts:{" "}
                                      <span className="font-medium text-foreground">
                                        {formatDate(intake.startDate)}
                                      </span>
                                    </span>
                                  </div>
                                )}
                              </div>

                              {days !== null && days >= 0 && (
                                <Badge
                                  variant="outline"
                                  className="w-fit text-xs"
                                >
                                  {days} {days === 1 ? "day" : "days"} to apply
                                </Badge>
                              )}

                              <div className="mt-auto flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {intake._count.courses}{" "}
                                  {intake._count.courses === 1
                                    ? "course"
                                    : "courses"}
                                </span>
                                <span className="flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                                  View courses{" "}
                                  <ArrowRight className="ml-1 h-3 w-3" />
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
