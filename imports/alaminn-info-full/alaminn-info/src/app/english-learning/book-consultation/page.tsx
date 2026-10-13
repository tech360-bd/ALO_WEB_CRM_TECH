/**
 * /english-learning/book-consultation
 * --------------------------------------------------------------------
 * Free 30-minute consultation request. Triggers a course-package
 * referral with a "consultation" campaign code.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  ArrowLeftRight,
  GraduationCap,
  Clock,
} from "lucide-react";
import { db } from "@/lib/db";
import { buildEnglishLearningMetadata } from "@/lib/english-learning/seo";
import { EnglishLearningBreadcrumb } from "@/components/english-learning/breadcrumb";
import { ReferralCta } from "@/components/english-learning/referral-cta";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { COURSE_LEVELS } from "@/lib/english-learning/constants";

export const metadata: Metadata = buildEnglishLearningMetadata({
  title: "Book a Free English Learning Consultation",
  description:
    "Book a free 30-minute English Learning consultation. We'll help you pick the right course, test and study plan.",
  path: "/english-learning/book-consultation",
});

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ course?: string }>;
}

export default async function BookConsultationPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const selectedCourseSlug = sp.course || "";

  const selectedCourse = selectedCourseSlug
    ? await db.englishLearningCourse.findFirst({
        where: { slug: selectedCourseSlug, isPublished: true },
        select: { id: true, slug: true, title: true, level: true },
      })
    : null;

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <EnglishLearningBreadcrumb items={[{ label: "Book a Consultation" }]} />
        </div>
      </div>

      <section className="border-b border-ink-100 bg-gradient-to-br from-purple-50 via-white to-blue-50 py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Badge
            variant="outline"
            className="border-purple-200 bg-purple-50 text-[11px] font-bold uppercase tracking-widest text-purple-700"
          >
            <MessageSquare className="mr-1 h-3 w-3" aria-hidden="true" />
            Consultation
          </Badge>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            Book a free 30-min consultation
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            Not sure which course or test prep path is right for you? Book a
            free 30-minute consultation — we&apos;ll help you decide.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-6">
          {selectedCourse && (
            <Card className="border-purple-200 bg-purple-50/40 p-5">
              <Badge
                variant="outline"
                className="border-purple-200 bg-purple-50 text-[10px] font-bold uppercase tracking-widest text-purple-700"
              >
                Selected course
              </Badge>
              <h3 className="mt-2 font-display text-base font-bold text-ink-900">
                {selectedCourse.title}
              </h3>
              <ReferralCta
                referralType="course-package"
                courseSlug={selectedCourse.slug}
                level={selectedCourse.level}
                sourceEntityId={selectedCourse.id}
                sourceEntityType="course"
                campaignCode="free-consultation"
                label="Request Consultation"
                size="lg"
                className="mt-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
              />
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-ink-900">
                  What to expect
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-ink-700">
                  <li>· 30 minutes, by phone or video call</li>
                  <li>· Assessment of your current level + target</li>
                  <li>· Personalised course + test prep recommendation</li>
                  <li>· Q&amp;A on scheduling, pricing and progression</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-display text-base font-bold text-ink-900">
              Pick a level to start
            </h3>
            <p className="mt-1 text-xs text-ink-600">
              You don&apos;t need to know your exact level — pick the closest
              match and we&apos;ll refine it during the consultation.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {COURSE_LEVELS.map((lvl) => (
                <div
                  key={lvl.value}
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-ink-900">
                      {lvl.label}
                    </div>
                    <div className="truncate text-[11px] text-ink-500">
                      {lvl.description}
                    </div>
                  </div>
                  <ReferralCta
                    referralType="course-package"
                    level={lvl.value}
                    campaignCode="free-consultation"
                    label="Book"
                    size="sm"
                    className="rounded-xl bg-purple-600 text-white hover:bg-purple-700"
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-5">
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-[10px] font-bold uppercase tracking-widest text-blue-700"
            >
              <ArrowLeftRight className="mr-1 h-3 w-3" aria-hidden="true" />
              Cross-link
            </Badge>
            <h3 className="mt-2 font-display text-base font-bold text-ink-900">
              Need academic pathway help too?
            </h3>
            <p className="mt-1 text-xs text-ink-600">
              Book a separate Higher Study consultation for university, scholarship
              and PhD application guidance.
            </p>
            <Button
              asChild
              size="sm"
              className="mt-3 gap-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              <Link href="/higher-study/book-consultation">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                Higher Study consultation
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </Card>

          <Card className="p-4 text-xs text-ink-600">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>
                Consultations are scheduled by ALO Education on their own
                domain. Alaminn.info only shares your target level — no PII in
                the referral URL.
              </span>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
