/**
 * /english-learning/eligibility-check
 * --------------------------------------------------------------------
 * Server component wrapper around the EligibilityQuiz client component.
 */
import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { buildEnglishLearningMetadata } from "@/lib/english-learning/seo";
import { EnglishLearningBreadcrumb } from "@/components/english-learning/breadcrumb";
import { EligibilityQuiz } from "@/components/english-learning/eligibility-quiz";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = buildEnglishLearningMetadata({
  title: "English Level Check — Free 10-Question Assessment",
  description:
    "Take our free 10-question English level check. Instant recommendation for the right course level — beginner, intermediate, advanced or test prep.",
  path: "/english-learning/eligibility-check",
});

export default function EligibilityCheckPage() {
  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <EnglishLearningBreadcrumb
            items={[{ label: "Level Check" }]}
          />
        </div>
      </div>

      <section className="border-b border-ink-100 bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <Badge
            variant="outline"
            className="border-purple-200 bg-purple-50 text-[11px] font-bold uppercase tracking-widest text-purple-700"
          >
            <ListChecks className="mr-1 h-3 w-3" aria-hidden="true" />
            Free level check
          </Badge>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            Find your English level
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            10 questions · 5 minutes · instant recommendation. No email or
            signup required.
          </p>
        </div>
      </section>

      <EligibilityQuiz />
    </>
  );
}
