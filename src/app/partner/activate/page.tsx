'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function PartnerActivationPage() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  async function activate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const token = new URL(window.location.href).searchParams.get('token');
      const response = await fetch('/api/partner/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Activation failed');
      setDone(true); setPassword(''); setMessage(result.message);
      window.history.replaceState({}, '', '/partner/activate');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Activation could not be completed'); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-[70vh] items-center justify-center bg-[var(--alo-page)] px-4 py-16"><section className="w-full max-w-md rounded-3xl border border-[var(--alo-border)] bg-white p-8 shadow-sm">
    <h1 className="text-2xl font-bold text-[var(--alo-text)]">Activate your partner account</h1>
    <p className="mt-3 text-sm leading-6 text-[var(--alo-body)]">Set your own password to join your organisation’s ALO Education workspace.</p>
    {message && <p role="status" className="mt-4 text-sm text-[var(--alo-body)]">{message}</p>}
    {done ? <Link href="/partner/login" className="mt-6 inline-flex min- items-center rounded-xl bg-[var(--alo-brand)] px-5 font-semibold text-white">Sign in</Link> : <form onSubmit={activate} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-[var(--alo-body)]">New password<input type="password" required minLength={10} maxLength={128} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--alo-border-strong)] px-3" /></label>
      <button disabled={busy} className="min-h-11 w-full rounded-xl bg-[var(--alo-brand)] px-5 py-3 font-semibold text-white disabled:opacity-60">{busy ? 'Activating…' : 'Activate account'}</button>
    </form>}
  </section></main>;
}
