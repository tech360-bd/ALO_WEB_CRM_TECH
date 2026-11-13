'use client';

/**
 * Student journey timeline — /student/timeline
 *
 * Reads GET /api/student-portal/timeline, which returns the persisted
 * TimelineEvent rows for the authenticated student in reverse-chronological
 * order. Events are grouped by stage so the journey reads as a progression.
 */

import { Clock } from 'lucide-react';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  StatusBadge, useStudentResource,
} from '@/components/student/portal-section';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  stage: string;
  title: string;
  description: string;
  actor: string;
  type: string;
  createdAt: string;
}

const STAGE_ORDER = [
  'enquiry', 'consultation', 'application', 'offer', 'acceptance',
  'payment', 'cas', 'visa', 'pre-departure', 'departure', 'arrival', 'referral',
];

function stageLabel(stage: string): string {
  return stage.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function sortStages(stages: string[]): string[] {
  return [...stages].sort((a, b) => {
    const ia = STAGE_ORDER.indexOf(a);
    const ib = STAGE_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export default function StudentTimeline() {
  const { data, state, error, reload } = useStudentResource<{ data: TimelineEvent[] }>('/api/student-portal/timeline');

  const events = data?.data ?? [];
  const byStage = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const key = event.stage || 'general';
    const list = byStage.get(key);
    if (list) list.push(event);
    else byStage.set(key, [event]);
  }
  const stages = sortStages(Array.from(byStage.keys()));

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <PortalPageHeader
          title="My Journey Timeline"
          description="Everything that has happened on your applications, in order."
        />

        {state === 'loading' && <PortalLoading label="Loading your timeline…" />}

        {state === 'error' && <PortalError message={error ?? 'Your timeline could not be loaded.'} onRetry={reload} />}

        {state === 'ready' && events.length === 0 && (
          <PortalCard>
            <PortalEmpty
              title="Your journey has not started yet"
              description="Once you book a consultation or begin an application, every step is recorded here."
            />
          </PortalCard>
        )}

        {state === 'ready' && events.length > 0 && (
          <div className="space-y-5">
            {stages.map((stage) => {
              const stageEvents = byStage.get(stage) ?? [];
              return (
                <section key={stage}>
                  <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--alo-text-muted)]">
                    <span className="h-px flex-1 bg-[var(--alo-page)]" aria-hidden="true" />
                    {stageLabel(stage)}
                    <span className="h-px flex-1 bg-[var(--alo-page)]" aria-hidden="true" />
                  </h2>

                  <PortalCard>
                    <ol className="relative divide-y divide-[var(--alo-border)]">
                      {stageEvents.map((event) => (
                        <li key={event.id} className="relative flex gap-3 px-5 py-4">
                          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--alo-text-muted)]" aria-hidden="true" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-[var(--alo-text)]">{event.title}</p>
                            {event.description && (
                              <p className="mt-1 text-[13px] leading-relaxed text-[var(--alo-body)]">{event.description}</p>
                            )}
                            <p className="mt-1.5 text-[12px] text-[var(--alo-text-muted)]">
                              {new Date(event.createdAt).toLocaleString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                              {event.actor && event.actor !== 'system' ? ` · ${event.actor}` : ''}
                            </p>
                          </div>
                          {event.type && (
                            <div className="shrink-0">
                              <StatusBadge value={event.type} />
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  </PortalCard>
                </section>
              );
            })}

            <p className={cn('text-[12px] leading-relaxed text-[var(--alo-text-muted)]')}>
              This timeline records what has already happened. Upcoming deadlines appear on your Tasks page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
