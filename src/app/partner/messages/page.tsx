'use client';

// /partner/messages — partner portal inbox (linked from the partner dashboard
// communication widget). Renders the existing PartnerMessagesPage component
// (same implementation as the homepage portal view 'partner-messages'); no
// duplicate system, one source of truth.
import PartnerMessagesPage from '@/components/partner/PartnerMessagesPage';
import { usePortalStore } from '@/lib/stores/portal-store';

export default function PartnerMessagesRoute() {
  const user = usePortalStore((state) => state.user);
  return (
    <div className="min-h-screen bg-[var(--alo-page)]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--alo-text)]">Partner Messages</h1>
            <p className="text-xs text-[var(--alo-text-muted)] mt-1">
              Secure inbox with ALO staff — {user?.name || user?.email || 'partner account'}
            </p>
          </div>
          <a href="/partner/dashboard" className="text-sm text-[var(--alo-brand)] hover:underline font-medium">
            ← Back to Dashboard
          </a>
        </div>
        <PartnerMessagesPage />
      </div>
    </div>
  );
}
