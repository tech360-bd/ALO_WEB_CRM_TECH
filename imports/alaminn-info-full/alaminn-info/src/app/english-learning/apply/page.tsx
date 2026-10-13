/**
 * /english-learning/apply
 * --------------------------------------------------------------------
 * Apply for a paid English Learning course package. Lets the user pick
 * the course level + course (if known), then triggers a referral CTA
 * to ALO Education via ReferralCta (referralType="course-package").
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  Send,
  ShieldCheck,
  ArrowRight,
  ArrowLeftRight,
  GraduationCap,
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
  title: "Apply for a Paid English Course Package",
  description:
    "Apply for a paid English Learning course package via ALO Education. Consent-tracked referral handoff with 24-hour signed token.",
  path: "/english-learning/apply",
});

export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  // Fetch a small list of courses so the user can pre-select one.
  const courses = await db.englishLearningCourse.findMany({
    where: { isPublished: true },
    take: 24,
    orderBy: [{ isFeatured: "desc" }, { enrollmentCount: "desc" }],
    select: { id: true, slug: true, title: true, level: true, priceUsd: true, currency: true },
  });

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <EnglishLearningBreadcrumb items={[{ label: "Apply" }]} />
        </div>
      </div>

      <section className="border-b border-ink-100 bg-gradient-to-br from-orange-50 via-white to-purple-50 py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Badge
            variant="outline"
            className="border-orange-200 bg-orange-50 text-[11px] font-bold uppercase tracking-widest text-orange-700"
          >
            <Send className="mr-1 h-3 w-3" aria-hidden="true" />
            Apply
          </Badge>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            Apply for a paid course package
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            Pick your target level + course (or apply generally) and we&apos;ll
            transfer you securely to ALO Education to complete your enrolment.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {COURSE_LEVELS.map((lvl) => (
              <Card key={lvl.value} className="p-5">
                <h3 className="font-display text-sm font-bold text-ink-900">
                  {lvl.label}
                </h3>
                <p className="mt-1 text-xs text-ink-600">{lvl.description}</p>
                <ReferralCta
                  referralType="course-package"
                  level={lvl.value}
                  label={`Apply for ${lvl.label}`}
                  size="sm"
                  className="mt-3 w-full rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
                />
              </Card>
            ))}
          </div>

          {courses.length > 0 && (
            <Card className="mt-8 p-5">
              <h3 className="font-display text-base font-bold text-ink-900">
                Or apply for a specific course
              </h3>
              <p className="mt-1 text-xs text-ink-600">
                Pick a course below — we&apos;ll pre-fill the referral context
                with the course slug + level.
              </p>
              <ul className="mt-4 space-y-2">
                {courses.slice(0, 6).map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-3"
                  >
                    <div>
                      <Link
                        href={`/english-learning/courses/${c.slug}`}
                        className="font-semibold text-ink-900 hover:text-orange-600"
                      >
                        {c.title}
                      </Link>
                      <div className="text-[11px] text-ink-500">
                        Level: {c.level}
                        {c.priceUsd != null
                          ? ` · ${c.currency} ${c.priceUsd}`
                          : ""}
                      </div>
                    </div>
                    <ReferralCta
                      referralType="course-package"
                      courseSlug={c.slug}
                      level={c.level}
                      sourceEntityId={c.id}
                      sourceEntityType="course"
                      label="Apply"
                      size="sm"
                      className="rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
                    />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* What happens next */}
          <Card className="mt-8 p-6">
            <h3 className="font-display text-base font-bold text-ink-900">
              What happens next?
            </h3>
            <ol className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                  1
                </span>
                <div>
                  <div className="font-semibold text-ink-900">Consent</div>
                  <div className="text-xs text-ink-600">
                    You consent to being transferred to ALO Education. Only
                    public context (level, course slug) is shared.
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                  2
                </span>
                <div>
                  <div className="font-semibold text-ink-900">Transfer</div>
                  <div className="text-xs text-ink-600">
                    We create a signed referral token (24h validity) and
                    redirect you to ALO Education&apos;s secure enrolment page.
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                  3
                </span>
                <div>
                  <div className="font-semibold text-ink-900">Enrol</div>
                  <div className="text-xs text-ink-600">
                    Complete enrolment + payment on ALO Education&apos;s domain.
                    Your data is collected by them, not Alaminn.info.
                  </div>
                </div>
              </li>
            </ol>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Every referral is audited on Alaminn.info with a 24-hour signed
                token. You can read our{" "}
                <Link href="/legal/privacy" className="font-semibold underline">
                  privacy policy
                </Link>
                .
              </span>
            </div>
          </Card>

          {/* Higher Study cross-link */}
          <Card className="mt-6 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-5">
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-[10px] font-bold uppercase tracking-widest text-blue-700"
            >
              <ArrowLeftRight className="mr-1 h-3 w-3" aria-hidden="true" />
              Also exploring
            </Badge>
            <h3 className="mt-2 font-display text-base font-bold text-ink-900">
              Want university applications too?
            </h3>
            <p className="mt-1 text-xs text-ink-600">
              Combine English prep with academic pathway planning — explore
              universities, courses, scholarships and PhDs on the Higher Study
              platform.
            </p>
            <Button
              asChild
              size="sm"
              className="mt-3 gap-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              <Link href="/higher-study">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                Explore Higher Study
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </Card>
        </div>
      </section>
    </>
  );
}
