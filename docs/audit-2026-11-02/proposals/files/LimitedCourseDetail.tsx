/**
 * PROPOSED FILE — src/components/website/LimitedCourseDetail.tsx
 *
 * Renders a partially verified course. It is a separate component on purpose:
 * CourseDetailHub carries richer, fully-verified assumptions (fees, intakes,
 * deadlines) and must not learn a "partial" mode that could leak them.
 *
 * Rules this component enforces visually:
 *  - every value it shows arrives from the policy's `fields` allow-list;
 *  - a field with no course-specific evidence renders the literal words
 *    "Not confirmed" — never a dash, a zero, or nothing;
 *  - the suppressed list is stated in words so absence is not read as a fact;
 *  - the page never invites an application on unevidenced terms.
 */
import Link from 'next/link';
import type { LimitedPublicationField } from '@/lib/partial-publication/limited-publication-policy';

const SUPPRESSED_COPY: Record<string, string> = {
  fee: 'Tuition fees',
  tuition_fee: 'Tuition fees',
  entry_requirement: 'Entry requirements',
  english_requirement: 'English language requirements',
  start_months: 'Intake months',
  intake_dates: 'Intake dates',
  application_deadline: 'Application deadlines',
  scholarship: 'Scholarships',
  eligibility: 'Eligibility',
};

export default function LimitedCourseDetail({
  title,
  institution,
  institutionSlug,
  fields,
  suppressed,
  banner,
  lastVerifiedAt,
  evidenceUrls,
}: {
  title: string;
  institution: string;
  institutionSlug: string;
  fields: LimitedPublicationField[];
  suppressed: string[];
  banner: string;
  lastVerifiedAt: string | null;
  evidenceUrls: string[];
}) {
  return (
    <article className="mx-auto max-w-4xl px-4 sm:px-6">
      <header className="mb-8">
        <p className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
          Partially verified record
        </p>
        <h1 className="mt-4 text-3xl font-bold text-[var(--alo-text)] dark:text-white">{title}</h1>
        {institution ? (
          <p className="mt-2 text-base text-[var(--alo-body)] dark:text-[var(--alo-text-muted)]">
            {institutionSlug ? (
              <Link className="underline" href={`/universities/${encodeURIComponent(institutionSlug)}`}>
                {institution}
              </Link>
            ) : (
              institution
            )}
          </p>
        ) : null}
        <p className="mt-4 rounded-lg bg-[var(--alo-brand-pale)] p-4 text-sm leading-relaxed text-[var(--alo-text)]">
          {banner} Confirm anything that matters to your decision directly with the institution before you apply or pay.
        </p>
      </header>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className="rounded-lg border border-gray-200 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">
              {field.label}
            </dt>
            <dd
              className={
                field.state === 'confirmed'
                  ? 'mt-1 text-base text-[var(--alo-text)] dark:text-white'
                  : 'mt-1 text-base italic text-[var(--alo-text-muted)]'
              }
            >
              {field.state === 'confirmed' && field.value ? field.value : 'Not confirmed'}
            </dd>
          </div>
        ))}
      </dl>

      {suppressed.length > 0 ? (
        <section className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-900">Not confirmed for this course</h2>
          <p className="mt-1 text-sm text-amber-900">
            We do not have course-specific official evidence for the following, so we do not state
            them anywhere on this page:
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-900">
            {suppressed.map((key) => (
              <li key={key}>{SUPPRESSED_COPY[key] || key}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="mt-8 border-t border-gray-200 pt-4 text-xs text-[var(--alo-text-muted)]">
        {lastVerifiedAt ? <p>Last checked against the institution&apos;s own pages: {lastVerifiedAt}.</p> : null}
        {evidenceUrls.length > 0 ? (
          <p className="mt-1">
            Sources:{' '}
            {evidenceUrls.map((url, index) => (
              <span key={url}>
                {index > 0 ? ', ' : ''}
                <a className="underline" href={url} rel="nofollow noopener noreferrer" target="_blank">
                  {new URL(url).hostname}
                </a>
              </span>
            ))}
          </p>
        ) : null}
        <p className="mt-1">
          Facts are shown only where a course-specific official page supports them. Missing
          information is labelled, not guessed.
        </p>
      </footer>
    </article>
  );
}
