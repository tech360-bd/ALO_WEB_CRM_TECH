import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  PUBLIC_PROGRAMME_NOTICES,
  getPublicProgramme,
  listPublicFundingForUniversity,
} from '@/lib/phd/public-catalogue';

export const dynamic = 'force-dynamic';

function money(amountMinor: number | null, currency: string | null): string | null {
  if (amountMinor === null || amountMinor === undefined) return null;
  const code = (currency || 'GBP').toUpperCase();
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(
      amountMinor / 100,
    );
  } catch {
    return `${(amountMinor / 100).toLocaleString('en-GB')} ${code}`;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ programmeId: string }>;
}): Promise<Metadata> {
  const { programmeId } = await params;
  try {
    const programme = await getPublicProgramme(programmeId);
    if (!programme) return { title: 'Research programme | ALO Education' };
    return {
      title: `${programme.name} — ${programme.university.name} | ALO Education`,
      description: `Verified ${programme.award} information for ${programme.name} at ${programme.university.name}, with official source links and last-checked dates.`,
      alternates: { canonical: `https://aloeducation.com/research-opportunities/${programme.id}` },
    };
  } catch {
    return { title: 'Research programme | ALO Education' };
  }
}

export default async function ProgrammePage({ params }: { params: Promise<{ programmeId: string }> }) {
  const { programmeId } = await params;
  const programme = await getPublicProgramme(programmeId).catch(() => null);
  if (!programme) notFound();

  const funding = await listPublicFundingForUniversity(programme.universityId).catch(() => []);
  const checked = programme.lastVerifiedAt ? new Date(programme.lastVerifiedAt).toISOString().slice(0, 10) : null;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 pb-20 pt-24">
      <nav className="text-sm text-[var(--alo-text-muted)]">
        <Link href="/research-opportunities" className="underline">
          Research degrees
        </Link>{' '}
        / <span>{programme.award}</span>
      </nav>

      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">
          {programme.award} · {programme.discipline.toLowerCase()}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--alo-text)]">{programme.name}</h1>
        <p className="mt-2 text-[var(--alo-body)]">
          {programme.university.name} · {programme.university.country}
          {programme.school?.name ? ` · ${programme.school.name}` : ''}
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--alo-page)] px-3 py-1 text-xs font-semibold text-[var(--alo-text)]">
          Verified against an official page{checked ? ` · last checked ${checked}` : ''}
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-[var(--alo-border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--alo-text)]">Overview</h2>
        <p className="mt-3 whitespace-pre-line text-sm text-[var(--alo-body)]">
          {programme.description || 'The university does not publish a summary we can verify. See the official page.'}
        </p>
        {programme.specialisms && (
          <>
            <h3 className="mt-4 text-sm font-semibold text-[var(--alo-text)]">Research specialisms</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-[var(--alo-body)]">{programme.specialisms}</p>
          </>
        )}
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="font-semibold text-[var(--alo-text)]">Study mode:</span>{' '}
            {[programme.fullTime && 'Full-time', programme.partTime && 'Part-time', programme.distanceLearning && 'Distance learning']
              .filter(Boolean)
              .join(' · ') || 'Not published'}
          </p>
          <p>
            <span className="font-semibold text-[var(--alo-text)]">Intakes:</span>{' '}
            {programme.intakes || 'Not published'}
          </p>
          <p>
            <span className="font-semibold text-[var(--alo-text)]">Application deadline:</span>{' '}
            {programme.applicationDeadline || 'Not published — check the official page'}
          </p>
          <p>
            <span className="font-semibold text-[var(--alo-text)]">Proposal word limit:</span>{' '}
            {programme.proposalWordLimit ? `${programme.proposalWordLimit.toLocaleString('en-GB')} words` : 'Not published'}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--alo-border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--alo-text)]">Entry and English-language requirements</h2>
        <p className="mt-3 whitespace-pre-line text-sm text-[var(--alo-body)]">
          {programme.applicationRequirements || 'Not published as a verified requirement. Confirm with the department.'}
        </p>
        {programme.englishRequirements && (
          <>
            <h3 className="mt-4 text-sm font-semibold text-[var(--alo-text)]">English language</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-[var(--alo-body)]">{programme.englishRequirements}</p>
          </>
        )}
        {(programme.proposalFormat || programme.requiredHeadings || programme.referencingStyle) && (
          <>
            <h3 className="mt-4 text-sm font-semibold text-[var(--alo-text)]">Research proposal</h3>
            <ul className="mt-2 space-y-1 text-sm text-[var(--alo-body)]">
              {programme.proposalFormat && <li>Format: {programme.proposalFormat}</li>}
              {programme.requiredHeadings && <li>Required headings: {programme.requiredHeadings}</li>}
              {programme.referencingStyle && <li>Referencing: {programme.referencingStyle}</li>}
              {programme.abstractRequired !== null && <li>Abstract: {programme.abstractRequired ? 'required' : 'not required'}</li>}
            </ul>
          </>
        )}
        {programme.requiredDocuments && (
          <>
            <h3 className="mt-4 text-sm font-semibold text-[var(--alo-text)]">Required documents</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-[var(--alo-body)]">{programme.requiredDocuments}</p>
          </>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--alo-border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--alo-text)]">Fees</h2>
        {programme.fees.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--alo-body)]">
            No verified fee record for this programme. The amount is unknown here — it is not zero and not
            &quot;not required&quot;.{' '}
            {programme.feesUrl && (
              <a href={programme.feesUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                Check the university&apos;s fee page
              </a>
            )}
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--alo-border)] text-xs uppercase text-[var(--alo-text-muted)]">
                  <th className="py-2 pr-4">Academic year</th>
                  <th className="py-2 pr-4">Student category</th>
                  <th className="py-2 pr-4">Basis</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {programme.fees.map((fee) => (
                  <tr key={fee.id} className="border-b border-[var(--alo-border)]/60">
                    <td className="py-2 pr-4">{fee.academicYear}</td>
                    <td className="py-2 pr-4">{fee.studentStatus}</td>
                    <td className="py-2 pr-4">{fee.feeBasis}</td>
                    <td className="py-2 pr-4">{money(fee.amountMinor, fee.currency) ?? 'Unknown'}</td>
                    <td className="py-2">
                      {fee.sourceUrl ? (
                        <a href={fee.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                          Official
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--alo-border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--alo-text)]">Deadlines</h2>
        {programme.deadlines.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--alo-body)]">
            No verified deadline record. An unknown date stays unknown rather than being approximated.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-[var(--alo-body)]">
            {programme.deadlines.map((deadline) => (
              <li key={deadline.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--alo-border)]/60 py-2">
                <span>
                  <span className="font-semibold text-[var(--alo-text)]">{deadline.title}</span> · {deadline.kind}
                </span>
                <span>
                  {deadline.dueDate ? new Date(deadline.dueDate).toISOString().slice(0, 10) : 'Date not published'}
                  {deadline.timezone ? ` (${deadline.timezone})` : ''}
                  {deadline.sourceUrl && (
                    <a href={deadline.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="ml-2 underline">
                      source
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--alo-border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--alo-text)]">Funding and studentships</h2>
        {funding.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--alo-body)]">
            No verified funding opportunity recorded for this university.{' '}
            {programme.fundingUrl && (
              <a href={programme.fundingUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                Check the university&apos;s funding pages
              </a>
            )}
          </p>
        ) : (
          <ul className="mt-3 space-y-4">
            {funding.map((item) => (
              <li key={item.id} className="rounded-xl border border-[var(--alo-border)]/70 p-4 text-sm">
                <p className="font-semibold text-[var(--alo-text)]">{item.name}</p>
                <p className="mt-1 text-[var(--alo-body)]">
                  {item.fundingType.replace(/_/g, ' ').toLowerCase()}
                  {item.tuitionCoverage ? ` · tuition: ${item.tuitionCoverage}` : ''}
                  {item.stipendAmountMinor !== null ? ` · stipend: ${money(item.stipendAmountMinor, item.currency) ?? 'unknown'}` : ' · stipend not published'}
                </p>
                <p className="mt-1 text-[var(--alo-text-muted)]">
                  Closing: {item.closingDate ? new Date(item.closingDate).toISOString().slice(0, 10) : 'date not published'}
                  {item.closingTimezone ? ` (${item.closingTimezone})` : ''}
                </p>
                <a href={item.officialUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-block font-semibold text-[var(--alo-brand)] underline">
                  Official funding page
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-[var(--alo-text-muted)]">
          A scholarship is only described as fully funded when the official terms say so.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--alo-border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--alo-text)]">Research and supervision</h2>
        <p className="mt-3 text-sm text-[var(--alo-body)]">
          Supervisor availability is never inferred from a profile. Confirm current supervision capacity with the
          department, using its official directory.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {programme.supervisorDirectoryUrl && (
            <a
              href={programme.supervisorDirectoryUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded-lg border border-[var(--alo-border)] px-4 py-2 font-semibold text-[var(--alo-text)]"
            >
              Official supervisor directory
            </a>
          )}
          {programme.school?.researchUrl && (
            <a
              href={programme.school.researchUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded-lg border border-[var(--alo-border)] px-4 py-2 font-semibold text-[var(--alo-text)]"
            >
              School research pages
            </a>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--alo-border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--alo-text)]">Sources and verification</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--alo-body)]">
          <li>
            <span className="font-semibold text-[var(--alo-text)]">Programme page:</span>{' '}
            {programme.officialUrl ? (
              <a href={programme.officialUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                {programme.officialUrl}
              </a>
            ) : (
              'not recorded'
            )}
          </li>
          <li>
            <span className="font-semibold text-[var(--alo-text)]">University research page:</span>{' '}
            {programme.university.researchDegreesUrl ? (
              <a href={programme.university.researchDegreesUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                {programme.university.researchDegreesUrl}
              </a>
            ) : (
              'not recorded'
            )}
          </li>
          <li>
            <span className="font-semibold text-[var(--alo-text)]">Status:</span> {programme.verificationStatus.replace(/_/g, ' ').toLowerCase()}
            {checked ? ` · last checked ${checked}` : ''}
          </li>
        </ul>
        <p className="mt-4 text-xs text-[var(--alo-text-muted)]">
          A verified record means these specific facts were checked. It is not a statement about every fact at this
          institution.
        </p>
      </section>

      <section className="mt-6 rounded-2xl bg-[var(--alo-page)] p-6">
        <h2 className="text-lg font-semibold text-[var(--alo-text)]">Before you apply</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--alo-body)]">
          {PUBLIC_PROGRAMME_NOTICES.map((notice) => (
            <li key={notice}>• {notice}</li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/book-consultation?service=research" className="rounded-lg bg-[var(--alo-brand)] px-4 py-2 font-semibold text-white">
            Talk to a research counsellor
          </Link>
          <Link href="/student/phd" className="rounded-lg border border-[var(--alo-border)] px-4 py-2 font-semibold text-[var(--alo-text)]">
            Open the PhD workspace
          </Link>
        </div>
      </section>
    </main>
  );
}
