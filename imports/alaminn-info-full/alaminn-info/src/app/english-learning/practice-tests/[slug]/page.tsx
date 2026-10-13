/**
 * /english-learning/practice-tests/[slug]
 * --------------------------------------------------------------------
 * Test detail page — renders the EnglishTestRunner client component
 * which loads questions, handles the timer + submission, and shows
 * the score + per-question results.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClipboardCheck, Clock, ListChecks, Target } from "lucide-react";
import { db } from "@/lib/db";
import { buildEnglishLearningMetadata } from "@/lib/english-learning/seo";
import { EnglishLearningBreadcrumb } from "@/components/english-learning/breadcrumb";
import { EnglishTestRunner } from "@/components/english-learning/english-test-runner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TEST_TYPE_MAP } from "@/lib/english-learning/constants";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const test = await db.englishLearningPracticeTest.findFirst({
    where: { slug, isPublished: true },
    select: { title: true, description: true, testType: true },
  });
  if (!test) {
    return buildEnglishLearningMetadata({
      title: "Practice test not found",
      description: "This English Learning practice test could not be found.",
      path: `/english-learning/practice-tests/${slug}`,
      noindex: true,
    });
  }
  const testType = TEST_TYPE_MAP[test.testType as string]?.label ?? test.testType;
  return buildEnglishLearningMetadata({
    title: `${test.title} — ${testType} Practice Test`,
    description:
      test.description ||
      `Take the ${test.title} practice test. Free, instant scoring with explanations.`,
    path: `/english-learning/practice-tests/${slug}`,
  });
}

export default async function PracticeTestDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const test = await db.englishLearningPracticeTest.findFirst({
    where: { slug, isPublished: true },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      testType: true,
      level: true,
      durationMinutes: true,
      totalQuestions: true,
      passingScore: true,
    },
  });

  if (!test) notFound();

  const testType = TEST_TYPE_MAP[test.testType as string];

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <EnglishLearningBreadcrumb
            items={[
              { label: "Practice Tests", href: "/english-learning/practice-tests" },
              { label: test.title },
            ]}
          />
        </div>
      </div>

      <section className="border-b border-ink-100 bg-gradient-to-br from-purple-50 via-white to-cyan-50 py-8">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <Badge
            variant="outline"
            className="border-purple-200 bg-purple-50 text-[11px] font-bold uppercase tracking-wider text-purple-700"
          >
            <ClipboardCheck className="mr-1 h-3 w-3" aria-hidden="true" />
            {testType?.label ?? test.testType}
          </Badge>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">
            {test.title}
          </h1>
          {test.description && (
            <p className="mt-2 max-w-2xl text-sm text-ink-600">
              {test.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {test.durationMinutes != null && (
              <Stat icon={<Clock className="h-3 w-3" />} label="Time">
                {test.durationMinutes} min
              </Stat>
            )}
            <Stat icon={<ListChecks className="h-3 w-3" />} label="Questions">
              {test.totalQuestions}
            </Stat>
            {test.passingScore != null && (
              <Stat icon={<Target className="h-3 w-3" />} label="Pass">
                {test.passingScore}%
              </Stat>
            )}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <EnglishTestRunner slug={test.slug} />
        </div>
      </section>
    </>
  );
}

function Stat({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex items-center gap-2 px-3 py-1.5">
      <span className="text-ink-400" aria-hidden="true">
        {icon}
      </span>
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
          {label}:
        </span>{" "}
        <span className="font-bold text-ink-900">{children}</span>
      </div>
    </Card>
  );
}
