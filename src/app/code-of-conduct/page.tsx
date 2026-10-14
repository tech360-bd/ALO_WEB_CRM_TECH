import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, Ban, Eye, FileCheck2, Lock, Scale, ShieldCheck } from 'lucide-react';
import { ALO_CONTACT, ALO_POLICY_LINKS } from '@/lib/alo-site-info';

export const metadata: Metadata = {
  title: 'Code of Conduct | ALO Education',
  description:
    'The standards every ALO Education counselor, employee and partner representative follows: accurate information, written fee transparency, no guarantees of admission or visa outcomes, document integrity, confidentiality and a documented complaints route.',
  alternates: { canonical: 'https://aloeducation.com/code-of-conduct' },
  openGraph: {
    title: 'Code of Conduct | ALO Education',
    description:
      'How ALO Education works with students: honest information, transparent fees, no false promises, and a complaints process you can hold us to.',
    url: 'https://aloeducation.com/code-of-conduct',
    type: 'website',
  },
};

const PRINCIPLES = [
  {
    icon: Eye,
    title: 'Accurate, sourced information',
    body:
      'Course, tuition, intake, visa and scholarship details are taken from official university and government sources, recorded with the date we last verified them. When a figure is unconfirmed we say so instead of filling the gap with an estimate.',
  },
  {
    icon: FileCheck2,
    title: 'Transparent fees, in writing',
    body:
      'Every charge for education counseling, document review or after-admission services is quoted in writing before you commit, with what is included and what is not. We do not take payment for a guaranteed outcome and we do not add undisclosed charges later.',
  },
  {
    icon: Ban,
    title: 'No promise of admission, scholarship or visa',
    body:
      'Admission, scholarship and visa decisions belong to universities and government authorities — never to an agency. ALO Education assesses your profile honestly and supports the application; we do not promise outcomes and we do not present any outcome as certain.',
  },
  {
    icon: ShieldCheck,
    title: 'Document integrity',
    body:
      'We do not create, alter or submit false documents, and we stop working on an application if false or altered documents are supplied. You are entitled to see how your own documents are used and where they are sent.',
  },
  {
    icon: Lock,
    title: 'Confidentiality and consent',
    body:
      'Your personal data is processed only for the services you asked for and only on the communication channels you consented to, as described in our Privacy Policy, Lead Data Usage Policy and Communication Policy.',
  },
  {
    icon: Scale,
    title: 'Respect, honesty and fair treatment',
    body:
      'Students are treated equally regardless of gender, religion, ethnicity, disability, academic background or ability to pay. Staff and partner representatives are expected to act courteously, avoid conflicts of interest and disclose any interest that could affect advice given to you.',
  },
];

const COMMITMENTS = [
  'Explain the realistic options for your profile — including when a course, budget or destination is not a good fit.',
  'Tell you which universities we work with as a partner and how we are remunerated, if you ask.',
  'Give you copies of what we submit on your behalf, and keep your contact details and portal account in your own control.',
  'Respond to a complaint through the documented process in the Student Complaint Policy.',
  'Keep working to the UK Agent Quality Framework principles described in our AQF Compliance statement.',
];

export default function CodeOfConductPage() {
  return (
    <div className="min-h-screen bg-white pt-10 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <BadgeCheck className="mb-4 h-9 w-9 text-alo-cta" aria-hidden="true" />
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-alo-text sm:text-4xl">
          Code of Conduct
        </h1>
        <p className="mt-3 text-sm text-alo-text-secondary">
          Applies to every ALO Education counselor, employee, branch and partner representative. Last
          updated: 13 Oct 2026 · Contact:{' '}
          <a href={ALO_CONTACT.emailHref} className="font-medium text-alo-brand underline">
            {ALO_CONTACT.email}
          </a>{' '}
          ·{' '}
          <a href={ALO_CONTACT.mobileHref} className="font-medium text-alo-brand underline">
            {ALO_CONTACT.mobileDisplay}
          </a>
        </p>

        <div className="mt-8 space-y-8">
          <section className="rounded-2xl border border-alo-border p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-alo-text">Our commitment to students</h2>
            <p className="mt-2 text-sm leading-relaxed text-alo-text-secondary">
              ALO Education is an education consultancy. We are not a university and we do not issue
              qualifications. Our role is to give Bangladeshi students honest, well-sourced guidance and to
              manage an application professionally from the first counseling session to pre-departure
              briefing. This page states the conduct you can expect from us and that you may hold us to.
            </p>
            <ul className="mt-4 space-y-2.5">
              {COMMITMENTS.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-alo-text-secondary">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-alo-brand" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="principles">
            <h2 id="principles" className="font-heading text-lg font-bold text-alo-text">
              The six standards we work to
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {PRINCIPLES.map((principle) => {
                const Icon = principle.icon;
                return (
                  <article key={principle.title} className="rounded-2xl border border-alo-border p-5 shadow-sm">
                    <Icon className="h-5 w-5 text-alo-brand" aria-hidden="true" />
                    <h3 className="mt-3 font-heading text-sm font-bold text-alo-text">{principle.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-alo-text-secondary">{principle.body}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-alo-border p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-alo-text">What we will never do</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-alo-text-secondary">
              <li>Guarantee an admission, a scholarship, a visa, a processing time or a work-rights outcome.</li>
              <li>Submit forged, altered or purchased academic or financial documents on your behalf.</li>
              <li>Quote a &ldquo;visa success rate&rdquo; or ranking that we cannot attribute to an official source.</li>
              <li>Charge a fee for a service without first providing it in writing.</li>
              <li>Keep your passport, certificates or original documents when you ask for them back.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-alo-border p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-alo-text">If we fall short</h2>
            <p className="mt-2 text-sm leading-relaxed text-alo-text-secondary">
              Tell us first — most issues are resolved quickly. Every complaint is handled under the{' '}
              <Link href={ALO_POLICY_LINKS.studentComplaintPolicy} className="font-medium text-alo-brand underline">
                Student Complaint Policy
              </Link>
              , which sets out acknowledgement and response targets. Staff who breach this code are subject to
              internal review and, where a partner representative is involved, escalation to the partner and to
              the relevant university and professional body.
            </p>
          </section>

          <p className="border-t border-alo-border pt-6 text-xs text-alo-text-muted">
            Related:{' '}
            <Link href={ALO_POLICY_LINKS.studentComplaintPolicy} className="text-alo-brand underline">
              Student Complaint Policy
            </Link>{' '}
            •{' '}
            <Link href={ALO_POLICY_LINKS.aqfCompliance} className="text-alo-brand underline">
              AQF Compliance
            </Link>{' '}
            •{' '}
            <Link href="/privacy-policy" className="text-alo-brand underline">
              Privacy Policy
            </Link>{' '}
            •{' '}
            <Link href="/communication-policy" className="text-alo-brand underline">
              Communication Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
