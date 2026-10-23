'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ActivationForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (token && typeof window !== 'undefined') {
      // Keep the one-time bearer out of subsequent same-origin navigation and
      // copied address-bar URLs after React has captured it for submission.
      window.history.replaceState(null, '', '/employee/activate');
    }
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!token) return setError('This activation link is missing its token. Ask HR to send a new link.');
    if (password !== confirmation) return setError('The passwords do not match.');
    setBusy(true);
    try {
      const response = await fetch('/api/employee/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error || 'Activation failed. Ask HR to send a new link if it has expired.');
        return;
      }
      setDone(true);
    } catch {
      setError('Activation service is unavailable. Please try again later.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-emerald-800">Account activated</h2>
        <p className="mt-2 text-[var(--alo-body)]">Your password is set. You can now sign in to the employee portal.</p>
        <a className="mt-5 inline-flex rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800" href="/employee/login">Go to employee login</a>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
      {!token && <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">No activation token was found in this link. Ask HR to send a new one.</p>}
      <div>
        <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-[var(--alo-text)]">Create password</label>
        <input id="new-password" autoComplete="new-password" type="password" minLength={8} maxLength={200} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-md border px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        <p className="mt-1 text-xs text-[var(--alo-text-muted)]">At least 8 characters, including one uppercase letter and one number.</p>
      </div>
      <div>
        <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-[var(--alo-text)]">Confirm password</label>
        <input id="confirm-password" autoComplete="new-password" type="password" minLength={8} maxLength={200} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-md border px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
      </div>
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button disabled={busy || !token} type="submit" className="w-full rounded-md bg-blue-700 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? 'Activating…' : 'Activate account'}
      </button>
    </form>
  );
}

export default function EmployeeActivationForm() {
  return <Suspense fallback={<div className="rounded-xl border bg-white p-6 text-sm text-[var(--alo-body)]">Loading activation form…</div>}><ActivationForm /></Suspense>;
}
