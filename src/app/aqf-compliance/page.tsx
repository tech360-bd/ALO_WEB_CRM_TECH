import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, ExternalLink, GraduationCap, Info, ShieldCheck } from 'lucide-react';
import { ALO_CONTACT, ALO_POLICY_LINKS } from '@/lib/alo-site-info';

export const metadata: Metadata = {
  title: 'AQF Compliance | ALO Education',
  description:
    'ALO Education works to the UK Agent Quality Framework (AQF): the National Code of Ethical Practice for UK education agents, British Council agent and counsellor training, transparent information for students, and a published complaints route. Includes the AQF meaning used in Australian education (Australian Qualifications Framework).',
  alternates: { canonical: 'https://aloeducation.com/aqf-compliance' },
  openGraph: {
    title: 'AQF Compliance | ALO Education',
    description:
      'The Agent Quality Framework standards ALO Education applies when advising students about UK study, and where to verify agent status.',
    url: 'https://aloeducation.com/aqf-compliance',
    type: 'website',
  },
};

const AGENT_FRAMEWORK_POINTS = [
  {
    title: 'Promoting ethical practice',
    body:
      'We follow the principles of the National Code of Ethical Practice for UK education agents: accurate advice, no misleading claims about admissions or visas, and no pressure selling.',
  },
  {
    title: 'Transparent information',
    body:
      'Course, tuition and visa information published on this website is taken from official university and government sources and carries a verification date. Where a figure is not confirmed, we say so rather than estimate.',
  },
  {
    title: 'Clear fees and services',
    body:
      'Our free counseling and application support, and any paid services, are explained and quoted in writing before you commit. We tell you when a university pays us for a successful recruitment.',
  },
  {
    title: 'Student choice and informed decisions',
    body:
      'You receive the shortlist with reasons, the entry requirements behind it, and the risks attached to each option — so the choice of course, city and budget stays yours.',
  },
  {
    title: 'Trained counselors',
    body:
      'Counselors are expected to complete UK-focused agent and counsellor training covering the UK education system, the student visa route and ethical standards, and to keep that knowledge current.',
  },
  {
    title: 'Complaints and accountability',
    body:
      'Every complaint is recorded and answered under the published Student Complaint Policy, with appeal to the Chief Executive and the option of contacting the university directly.',
  },
];

const AUSTRALIAN_AQF_LEVELS = [
  ['7', "Bachelor's degree"],
  ['8', "Bachelor honours / graduate certificate / graduate diploma"],
  ['9', "Master's degree"],
  ['10', 'Doctoral degree'],
];

export default function AqfCompliancePage() {
  return (
    <div className="min-h-screen bg-white pt-10 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <BadgeCheck className="mb-4 h-9 w-9 text-alo-cta" aria-hidden="true" />
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-alo-text sm:text-4xl">
          AQF Compliance
        </h1>
        <p className="mt-3 text-sm text-alo-text-secondary">
          Last updated: 13 Oct 2026 · Contact:{' '}
          <a href={ALO_CONTACT.emailHref} className="font-medium text-alo-brand underline">
            {ALO_CONTACT.email}
          </a>
        </p>

        <div className="mt-8 space-y-8">
          {/* Two meanings, stated up front so nobody is misled */}
          <section className="rounded-2xl border border-alo-brand-border bg-alo-brand-light/60 p-6">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-alo-text">
              <Info className="h-5 w-5 text-alo-brand" aria-hidden="true" />
              What &ldquo;AQF&rdquo; refers to on this page
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-alo-text-secondary">
              &ldquo;AQF&rdquo; is used for two different things in international education. For an education
              agent recruiting to the United Kingdom, AQF means the{' '}
              <strong>Agent Quality Framework</strong> — a sector-wide initiative supported by the British
              Council and UK universities that sets the standards expected of agents and counsellors. For study
              in Australia, AQF means the <strong>Australian Qualifications Framework</strong>, the national
              policy that defines qualification levels from Certificate I to Doctoral degree. ALO Education
              applies the agent standards described below; the Australian framework is explained further down
              because it is what our Australia-bound students ask about.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-alo-text">
              <ShieldCheck className="h-5 w-5 text-alo-brand" aria-hidden="true" />
              The UK Agent Quality Framework standards we work to
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {AGENT_FRAMEWORK_POINTS.map((point) => (
                <article key={point.title} className="rounded-2xl border border-alo-border p-5 shadow-sm">
                  <h3 className="font-heading text-sm font-bold text-alo-text">{point.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-alo-text-secondary">{point.body}</p>
                </article>
              ))}
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-alo-text-secondary">
              The framework is published by the UK sector and administered by the British Council and partner
              bodies. Read the official material at the{' '}
              <a
                href="https://www.britishcouncil.org/education/agents-counsellors/uk-quality-agent-framework"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-alo-brand underline underline-offset-2 hover:text-alo-cta"
              >
                British Council Agent Quality Framework pages
                <ExternalLink className="ml-1 inline h-3 w-3 align-baseline" aria-hidden="true" />
              </a>
              , and check whether a counselor is listed in the{' '}
              <a
                href="https://www.britishcouncil.org/education/agents-counsellors/database"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-alo-brand underline underline-offset-2 hover:text-alo-cta"
              >
                British Council database of trained agents and counsellors
                <ExternalLink className="ml-1 inline h-3 w-3 align-baseline" aria-hidden="true" />
              </a>
              . Students and guardians can also read the sector guide{' '}
              <em>A Student and Parent Guide to Choosing an Education Agent</em>, published as part of the
              framework, before signing anything with any agency.
            </p>
          </section>

          <section className="rounded-2xl border border-alo-border p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-alo-text">
              What ALO Education does and does not claim
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-alo-text-secondary">
              <li>
                ALO Education is a private education consultancy registered and operating in Dhaka, Bangladesh.
                We are not a university, a government body or an awarding organisation.
              </li>
              <li>
                Our services are free for students when we are remunerated by a partner institution for a
                successful application; where a service carries a fee, it is quoted in writing first.
              </li>
              <li>
                We do not claim to be accredited, approved or certified by the British Council, UK Visas and
                Immigration, TEQSA, ASQA, CRICOS or any university. Training completed by individual counselors
                is verifiable against the British Council database linked above when ALO Education has recorded
                completion.
              </li>
              <li>
                Nothing on this website guarantees an admission, a scholarship or a visa. See our{' '}
                <Link href={ALO_POLICY_LINKS.codeOfConduct} className="font-medium text-alo-brand underline">
                  Code of Conduct
                </Link>
                .
              </li>
            </ul>
          </section>

          {/* Australian meaning */}
          <section className="rounded-2xl border border-alo-border p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-alo-text">
              <GraduationCap className="h-5 w-5 text-alo-brand" aria-hidden="true" />
              The Australian Qualifications Framework (for Australia-bound students)
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-alo-text-secondary">
              Every regulated qualification in Australia sits at one of ten AQF levels, from Certificate I to
              doctoral degree. The level tells employers, assessing authorities and the migration system what
              the qualification is worth — which is why a Level 9 Master&apos;s is read consistently across
              institutions.
            </p>
            <table className="mt-4 w-full border-collapse text-sm">
              <caption className="sr-only">Selected AQF levels for postgraduate study in Australia</caption>
              <thead>
                <tr className="border-b border-alo-border text-left">
                  <th scope="col" className="py-2 pr-4 font-heading text-xs font-bold uppercase tracking-wider text-alo-text-muted">
                    AQF level
                  </th>
                  <th scope="col" className="py-2 font-heading text-xs font-bold uppercase tracking-wider text-alo-text-muted">
                    Qualification
                  </th>
                </tr>
              </thead>
              <tbody>
                {AUSTRALIAN_AQF_LEVELS.map(([level, qualification]) => (
                  <tr key={level} className="border-b border-alo-border/60">
                    <td className="py-2 pr-4 font-semibold text-alo-text">{level}</td>
                    <td className="py-2 text-alo-text-secondary">{qualification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-[13px] leading-relaxed text-alo-text-secondary">
              Two practical checks before you accept an offer from any agency: the provider must be registered
              on <strong>CRICOS</strong> for international students, and the course you accept must lead to an
              AQF qualification at the level you need for your career or migration plan. A qualification level
              by itself does not create a visa entitlement. Official sources:{' '}
              <a
                href="https://www.aqf.edu.au/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-alo-brand underline underline-offset-2 hover:text-alo-cta"
              >
                aqf.edu.au
                <ExternalLink className="ml-1 inline h-3 w-3 align-baseline" aria-hidden="true" />
              </a>{' '}
              and the{' '}
              <a
                href="https://cricos.education.gov.au/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-alo-brand underline underline-offset-2 hover:text-alo-cta"
              >
                CRICOS register
                <ExternalLink className="ml-1 inline h-3 w-3 align-baseline" aria-hidden="true" />
              </a>
              .
            </p>
          </section>

          <section className="rounded-2xl border border-alo-border p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-alo-text">Questions or concerns</h2>
            <p className="mt-2 text-sm leading-relaxed text-alo-text-secondary">
              If you believe ALO Education has not met these standards, use the{' '}
              <Link href={ALO_POLICY_LINKS.studentComplaintPolicy} className="font-medium text-alo-brand underline">
                Student Complaint Policy
              </Link>{' '}
              or contact the office directly:{' '}
              <a href={ALO_CONTACT.emailHref} className="font-medium text-alo-brand underline">
                {ALO_CONTACT.email}
              </a>{' '}
              ·{' '}
              <a href={ALO_CONTACT.mobileHref} className="font-medium text-alo-brand underline">
                {ALO_CONTACT.mobileDisplay}
              </a>
              .
            </p>
          </section>

          <p className="border-t border-alo-border pt-6 text-xs text-alo-text-muted">
            See also:{' '}
            <Link href={ALO_POLICY_LINKS.codeOfConduct} className="text-alo-brand underline">
              Code of Conduct
            </Link>{' '}
            •{' '}
            <Link href={ALO_POLICY_LINKS.studentComplaintPolicy} className="text-alo-brand underline">
              Student Complaint Policy
            </Link>{' '}
            •{' '}
            <Link href="/destinations/australia" className="text-alo-brand underline">
              Study in Australia
            </Link>{' '}
            •{' '}
            <Link href="/destinations/uk" className="text-alo-brand underline">
              Study in the UK
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
