/**
 * /higher-study/subjects
 * --------------------------------------------------------------------
 * Subject area directory. Lists all HigherStudySubject rows grouped by
 * category (STEM / Business / Humanities / Arts / Social Sciences /
 * Medicine / Law). Each card links to the subject detail page where the
 * user can browse all courses in that subject.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Layers } from "lucide-react";
import { db } from "@/lib/db";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { PageHero, StatsStrip } from "@/components/higher-study/page-hero";
import { serializeJsonLd } from "@/lib/higher-study/seo";
import type { BreadcrumbItem as BreadcrumbItemComponent } from "@/components/higher-study/breadcrumb";
import type { BreadcrumbItem as BreadcrumbItemJsonLd } from "@/lib/higher-study/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "Subject Areas — Higher Study",
  description:
    "Browse higher-study programmes by subject area — STEM, Business, Humanities, Medicine, Law, Arts, Social Sciences. Find courses, universities, scholarships and supervisors in your field.",
  path: "/higher-study/subjects",
  keywords: [
    "study subjects",
    "subject areas",
    "study fields",
    "STEM",
    "business",
    "medicine",
    "law",
    "humanities",
  ],
});

const CATEGORY_ORDER = [
  "STEM",
  "Business",
  "Medicine",
  "Law",
  "Social Sciences",
  "Humanities",
  "Arts",
];

const CATEGORY_BLURB: Record<string, string> = {
  STEM: "Computer Science, Engineering, Data Science, Renewable Energy and other technical disciplines driving the future of work.",
  Business: "MBA, MSc Finance, MSc Management and related disciplines for future founders, operators and analysts.",
  Medicine: "Clinical, public-health and biomedical programmes for the next generation of healthcare leaders.",
  Law: "LLM and JD-adjacent programmes across international, commercial and human-rights law.",
  "Social Sciences": "Public Policy, International Relations, Economics and Sociology programmes.",
  Humanities: "History, Philosophy, Literature and Cultural Studies programmes.",
  Arts: "Design, Fine Arts, Music and Performing Arts programmes.",
};

export default async function SubjectsListingPage() {
  const subjects = await db.higherStudySubject.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      description: true,
      _count: { select: { courses: true } },
    },
  });

  // Group by category, preserving CATEGORY_ORDER; unknown categories go last.
  const byCategory = new Map<string, typeof subjects>();
  for (const s of subjects) {
    const cat = s.category ?? "Other";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(s);
  }
  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => byCategory.has(c)),
    ...Array.from(byCategory.keys()).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const totalCourses = subjects.reduce((sum, s) => sum + s._count.courses, 0);

  const crumbs: BreadcrumbItemComponent[] = [
    { label: "Higher Study", href: "/higher-study" },
    { label: "Subjects", href: "/higher-study/subjects" },
  ];

  const jsonLdCrumbs: BreadcrumbItemJsonLd[] = [
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}` },
    { name: "Subjects", url: `${HIGHER_STUDY_BASE_URL}/subjects` },
  ];

  const jsonLd = serializeJsonLd([
    buildBreadcrumbJsonLd(jsonLdCrumbs),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Higher Study Subject Areas",
      url: `${HIGHER_STUDY_BASE_URL}/subjects`,
      description:
        "Browse higher-study programmes by subject area — STEM, Business, Humanities, Medicine, Law, Arts, Social Sciences.",
      numberOfItems: subjects.length,
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <PageHero
        eyebrow="Subject Directory"
        title="Find your field of study"
        description="Browse programmes by subject area. Each subject links to its courses, universities, scholarships and supervisors — so you can plan an entire application strategy around your discipline."
      />

      <StatsStrip
        stats={[
          { label: "Subjects", value: subjects.length.toString() },
          { label: "Courses indexed", value: totalCourses.toString() },
          { label: "Categories", value: orderedCategories.length.toString() },
        ]}
      />

      <HigherStudyBreadcrumb items={crumbs} />

      <section className="container mx-auto max-w-6xl px-4 pb-20">
        {subjects.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            No subjects indexed yet. Please check back soon.
          </div>
        ) : (
          <div className="space-y-12">
            {orderedCategories.map((category) => {
              const items = byCategory.get(category)!;
              const courseCount = items.reduce(
                (sum, s) => sum + s._count.courses,
                0,
              );
              return (
                <div key={category} className="space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
                    <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                      <Layers className="h-5 w-5 text-primary" />
                      {category}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {items.length}{" "}
                      {items.length === 1 ? "subject" : "subjects"} ·{" "}
                      {courseCount} {courseCount === 1 ? "course" : "courses"}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {CATEGORY_BLURB[category] ??
                      "Programmes in this subject area."}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((subject) => (
                      <Link
                        key={subject.id}
                        href={`/higher-study/subjects/${subject.slug}`}
                        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
                      >
                        <Card className="h-full transition-all hover:shadow-md hover:border-primary/40 group-hover:-translate-y-0.5">
                          <CardContent className="flex h-full flex-col gap-3 p-5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <GraduationCap className="h-4 w-4" />
                                </div>
                                <h3 className="font-medium leading-tight">
                                  {subject.name}
                                </h3>
                              </div>
                              <Badge variant="secondary" className="shrink-0">
                                {subject._count.courses}{" "}
                                {subject._count.courses === 1
                                  ? "course"
                                  : "courses"}
                              </Badge>
                            </div>
                            {subject.description && (
                              <p className="line-clamp-3 text-sm text-muted-foreground">
                                {subject.description}
                              </p>
                            )}
                            <div className="mt-auto flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                              View programmes{" "}
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
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
