import CommunicationInbox from '@/components/communication/CommunicationInbox';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unified Inbox — Communication Engine | ALO Education',
  description: 'Enterprise unified inbox — Message ID, Channel, Source, Sender, Recipient, Linked entities, Priority, Intent, Visibility, Status, SLA timer, Actions',
};

export default function CommunicationsInboxPage() {
  return (
    <div className="p-4 lg:p-6 bg-[var(--alo-page)] min-h-screen">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[var(--alo-text)]">Unified Inbox — <span className="text-[var(--alo-brand)]">/crm/communications/inbox</span></h1>
        <p className="text-xs text-[var(--alo-text-muted)] mt-1">Message ID • Channel • Source • Sender • Recipient • Linked lead/student/application/partner • Assigned to • Priority • Intent • Visibility • Status • SLA timer • Created date • Last reply • Action — 10x enterprise view, SLA-sorted, Asia/Dhaka office hours aware</p>
      </div>
      <CommunicationInbox canViewB2B={false} />
      <div className="mt-6 text-[11px] text-[var(--alo-text-muted)] border-t pt-3">
        Filters: Channel, Source, Office, Counselor, Assigned staff, Student, Partner, Application, Country, Course, Status, Unread, SLA overdue, Priority, Date range, B2B confidential, Marketing lead, Visa related, Document related — Actions: Reply, Use template, AI draft reply, Assign, Escalate, Create lead, Link to student, Link to application, Create task, Schedule follow-up, Mark read, Mark spam, Archive, Add note
      </div>
    </div>
  );
}
