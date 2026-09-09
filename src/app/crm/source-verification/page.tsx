export const metadata = {
  title: 'Source Verification | ALO Education Staff',
  description: 'Review official-source verification status before publishing university and course data.',
};

export default function SourceVerificationPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">ALO Data Governance</p>
        <h1 className="mt-2 text-3xl font-bold">Source Verification</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          University and course records stay quarantined until official institution pages, fee pages,
          intake pages, requirements, scholarship pages, and ranking sources are verified and approved.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['Discovery', 'Records imported from discovery websites are marked DISCOVERED_ONLY.'],
            ['Official Source', 'Only official university, government, or ranking-provider pages can verify facts.'],
            ['Publication', 'Publishing requires admin review and source-backed fields.'],
          ].map(([title, body]) => (
            <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-slate-600">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          DATA STATUS: QUARANTINED / NOT PUBLISHED until API records at
          <code className="mx-1 rounded bg-white px-1 py-0.5">/api/crm/source-verification</code>
          show source-backed verification and admin approval.
        </div>
      </section>
    </main>
  );
}
