import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { ALO_CONTACT, ALO_POLICY_LINKS } from '@/lib/alo-site-info';

export const metadata: Metadata = {
  title: 'Student Complaint Policy | ALO Education',
  description:
    'How to raise a complaint with ALO Education, what happens after you submit it, our acknowledgement and response targets, the escalation route — including to a partner university — and how complaints are recorded and reviewed.',
  alternates: { canonical: 'https://aloeducation.com/student-complaint-policy' },
  openGraph: {
    title: 'Student Complaint Policy | ALO Education',
    description:
      'A written complaints process for students: acknowledgement within 2 working days, response within 10 working days, escalation route and appeal.',
    url: 'https://aloeducation.com/student-complaint-policy',
    type: 'website',
  },
};

const CHANNELS = [
  {
    icon: MessageCircle,
    title: 'WhatsApp (fastest)',
    detail: 'Message the counselor who handled your case, then ask for the complaint to be logged if it is not resolved in the same conversation.',
    action: { label: ALO_CONTACT.whatsappDisplay, href: ALO_CONTACT.whatsappHref },
  },
  {
    icon: Mail,
    title: 'Email',
    detail: 'Email with the subject line “Complaint”. Include your full name, student/application ID and what you want us to put right.',
    action: { label: ALO_CONTACT.email, href: ALO_CONTACT.emailHref },
  },
  {
    icon: Phone,
    title: 'Phone',
    detail: ALO_CONTACT.officeHours,
    action: { label: ALO_CONTACT.mobileDisplay, href: ALO_CONTACT.mobileHref },
  },
];

const STEPS = [
  {
    title: '1. You submit',
    body:
      'Send the complaint through any channel above, or hand it in at the office. Please include dates, the name of the person you dealt with, and copies of anything relevant (email, payment receipt, application reference).',
  },
  {
    title: '2. We record and acknowledge',
    body:
      'Your complaint is logged with a reference number and acknowledged within 2 working days to the phone number or email address on your file.',
  },
  {
    title: '3. We investigate',
    body:
      'The case is reviewed by a manager who was not personally involved. We may contact you for clarification and may contact the university, partner or service provider concerned.',
  },
  {
    title: '4. We respond in writing',
    body:
      'You receive a written outcome — what we found, what we will do, and by when — within 10 working days of acknowledgement. If we need longer (for example while a university replies), we tell you the reason and a revised date.',
  },
  {
    title: '5. If you are not satisfied',
    body:
      'Appeal in writing within 20 working days of the outcome. An appeal is reviewed by the Chief Executive, whose decision is issued within a further 15 working days and ends our internal process.',
  },
];

export default function StudentComplaintPolicyPage() {
  return (
    <div className="min-h-screen bg-white pt-10 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ShieldCheck className="mb-4 h-9 w-9 text-alo-cta" aria-hidden="true" />
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-alo-text sm:text-4xl">
          Student Complaint Policy
        </h1>
        <p className="mt-3 text-sm text-alo-text-secondary">
          Applies to students, applicants, their sponsors and guardians. Last updated: 13 Oct 2026 · Owner:
          Chief Executive, ALO Education.
        </p>

        <div className="mt-8 space-y-8">
          <section className="rounded-2xl border border-alo-border p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-alo-text">Our position</h2>
            <p className="mt-2 text-sm leading-relaxed text-alo-text-secondary">
              You are entitled to raise a concern without losing your place, your application or your counselor.
              Complaints are handled confidentially by someone who was not involved in the matter, and raising
              one is never held against you. We keep a written record of every complaint, the action taken and
              the outcome so recurring problems are corrected rather than repeated.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-alo-text">How to raise it</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {CHANNELS.map((channel) => {
                const Icon = channel.icon;
                return (
                  <article key={channel.title} className="rounded-2xl border border-alo-border p-5 shadow-sm">
                    <Icon className="h-5 w-5 text-alo-brand" aria-hidden="true" />
                    <h3 className="mt-3 font-heading text-sm font-bold text-alo-text">{channel.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-alo-text-secondary">{channel.detail}</p>
                    <a
                      href={channel.action.href}
                      target={channel.action.href.startsWith('http') ? '_blank' : undefined}
                      rel={channel.action.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="mt-3 inline-block text-[13px] font-semibold text-alo-brand underline underline-offset-2 hover:text-alo-cta"
                    >
                      {channel.action.label}
                    </a>
                  </article>
                );
              })}
            </div>
            <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-alo-text-secondary">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-alo-cta" aria-hidden="true" />
              Office hours: {ALO_CONTACT.officeHours}. Complaints received outside office hours are logged on the
              next working day.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-alo-text">What happens next</h2>
            <ol className="mt-4 space-y-4">
              {STEPS.map((step) => (
                <li key={step.title} className="rounded-2xl border border-alo-border p-5 shadow-sm">
                  <h3 className="font-heading text-sm font-bold text-alo-text">{step.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-alo-text-secondary">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-alo-border p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-alo-text">
              Complaints about an admissions or visa outcome
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-alo-text-secondary">
              An admission, scholarship or visa refusal is a decision made by a university or a government
              authority, not by ALO Education, so we cannot overturn it. We can and will review how your
              application was handled, whether the advice given matched the published requirements at the time,
              whether documents were submitted as agreed, and what options remain. Where the decision belongs to
              a university, we give you the university&apos;s own complaints or appeals route and support your
              submission to it.
            </p>
          </section>

          <section className="rounded-2xl border border-alo-border p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-alo-text">If the matter concerns a university we work with</h2>
            <p className="mt-2 text-sm leading-relaxed text-alo-text-secondary">
              You may complain directly to the university you applied to — or to the university that made the
              decision — at the same time as, or instead of, using this process. Universities that recruit
              international students must publish their own complaints procedure, and using it does not affect
              your application. ALO Education will provide, on request, the name of the partner university
              representative who manages our relationship with that institution.
            </p>
          </section>

          <section className="rounded-2xl border border-alo-border p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-alo-text">Records and reporting</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-alo-text-secondary">
              <li>Complaint records are retained for 3 years and stored with restricted access.</li>
              <li>
                Personal data in a complaint is handled under our{' '}
                <Link href="/privacy-policy" className="font-medium text-alo-brand underline">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/lead-data-usage-policy" className="font-medium text-alo-brand underline">
                  Lead Data Usage Policy
                </Link>
                .
              </li>
              <li>Complaint themes and outcomes are reviewed by management each quarter and fed into staff training.</li>
            </ul>
          </section>

          <p className="border-t border-alo-border pt-6 text-xs text-alo-text-muted">
            Related:{' '}
            <Link href={ALO_POLICY_LINKS.codeOfConduct} className="text-alo-brand underline">
              Code of Conduct
            </Link>{' '}
            •{' '}
            <Link href={ALO_POLICY_LINKS.aqfCompliance} className="text-alo-brand underline">
              AQF Compliance
            </Link>{' '}
            •{' '}
            <Link href="/contact" className="inline-flex items-center gap-1 text-alo-brand underline">
              Contact us <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
