/**
 * /english-learning/book-tutor
 * --------------------------------------------------------------------
 * Request a tutor match. Lets the user pick their target test/level
 * and (optionally) a specific tutor, then triggers a tutor-booking
 * referral to ALO Education.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarPlus,
  UserSearch,
  ShieldCheck,
  ArrowRight,
  ArrowLeftRight,
  GraduationCap,
} from "lucide-react";
import { db } from "@/lib/db";
import { buildEnglishLearningMetadata } from "@/lib/english-learning/seo";
import { EnglishLearningBreadcrumb } from "@/components/english-learning/breadcrumb";
import { ReferralCta } from "@/components/english-learning/referral-cta";
import { TutorCard } from "@/components/english-learning/tutor-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { COURSE_LEVELS } from "@/lib/english-learning/constants";

export const metadata: Metadata = buildEnglishLearningMetadata({
  title: "Book a 1:1 English Tutor",
  description:
    "Book a 1:1 English tutor via ALO Education. Pick your target test, browse verified tutors, and request a booking with consent-tracked referral.",
  path: "/english-learning/book-tutor",
});

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ tutor?: string }>;
}

export default async function BookTutorPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const selectedTutorSlug = sp.tutor || "";

  const [selectedTutor, availableTutors] = await Promise.all([
    selectedTutorSlug
      ? db.englishLearningTutor.findFirst({
          where: { slug: selectedTutorSlug, isPublished: true },
        })
      : Promise.resolve(null),
    db.englishLearningTutor.findMany({
      where: { isPublished: true, isAvailable: true },
      take: 6,
      orderBy: { rating: "desc" },
    }),
  ]);

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <EnglishLearningBreadcrumb items={[{ label: "Book a Tutor" }]} />
        </div>
      </div>

      <section className="border-b border-ink-100 bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-[11px] font-bold uppercase tracking-widest text-emerald-700"
          >
            <CalendarPlus className="mr-1 h-3 w-3" aria-hidden="true" />
            Book a tutor
          </Badge>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            Book a 1:1 English Tutor
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            Tell us your target test + level (and optionally pick a tutor).
            We&apos;ll transfer you securely to ALO Education to choose a slot
            and pay.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-8">
          {selectedTutor && (
            <Card className="border-emerald-200 bg-emerald-50/40 p-5">
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-[10px] font-bold uppercase tracking-widest text-emerald-700"
              >
                Selected tutor
              </Badge>
              <h3 className="mt-2 font-display text-lg font-bold text-ink-900">
                {selectedTutor.name}
              </h3>
              {selectedTutor.bio && (
                <p className="mt-1 text-sm text-ink-700 line-clamp-3">
                  {selectedTutor.bio}
                </p>
              )}
              <ReferralCta
                referralType="tutor-booking"
                tutorSlug={selectedTutor.slug}
                sourceEntityId={selectedTutor.id}
                sourceEntityType="tutor"
                label={`Book ${selectedTutor.name.split(" ")[0]}`}
                size="lg"
                className="mt-4 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
              />
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-display text-base font-bold text-ink-900">
              Pick your target test/level
            </h3>
            <p className="mt-1 text-xs text-ink-600">
              Choose a level below — we&apos;ll start a tutor-booking referral
              with that context.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {COURSE_LEVELS.map((lvl) => (
                <div
                  key={lvl.value}
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3"
                >
                  <div>
                    <div className="text-sm font-bold text-ink-900">
                      {lvl.label}
                    </div>
                    <div className="text-[11px] text-ink-500">
                      {lvl.description}
                    </div>
                  </div>
                  <ReferralCta
                    referralType="tutor-booking"
                    level={lvl.value}
                    label="Book"
                    size="sm"
                    className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                  />
                </div>
              ))}
            </div>
          </Card>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-ink-900">
                Or pick from available tutors
              </h3>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl border-ink-200 text-ink-700"
              >
                <Link href="/english-learning/tutors">
                  <UserSearch className="h-3.5 w-3.5" aria-hidden="true" />
                  Browse all
                </Link>
              </Button>
            </div>
            {availableTutors.length === 0 ? (
              <Card className="mt-3 border-dashed bg-ink-50/50 p-8 text-center text-sm text-ink-600">
                No tutors currently available. Please check back soon.
              </Card>
            ) : (
              <div className="mt-3 grid gap-5 sm:grid-cols-2">
                {availableTutors.map((t) => (
                  <TutorCard key={t.id} tutor={t as never} showActions={false} />
                ))}
              </div>
            )}
          </div>

          {/* Cross-link */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-5">
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-[10px] font-bold uppercase tracking-widest text-blue-700"
            >
              <ArrowLeftRight className="mr-1 h-3 w-3" aria-hidden="true" />
              Cross-link
            </Badge>
            <h3 className="mt-2 font-display text-base font-bold text-ink-900">
              Need university application help too?
            </h3>
            <p className="mt-1 text-xs text-ink-600">
              Explore universities, courses, scholarships and PhD opportunities
              on the Higher Study platform.
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

          <Card className="p-5 text-xs text-ink-600">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>
                Booking + payment are handled by ALO Education on their own
                domain. Alaminn.info only shares public context (tutor slug,
                level) — never PII.
              </span>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
