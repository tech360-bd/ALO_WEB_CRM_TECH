'use client';

import Link from 'next/link';
import { Card, Empty, ErrorBox, Loading, Pill, formatDate, useApi } from '../ui';

interface DashboardResponse {
  dashboard: {
    project: { id: string; title: string; createdAt: string };
    metrics: {
      topics: number;
      verifiedSources: number;
      totalSources: number;
      proposals: number;
      pendingResponses: number;
      applications: number;
      unreadNotifications: number;
      supervisorMatches: number;
      verifiedSupervisors: number;
      verifiedProgrammes: number;
      universities: number;
      verifiedResearchPages: number;
      pendingCommission: number;
      openVerification: number;
      expiredDeadlines: number;
      statements: number;
      statementsAwaitingReview: number;
    };
    proposals: Array<{ id: string; title: string; status: string; updatedAt: string; currentVersion: number }>;
    statements: Array<{
      id: string;
      title: string;
      status: string;
      version: number;
      updatedAt: string;
      university: { name: string } | null;
    }>;
    applications: Array<{
      status: string;
      fundingStatus: string;
      university: { name: string } | null;
      programme: { name: string } | null;
      nextAction: string;
      nextActionDueAt: string | null;
    }>;
    deadlines: Array<{
      id: string;
      title: string;
      kind: string;
      dueDate: string | null;
      sourceUrl: string | null;
      verificationStatus: string;
      assessment: { status: string; label: string; isExpired: boolean; isOpen: boolean; needsVerification: boolean; daysRemaining: number | null };
    }>;
    isEmpty: boolean;
  };
}

const QUICK_LINKS = [
  { href: '/student/phd/profile', label: 'Complete your academic profile' },
  { href: '/student/phd/topics', label: 'Explore research topics' },
  { href: '/student/phd/proposals', label: 'Draft a research proposal' },
  { href: '/student/phd/supervisors', label: 'Check supervisor fit' },
  { href: '/student/phd/funding', label: 'Track funding and deadlines' },
  { href: '/research-opportunities', label: 'Browse verified research programmes' },
];

export default function DashboardPanel() {
  const { data, error, loading } = useApi<DashboardResponse>('/api/phd/dashboard');

  if (loading) return <Loading label="Loading your research workspace…" />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return <Empty title="No workspace data" hint="Reload the page to try again." />;

  const dashboard = data.dashboard;
  const metrics = dashboard.metrics;

  const cards = [
    { label: 'Topic candidates', value: metrics.topics },
    { label: 'Verified sources', value: metrics.verifiedSources, hint: `${metrics.totalSources} recorded in total` },
    { label: 'Proposals', value: metrics.proposals },
    { label: 'Statements of purpose', value: metrics.statements },
    { label: 'Statements waiting for approval', value: metrics.statementsAwaitingReview },
    { label: 'Applications', value: metrics.applications },
    { label: 'Awaiting supervisor reply', value: metrics.pendingResponses },
    { label: 'Unread notifications', value: metrics.unreadNotifications },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card
        title={`${dashboard.project.title}`}
        description="Every figure below is a live database count for your own workspace — no sample data is used."
        className="lg:col-span-2"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl bg-[var(--alo-page)] p-3">
              <p className="text-2xl font-bold text-[var(--alo-text)]">{card.value}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">{card.label}</p>
              {card.hint && <p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{card.hint}</p>}
            </div>
          ))}
        </div>

        {dashboard.isEmpty ? (
          <div className="mt-4">
            <Empty
              title="Your workspace is empty — start with your academic profile"
              hint="Topic suggestions, supervisor fit and proposal checks all depend on the qualifications and preferences you record."
            />
          </div>
        ) : (
          <div className="mt-4 space-y-2 text-xs text-[var(--alo-body)]">
            <p>
              <span className="font-semibold text-[var(--alo-text)]">{metrics.verifiedResearchPages}</span> of{' '}
              {metrics.universities} target universities have a verified research-degrees page ·{' '}
              <span className="font-semibold text-[var(--alo-text)]">{metrics.verifiedProgrammes}</span> verified programmes
              · <span className="font-semibold text-[var(--alo-text)]">{metrics.verifiedSupervisors}</span> verified
              supervisors in the directory.
            </p>
            <p className="text-[11px] text-[var(--alo-text-muted)]">
              A programme that is not listed is not yet verified — it is not evidence that the programme does not exist.
            </p>
          </div>
        )}
      </Card>

      <Card title="Start here">
        <ul className="space-y-2 text-sm">
          {QUICK_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="font-medium text-[var(--alo-brand)] underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Upcoming deadlines" description="Assessed from recorded dates only. Expired deadlines are excluded here.">
        {dashboard.deadlines.length === 0 ? (
          <Empty title="No dated deadlines" hint="Add a deadline from the funding section once you have an official date." />
        ) : (
          <ul className="space-y-2 text-xs">
            {dashboard.deadlines.map((deadline) => (
              <li key={deadline.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--alo-border)]/60 pb-2">
                <span>
                  <span className="font-semibold text-[var(--alo-text)]">{deadline.title}</span>
                  <span className="ml-2 text-[var(--alo-text-muted)]">{deadline.kind}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span>{formatDate(deadline.dueDate)}</span>
                  <Pill
                    tone={
                      deadline.assessment.needsVerification
                        ? 'warn'
                        : deadline.verificationStatus === 'VERIFIED_OFFICIAL'
                          ? 'ok'
                          : 'default'
                    }
                  >
                    {deadline.assessment.label}
                  </Pill>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Statements of purpose"
        description="One statement per programme. Drafts are built only from facts you supplied; approval is required before a final export."
      >
        {dashboard.statements.length === 0 ? (
          <Empty
            title="No statement yet"
            hint="Open the SOP builder to create one for a verified programme."
          />
        ) : (
          <ul className="space-y-2 text-xs">
            {dashboard.statements.map((statement) => (
              <li key={statement.id} className="border-b border-[var(--alo-border)]/60 pb-2">
                <p className="font-semibold text-[var(--alo-text)]">
                  {statement.university?.name ?? statement.title}
                </p>
                <p className="text-[var(--alo-text-muted)]">
                  v{statement.version} · {statement.status.replace(/_/g, ' ').toLowerCase()} ·{' '}
                  {formatDate(statement.updatedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px]">
          <Link href="/student/phd/sop" className="font-semibold text-[var(--alo-brand)] underline">
            Open the SOP builder
          </Link>
        </p>
      </Card>

      <Card title="Recent proposals">
        {dashboard.proposals.length === 0 ? (
          <Empty title="No proposals yet" hint="Create one from the Proposal builder; it starts with the 20 required sections." />
        ) : (
          <ul className="space-y-2 text-xs">
            {dashboard.proposals.map((proposal) => (
              <li key={proposal.id} className="border-b border-[var(--alo-border)]/60 pb-2">
                <p className="font-semibold text-[var(--alo-text)]">{proposal.title}</p>
                <p className="text-[var(--alo-text-muted)]">
                  v{proposal.currentVersion} · {proposal.status.replace(/_/g, ' ').toLowerCase()} · {formatDate(proposal.updatedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Applications" description="A shortlisted programme sits here with the Researching status.">
        {dashboard.applications.length === 0 ? (
          <Empty title="No applications" hint="Add a verified programme from the research directory to start tracking it." />
        ) : (
          <ul className="space-y-2 text-xs">
            {dashboard.applications.map((application, index) => (
              <li key={index} className="border-b border-[var(--alo-border)]/60 pb-2">
                <p className="font-semibold text-[var(--alo-text)]">{application.programme?.name ?? 'Programme'}</p>
                <p className="text-[var(--alo-text-muted)]">
                  {application.university?.name ?? 'University'} · {application.status.replace(/_/g, ' ').toLowerCase()} ·
                  funding {application.fundingStatus.replace(/_/g, ' ').toLowerCase()}
                </p>
                {application.nextAction && (
                  <p className="mt-1 text-[var(--alo-body)]">
                    Next: {application.nextAction} {application.nextActionDueAt ? `(${formatDate(application.nextActionDueAt)})` : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
