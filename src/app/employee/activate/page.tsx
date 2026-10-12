import { Suspense } from 'react';
import EmployeeActivationForm from './activation-form';

export const metadata = {
  title: 'Activate Employee Account | ALO Education',
  referrer: 'no-referrer',
};

export default function EmployeeActivationPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">ALO Education</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Activate your account</h1>
          <p className="mt-2 text-slate-600">Create a password to finish setting up your employee access.</p>
        </div>
        <Suspense fallback={<div className="rounded-xl border bg-white p-6 text-sm text-slate-600">Loading secure activation form…</div>}>
          <EmployeeActivationForm />
        </Suspense>
      </div>
    </main>
  );
}
