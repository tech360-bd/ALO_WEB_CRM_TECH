'use client';

/**
 * Help — /student/help
 *
 * Routes the student to the portal pages that actually answer their question,
 * and to the one contact address published on this site. No phone number or
 * support inbox is invented here; anything not published is left out.
 */

import Link from 'next/link';
import {
  CalendarDays, ChevronRight, FileText, LifeBuoy, Mail, MessageSquare,
  Receipt, ShieldAlert, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PortalCard, PortalPageHeader, PortalSectionTitle,
} from '@/components/student/portal-section';

interface HelpLink {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COMMON_TOPICS: HelpLink[] = [
  {
    label: 'Where is my application?',
    description: 'See the current stage, offer status and any documents still needed.',
    href: '/student/applications',
    icon: FileText,
  },
  {
    label: 'My document was rejected',
    description: 'Open the document to read the reason, then upload a replacement.',
    href: '/student/documents',
    icon: FileText,
  },
  {
    label: 'What do I owe?',
    description: 'Every charge recorded on your file, with due dates and status.',
    href: '/student/payments',
    icon: Receipt,
  },
  {
    label: 'What is my visa checklist?',
    description: 'The documents your visa file still needs, grouped by category.',
    href: '/student/visa/checklist',
    icon: ShieldAlert,
  },
  {
    label: 'How ready is my visa file?',
    description: 'A breakdown across documents, finances and interview preparation.',
    href: '/student/visa/readiness',
    icon: LifeBuoy,
  },
  {
    label: 'Talk to my counselor',
    description: 'Send a message about anything on your file.',
    href: '/student/messages',
    icon: MessageSquare,
  },
  {
    label: 'Book an appointment',
    description: 'Request a consultation and we confirm the time.',
    href: '/student/appointments',
    icon: CalendarDays,
  },
  {
    label: 'Practise interview answers',
    description: 'Rehearse common questions with the AI visa coach.',
    href: '/ai/visa-coach',
    icon: Sparkles,
  },
];

const PORTAL_PAGES: HelpLink[] = [
  {
    label: 'My Tasks',
    description: 'Everything due on your applications, in priority order.',
    href: '/student/tasks',
    icon: ChevronRight,
  },
  {
    label: 'My Timeline',
    description: 'A record of what has already happened on your journey.',
    href: '/student/timeline',
    icon: ChevronRight,
  },
  {
    label: 'Confirmation documents',
    description: 'Your CAS, I-20, CoE or offer letter.',
    href: '/student/cas',
    icon: ChevronRight,
  },
  {
    label: 'Interview records',
    description: 'Feedback from your mock and credibility interviews.',
    href: '/student/credibility-interview',
    icon: ChevronRight,
  },
  {
    label: 'Statement of purpose',
    description: 'Draft and review your SOPs.',
    href: '/student/sop',
    icon: ChevronRight,
  },
  {
    label: 'Academic CV',
    description: 'Build the CV your applications will use.',
    href: '/student/cv',
    icon: ChevronRight,
  },
  {
    label: 'Refer a friend',
    description: 'Share your referral code and track referrals.',
    href: '/student/referrals',
    icon: ChevronRight,
  },
  {
    label: 'Update my profile',
    description: 'Correct your name, email, phone and location.',
    href: '/student/profile/onboarding',
    icon: ChevronRight,
  },
];

export default function StudentHelp() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <PortalPageHeader
          title="Help"
          description="Find an answer, or reach the person handling your applications."
        />

        <PortalCard className="mb-5">
          <PortalSectionTitle>
            <LifeBuoy className="mr-2 h-4 w-4 text-alo-blue" aria-hidden="true" />
            What do you need help with?
          </PortalSectionTitle>
          <ul className="divide-y divide-slate-200">
            {COMMON_TOPICS.map((topic) => (
              <li key={topic.href + topic.label}>
                <Link href={topic.href} className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-slate-50">
                  <topic.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-slate-900">{topic.label}</span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-slate-600">{topic.description}</span>
                  </span>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </PortalCard>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <PortalCard title="Portal pages" description="Everything you can do from your account">
            <ul className="divide-y divide-slate-200">
              {PORTAL_PAGES.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-slate-900">{page.label}</span>
                      <span className="mt-0.5 block text-[12px] leading-relaxed text-slate-500">{page.description}</span>
                    </span>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </PortalCard>

          <div className="space-y-5">
            <PortalCard title="Contact us">
              <div className="px-5 py-4">
                <p className="text-[13px] leading-relaxed text-slate-700">
                  The fastest route is a message on your file, because your counselor can see your applications and
                  documents.
                </p>
                <Button asChild className="mt-3 h-9 w-full rounded-button bg-alo-cta px-4 text-[13px] font-semibold text-white hover:bg-orange-500">
                  <Link href="/student/messages">
                    <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
                    Message Your Counselor
                  </Link>
                </Button>

                <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                  General enquiries
                </p>
                <a
                  href="mailto:info@aloeducation.com"
                  className="mt-1.5 flex items-center gap-2 text-[13px] font-semibold text-alo-blue hover:underline"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  info@aloeducation.com
                </a>
              </div>
            </PortalCard>

            <PortalCard title="Before you ask">
              <div className="space-y-3 px-5 py-4 text-[13px] leading-relaxed text-slate-700">
                <p>
                  <span className="font-semibold">Deadlines move.</span> Always check the date on your application page
                  rather than an older email.
                </p>
                <p>
                  <span className="font-semibold">Official rules change.</span> Visa and entry requirements are set by
                  the destination government. Confirm them with the official immigration source before you rely on
                  anything written here or by us.
                </p>
                <p>
                  <span className="font-semibold">Nothing is guaranteed.</span> Admission decisions rest with the
                  university, and visa decisions with the government. We prepare your file; we cannot decide the
                  outcome.
                </p>
              </div>
            </PortalCard>
          </div>
        </div>
      </div>
    </div>
  );
}
