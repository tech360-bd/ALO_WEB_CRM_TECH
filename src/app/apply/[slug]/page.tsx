import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { publicCourseIdentifierWhere, publicCourseWhere, publicIntakeWhere } from '@/lib/public-catalog';
import ApplyNowForm from '@/components/apply/ApplyNowForm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * FORM A — public "Apply Now" page (/apply/[course-slug]).
 *
 * Purpose (spec): capture the lead AND create the draft application, works for
 * brand-new users, lives on the public website. The page renders for anonymous
 * visitors; the form itself asks them to sign in or register first, then hands
 * off to Form B (the student-portal application) for the details.
 *
 * The server-side rule "Apply Now must NEVER show success unless Form B is
 * fully completed" is enforced in POST /api/applications, not here.
 */
async function loadPublicCourse(slug: string) {
  const identifier = publicCourseIdentifierWhere(slug);
  if (!identifier) return null;
  return db.crmCourse.findFirst({
    where: { AND: [identifier as any, publicCourseWhere()] } as any,
    select: {
      courseId: true,
      courseCode: true,
      name: true,
      courseTitle: true,
      slug: true,
      studyLevel: true,
      subjectArea: true,
      country: true,
      city: true,
      durationMonths: true,
      tuitionFee: true,
      currency: true,
      deadline: true,
      universityId: true,
      university: {
        select: { name: true, slug: true, country: true, city: true, worldRanking: true },
      },
      intakeFees: {
        where: publicIntakeWhere(),
        select: {
          intakeYear: true,
          intakeMonth: true,
          intakeName: true,
          applicationDeadline: true,
          yearlyTuition: true,
          tuitionCurrency: true,
        },
        take: 6,
      },
    },
  }).catch(() => null);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await loadPublicCourse(slug);
  const name = course?.courseTitle || 'Course application';
  const university = course?.university?.name;
  return {
    title: `Apply${university ? ` — ${name} at ${university}` : ` — ${name}`} | ALO Education`,
    description: `Apply online${university ? ` to ${name} at ${university}` : ` to ${name}`}. Sign in or register to start your ALO Education application — your details travel with your student profile.`,
    robots: { index: false, follow: false },
  };
}

export default async function ApplyNowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await loadPublicCourse(slug);
  if (!course) notFound();

  const summary = {
    courseId: course.courseId,
    courseCode: course.courseCode || course.courseId,
    courseSlug: course.slug || course.courseId,
    courseTitle: course.courseTitle,
    universityId: course.universityId,
    universityName: course.university?.name || '',
    universitySlug: course.university?.slug || '',
    studyLevel: course.studyLevel,
    subjectArea: course.subjectArea,
    country: course.country || course.university?.country || '',
    city: course.city || course.university?.city || '',
    durationMonths: course.durationMonths,
    tuitionFee: course.tuitionFee,
    currency: course.currency,
  };

  const intakes = (course.intakeFees || [])
    .map((intake) => ({
      label: intake.intakeName || [intake.intakeMonth, intake.intakeYear].filter(Boolean).join(' '),
      deadline: intake.applicationDeadline || '',
      tuition: intake.yearlyTuition || 0,
      currency: intake.tuitionCurrency || course.currency,
    }))
    .filter((intake) => intake.label);

  return (
    <div className="min-h-screen bg-alo-brand-light">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="rounded-2xl border border-alo-brand-border bg-white p-10 text-center text-alo-text-muted">Loading application…</div>}>
          <ApplyNowForm course={summary} intakes={intakes} />
        </Suspense>
      </main>
    </div>
  );
}
