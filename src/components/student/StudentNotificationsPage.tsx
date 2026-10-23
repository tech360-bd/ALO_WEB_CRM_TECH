'use client';

/**
 * Student notifications — /student/notifications
 *
 * Reads GET /api/student/notifications and marks items read through the
 * matching PATCH. The API owns the student ownership check on both calls.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  useStudentResource,
} from '@/components/student/portal-section';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  priority: string;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unread: number;
}

const TYPE_LABELS: Record<string, string> = {
  APPLICATION_SUBMITTED: 'Application',
  DOCUMENT_APPROVED: 'Document',
  DOCUMENT_REJECTED: 'Document',
  OFFER_RECEIVED: 'Offer',
  CAS_ISSUED: 'CAS',
  VISA_UPDATE: 'Visa',
  MESSAGE: 'Message',
  APPOINTMENT: 'Appointment',
  PAYMENT: 'Payment',
  DEADLINE: 'Deadline',
  REFERRAL: 'Referral',
  SYSTEM: 'System',
};

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: 'border-red-200 bg-red-50 text-red-700',
  HIGH: 'border-amber-200 bg-amber-50 text-amber-700',
  NORMAL: 'border-[var(--alo-border)] bg-[var(--alo-page)] text-[var(--alo-body)]',
  LOW: 'border-[var(--alo-border)] bg-[var(--alo-page)] text-[var(--alo-text-muted)]',
};

export default function StudentNotifications() {
  const { data, state, error, reload } = useStudentResource<NotificationsResponse>('/api/student/notifications');
  const [marking, setMarking] = useState<string | null>(null);

  const notifications = data?.notifications ?? [];

  async function markRead(id: string) {
    setMarking(id);
    try {
      const response = await fetch('/api/student/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      if (!response.ok) throw new Error('Could not mark that notification as read');
      await reload();
    } catch {
      setMarking(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <PortalPageHeader
          title="Notifications"
          description="Updates on your applications, documents, visa and payments."
          action={
            data && data.unread > 0 ? (
              <span className="rounded-full border border-[var(--alo-cta)]/25 bg-[var(--alo-cta-soft)] px-3 py-1 text-[12px] font-semibold text-[var(--alo-cta-active)]">
                {data.unread} unread
              </span>
            ) : undefined
          }
        />

        {state === 'loading' && <PortalLoading label="Loading your notifications…" />}

        {state === 'error' && <PortalError message={error ?? 'Your notifications could not be loaded.'} onRetry={reload} />}

        {state === 'ready' && notifications.length === 0 && (
          <PortalCard>
            <PortalEmpty
              title="Nothing here yet"
              description="Updates about your applications, documents and visa will appear as they happen."
            />
          </PortalCard>
        )}

        {state === 'ready' && notifications.length > 0 && (
          <PortalCard>
            <ul className="divide-y divide-[var(--alo-border)]">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn('flex flex-wrap items-start gap-3 px-5 py-4', !notification.isRead && 'bg-[var(--alo-brand-pale)]/40')}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!notification.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-alo-brand" aria-label="Unread" />}
                      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--alo-text-muted)]">
                        {TYPE_LABELS[notification.type] ?? notification.type}
                      </span>
                      {notification.priority && notification.priority !== 'NORMAL' && (
                        <span className={cn(
                          'rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]',
                          PRIORITY_STYLES[notification.priority] ?? PRIORITY_STYLES.NORMAL,
                        )}>
                          {notification.priority}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[13px] font-semibold text-[var(--alo-text)]">{notification.title}</p>
                    {notification.message && (
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--alo-body)]">{notification.message}</p>
                    )}
                    <p className="mt-1.5 text-[12px] text-[var(--alo-text-muted)]">
                      {new Date(notification.createdAt).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    {notification.actionUrl && (
                      <Link
                        href={notification.actionUrl}
                        className="mt-2 inline-block text-[13px] font-semibold text-alo-brand hover:underline"
                      >
                        Open related item
                      </Link>
                    )}
                  </div>

                  {!notification.isRead && (
                    <Button
 type="button"
 variant="outline"
 className=" shrink-0 rounded-button border-[var(--alo-border)] px-3 text-[12px] font-semibold"
 onClick={() => markRead(notification.id)}
                      disabled={marking === notification.id}
                    >
                      {marking === notification.id
                        ? <CheckCheck className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
                        : <Bell className="h-3.5 w-3.5" aria-hidden="true" />}
                      <span className="ml-1.5">{marking === notification.id ? 'Marking…' : 'Mark Read'}</span>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </PortalCard>
        )}
      </div>
    </div>
  );
}
