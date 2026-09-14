import InboxPage from '@/app/crm/inbox/page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Communications Inbox | ALO Education',
  description: 'Unified inbox for WhatsApp, Email, SMS, Phone, Social, Portal, Internal',
};

// Route mapping: /crm/communications/inbox is the canonical spec route.
// It reuses the existing /crm/inbox implementation which already provides
// unified threads, SLA, channel filtering, and permission scoping.
export default function CommunicationsInboxPage() {
  return <InboxPage />;
}
