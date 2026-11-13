'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from './ui';
import DashboardPanel from './panels/DashboardPanel';
import ProfilePanel from './panels/ProfilePanel';
import TopicsPanel from './panels/TopicsPanel';
import ProposalPanel from './panels/ProposalPanel';
import SopPanel from './panels/SopPanel';
import SupervisorsPanel from './panels/SupervisorsPanel';
import ApplicationsPanel from './panels/ApplicationsPanel';
import FundingPanel from './panels/FundingPanel';
import DocumentsPanel from './panels/DocumentsPanel';
import TimelinePanel from './panels/TimelinePanel';
import VerificationPanel from './panels/VerificationPanel';

const SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'profile', label: 'Academic profile' },
  { key: 'topics', label: 'Topic discovery' },
  { key: 'proposals', label: 'Proposal builder' },
  { key: 'sop', label: 'SOP builder' },
  { key: 'supervisors', label: 'Supervisors' },
  { key: 'applications', label: 'Applications' },
  { key: 'funding', label: 'Funding & deadlines' },
  { key: 'documents', label: 'Documents' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'verification', label: 'Verification' },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

function currentSection(pathname: string): SectionKey {
  const segment = pathname.split('/').filter(Boolean).pop() ?? '';
  const match = SECTIONS.find((section) => section.key === segment);
  return match?.key ?? 'overview';
}

export default function PhdShell() {
  const pathname = usePathname() || '/student/phd';
  const section = currentSection(pathname);

  return (
    <div className="w-full pb-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">UK PhD Proposal Builder</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--alo-text)]">Research workspace</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--alo-body)]">
            Everything here is built from records you create and from sources we have checked. Where a fact is not
            verified, it is shown as unknown — never guessed.
          </p>
        </header>

        <nav aria-label="PhD workspace sections" className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {SECTIONS.map((item) => {
            const href = item.key === 'overview' ? '/student/phd' : `/student/phd/${item.key}`;
            const active = section === item.key;
            return (
              <Link
                key={item.key}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold',
                  active ? 'bg-[var(--alo-brand)] text-white' : 'border border-[var(--alo-border)] bg-white text-[var(--alo-body)]',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {section === 'overview' && <DashboardPanel />}
        {section === 'profile' && <ProfilePanel />}
        {section === 'topics' && <TopicsPanel />}
        {section === 'proposals' && <ProposalPanel />}
        {section === 'sop' && <SopPanel />}
        {section === 'supervisors' && <SupervisorsPanel />}
        {section === 'applications' && <ApplicationsPanel />}
        {section === 'funding' && <FundingPanel />}
        {section === 'documents' && <DocumentsPanel />}
        {section === 'timeline' && <TimelinePanel />}
        {section === 'verification' && <VerificationPanel />}
      </div>
    </div>
  );
}
