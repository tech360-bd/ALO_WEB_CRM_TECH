import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublicProgrammes, PROGRAMME_AWARDS, PROGRAMME_DISCIPLINES } from '@/lib/phd/public-catalogue';

export const metadata: Metadata = {
  title: 'Research Degrees & Studentships | ALO Education',
  description:
    'Browse MRes, MPhil, PhD, DPhil and EngD programmes that ALO Education has verified against official university pages, with source links and last-checked dates.',
  alternates: { canonical: 'https://aloeducation.com/research-opportunities' },
};

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  discipline?: string;
  country?: string;
  award?: string;
  page?: string;
}

export default async function ResearchOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  let result: Awaited<ReturnType<typeof listPublicProgrammes>> | null = null;
  try {
    result = await listPublicProgrammes({
      q: sp.q,
      discipline: sp.discipline,
      country: sp.country,
      award: sp.award,
      page,
      pageSize: 12,
    });
  } catch {
    result = null;
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  const buildHref = (overrides: Partial<SearchParams>) => {
    const params = new URLSearchParams();
    const merged = { ...sp, ...overrides };
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
    });
    const qs = params.toString();
    return qs ? `/research-opportunities?${qs}` : '/research-opportunities';
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-20 pt-24">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">Research degrees</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--alo-text)]">UK research programmes we have verified</h1>
        <p className="mt-3 max-w-3xl text-[var(--alo-body)]">
          Every programme below has been checked against the university&apos;s own page. Records that are not yet
          verified are not shown here — that is a gap in our catalogue, not proof that a programme does not exist.
        </p>
      </header>

      <form method="get" className="mt-8 grid gap-3 rounded-2xl border border-[var(--alo-border)] p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-[var(--alo-text)]">Search</span>
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Subject, title, specialism"
            className="w-full rounded-lg border border-[var(--alo-border)] px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-[var(--alo-text)]">Discipline</span>
          <select name="discipline" defaultValue={sp.discipline ?? 'all'} className="w-full rounded-lg border border-[var(--alo-border)] px-3 py-2">
            <option value="all">All disciplines</option>
            {PROGRAMME_DISCIPLINES.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0) + value.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-[var(--alo-text)]">Award</span>
          <select name="award" defaultValue={sp.award ?? 'all'} className="w-full rounded-lg border border-[var(--alo-border)] px-3 py-2">
            <option value="all">All awards</option>
            {PROGRAMME_AWARDS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-[var(--alo-text)]">Country</span>
          <input
            name="country"
            defaultValue={sp.country ?? ''}
            placeholder="e.g. United Kingdom"
            className="w-full rounded-lg border border-[var(--alo-border)] px-3 py-2"
          />
        </label>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-lg bg-[var(--alo-brand)] px-4 py-2 text-sm font-semibold text-white">
            Apply filters
          </button>
        </div>
      </form>

      {!result ? (
        <div className="mt-10 rounded-2xl border border-[var(--alo-border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--alo-text)]">The research catalogue is temporarily unavailable</h2>
          <p className="mt-2 text-sm text-[var(--alo-body)]">
            We could not reach the catalogue just now. This is a service problem, not an empty catalogue — please try again
            shortly, or contact a counsellor.
          </p>
          <Link href="/book-consultation?service=research" className="mt-4 inline-block text-sm font-semibold text-[var(--alo-brand)] underline">
            Request research guidance
          </Link>
        </div>
      ) : result.programmes.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-[var(--alo-border)] p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--alo-text)]">No verified programme matches these filters</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--alo-body)]">
            Our verified research catalogue is still being built. Adjust the filters, or ask a counsellor to check a
            specific programme against the university&apos;s official page for you.
          </p>
          <Link href="/book-consultation?service=research" className="mt-4 inline-block text-sm font-semibold text-[var(--alo-brand)] underline">
            Ask us to check a programme
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-[var(--alo-text-muted)]">
            {result.total} verified programme{result.total === 1 ? '' : 's'} · page {result.page} of {totalPages}
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {result.programmes.map((programme) => (
              <li key={programme.id} className="rounded-2xl border border-[var(--alo-border)] p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">
                  {programme.award} · {programme.discipline.toLowerCase()}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--alo-text)]">{programme.name}</h2>
                <p className="mt-1 text-sm text-[var(--alo-body)]">
                  {programme.university.name} · {programme.university.country}
                </p>
                <p className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--alo-text-muted)]">
                  {programme.fullTime && <span className="rounded-full bg-[var(--alo-page)] px-2 py-1">Full-time</span>}
                  {programme.partTime && <span className="rounded-full bg-[var(--alo-page)] px-2 py-1">Part-time</span>}
                  {programme.distanceLearning && <span className="rounded-full bg-[var(--alo-page)] px-2 py-1">Distance</span>}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                  <Link href={`/research-opportunities/${programme.id}`} className="font-semibold text-[var(--alo-brand)] underline">
                    Programme details
                  </Link>
                  {programme.officialUrl && (
                    <a
                      href={programme.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-[var(--alo-body)] underline"
                    >
                      Official page
                    </a>
                  )}
                </div>
                {programme.lastVerifiedAt && (
                  <p className="mt-3 text-[11px] text-[var(--alo-text-muted)]">
                    Verified {new Date(programme.lastVerifiedAt).toISOString().slice(0, 10)}
                  </p>
                )}
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Pagination">
              {page > 1 ? (
                <Link href={buildHref({ page: String(page - 1) })} className="font-semibold text-[var(--alo-brand)] underline">
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              {page < totalPages ? (
                <Link href={buildHref({ page: String(page + 1) })} className="font-semibold text-[var(--alo-brand)] underline">
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}

      <section className="mt-12 rounded-2xl border border-[var(--alo-border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--alo-text)]">How to read this directory</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--alo-body)]">
          <li>• A verified record means the specific facts shown were checked against the university&apos;s page and dated.</li>
          <li>• Fees are shown only where published, with their academic year and student category.</li>
          <li>• An advertised, funded project is shown separately from a general research-degree application.</li>
          <li>• We never promise admission, funding or a supervisor&apos;s availability.</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/course-finder" className="rounded-lg border border-[var(--alo-border)] px-4 py-2 font-semibold text-[var(--alo-text)]">
            Search taught courses
          </Link>
          <Link href="/book-consultation?service=research" className="rounded-lg bg-[var(--alo-brand)] px-4 py-2 font-semibold text-white">
            Request research guidance
          </Link>
        </div>
      </section>
    </main>
  );
}
