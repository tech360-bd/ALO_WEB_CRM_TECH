export const metadata = {
  title: 'Official Source Verification | ALO Education Admin',
  description: 'Review official university source checks, course crawl status, parsing failures, and publication readiness.',
};

const reviewPanels = [
  ['University crawl status', 'Official profile, international, fee, scholarship, requirement and calendar URLs.'],
  ['Course crawl status', 'Catalogue links, individual course pages, parser status and duplicate URLs.'],
  ['Missing fields', 'Fees, intakes, requirements, Bangladesh guidance, modules and scholarship references requiring review.'],
  ['Evidence viewer', 'Requested URL, final URL, HTTP status, title, content hash, soft-404 and entity match status.'],
  ['Manual approval', 'Admin edits, approval decisions and rollback notes must be audited before publication.'],
  ['Re-crawl queue', 'Run domain-specific adapters with rate limits and compare content hashes before updating records.'],
];

export default function AdminSourceVerificationPage() {
  return (
    <main className="min-h-screen bg-[var(--alo-page)] px-6 py-8 text-[var(--alo-text)]">
      <section className="mx-auto max-w-7xl">
        <p className="caption-text text-[var(--alo-success-dark)]">ALO Education Data Governance</p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Official Source Verification</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--alo-placeholder)]">
              University and course data remains unpublished until official-source evidence is reviewed.
              Aggregators are discovery-only. This screen is backed by protected CRM verification APIs.
            </p>
          </div>
          <a
            href="/api/crm/source-verification"
            className="inline-flex w-fit items-center rounded-[10px] border border-[var(--alo-success)] bg-[var(--alo-success-soft)] px-4 py-2.5 text-[13px] font-semibold text-[var(--alo-success-dark)] transition-colors hover:bg-[var(--alo-success)] hover:text-white"
          >
            Open Protected Evidence API
          </a>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reviewPanels.map(([title, body]) => (
            <article key={title} className="rounded-[14px] border border-[var(--alo-border)] bg-card p-5 shadow-[var(--alo-shadow-xs)]">
              <h2 className="card-title">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--alo-body)]">{body}</p>
            </article>
          ))}
        </div>

        <section className="mt-8 rounded-[14px] border border-[var(--alo-warning)] bg-[var(--alo-warning-soft)] p-5 text-sm leading-6 text-[var(--alo-warning-strong)]">
          <h2 className="font-semibold">Publication Rule</h2>
          <p className="mt-2">
            A course may be published only after official course URL ownership, study level, delivery mode,
            intake evidence, fee status, entry-requirement status, source evidence, and verification timestamp
            are present. Missing official information must be marked as <strong>NOT_PUBLISHED</strong> or
            <strong> NEEDS_REVIEW</strong>; it must not be guessed.
          </p>
        </section>
      </section>
    </main>
  );
}
