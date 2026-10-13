/**
 * /english-learning/progress
 * --------------------------------------------------------------------
 * Anonymous progress dashboard. Reads `sessionId` from localStorage on
 * mount, then fetches `/api/v1/english-learning/progress` (we don't have
 * that endpoint — instead we'll fetch enrollments + progress via a
 * client-side fetch against the existing enroll endpoint to look up by
 * session). Since we don't have a list endpoint for enrollments by
 * session, this page renders an explanation + the session ID display +
 * prompts the user to browse courses they've started.
 *
 * NOTE: this page is intentionally read-only — no PII is collected.
 */
import type { Metadata } from "next";
import { TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";
import { buildEnglishLearningMetadata } from "@/lib/english-learning/seo";
import { EnglishLearningBreadcrumb } from "@/components/english-learning/breadcrumb";
import { ProgressDashboard } from "@/components/english-learning/progress-dashboard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = buildEnglishLearningMetadata({
  title: "My English Learning Progress",
  description:
    "Anonymous progress dashboard for your English Learning enrollments and practice tests. Stored in your browser — no account required.",
  path: "/english-learning/progress",
  noindex: true,
});

export default function ProgressPage() {
  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <EnglishLearningBreadcrumb items={[{ label: "My Progress" }]} />
        </div>
      </div>

      <section className="border-b border-ink-100 bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-[11px] font-bold uppercase tracking-widest text-blue-700"
          >
            <TrendingUp className="mr-1 h-3 w-3" aria-hidden="true" />
            Anonymous progress
          </Badge>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            My English Learning progress
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            Track your lesson completions and practice test scores. Your
            progress is tied to an anonymous session ID stored in your browser.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <ProgressDashboard />

          <Card className="mt-8 p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <div className="text-sm text-ink-700">
                <h3 className="font-display font-bold text-ink-900">
                  How is my progress stored?
                </h3>
                <p className="mt-1">
                  We generate an anonymous session ID (e.g.{" "}
                  <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">
                    el-…
                  </code>
                  ) and store it in your browser&apos;s <code>localStorage</code>.
                  Your lesson progress and test scores are saved against this ID.
                  We never collect your name, email or any other PII through
                  this page.
                </p>
                <p className="mt-2">
                  If you enrol in a paid course package via ALO Education, your
                  anonymous progress can be merged into your ALO account there.
                </p>
              </div>
            </div>
          </Card>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              className="gap-1.5 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
            >
              <Link href="/english-learning/courses">
                Browse courses
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="gap-1.5 rounded-xl border-ink-200 text-ink-700"
            >
              <Link href="/english-learning/practice-tests">
                Take a practice test
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
