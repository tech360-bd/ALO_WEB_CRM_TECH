'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SocialAccountActions({ connected, accountId }: { connected: boolean; accountId?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function disconnect() {
    if (!accountId || busy) return;
    if (!window.confirm('Disconnect this account locally? Provider-side revocation must be completed separately.')) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/communications/social-accounts/${encodeURIComponent(accountId)}`, { method: 'DELETE' });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || 'Account could not be disconnected.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Account could not be disconnected.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled title="OAuth token exchange and live provider verification are not configured" className="cursor-not-allowed rounded bg-[var(--alo-page)] px-3 py-1.5 text-xs text-[var(--alo-body)]">
          Connect OAuth — unavailable
        </button>
        <button type="button" disabled title="Official-access request workflow is not implemented" className="cursor-not-allowed rounded border px-3 py-1.5 text-xs text-[var(--alo-text-muted)]">
          Request Official Access — unavailable
        </button>
        {connected && accountId ? (
          <button type="button" onClick={disconnect} disabled={busy} className="rounded border border-crm-danger-border px-3 py-1.5 text-xs text-crm-danger-text disabled:opacity-50">
            {busy ? 'Disconnecting…' : 'Disconnect'}
          </button>
        ) : null}
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-crm-danger-text">{error}</p> : null}
    </div>
  );
}
