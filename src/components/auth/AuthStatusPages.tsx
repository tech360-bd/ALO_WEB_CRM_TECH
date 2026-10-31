'use client';

import { Button } from '@/components/ui/button';
import { usePortalStore } from '@/lib/stores/portal-store';
import { XCircle, Clock, ShieldOff, GraduationCap, ArrowLeft } from 'lucide-react';

export function AccountSuspended() {
  const { authMessage, setView } = usePortalStore();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-crm-danger-bg flex items-center justify-center mb-6">
          <XCircle className="w-8 h-8 text-crm-danger-text" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-[var(--alo-text)] mb-3">Account Suspended</h2>

        {/* Message */}
        <p className="text-sm text-[var(--alo-text-muted)] leading-relaxed mb-8">
          {authMessage ||
            'Your account has been suspended. Please contact ALO Education support for assistance.'}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="brand"
            size="lg"
            className="w-full"
            onClick={() => setView('portals')}
          >
            Contact Support
          </Button>

          <button
            type="button"
            onClick={() => setView('portals')}
            className="inline-flex items-center justify-center gap-1.5 text-sm text-alo-brand hover:underline transition-colors w-full py-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portals
          </button>
        </div>

        {/* Logo footer */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-alo-brand">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-alo-brand text-sm font-semibold tracking-tight">
            ALO Education
          </span>
        </div>
      </div>
    </div>
  );
}

export function AccountPending() {
  const { setView } = usePortalStore();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-crm-warning-bg flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-crm-warning-text" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-[var(--alo-text)] mb-3">
          Account Pending Approval
        </h2>

        {/* Message */}
        <p className="text-sm text-[var(--alo-text-muted)] leading-relaxed mb-8">
          Your account is currently under review. You will be notified once your
          account is approved and ready to use.
        </p>

        {/* Back link */}
        <button
          type="button"
          onClick={() => setView('portals')}
          className="inline-flex items-center justify-center gap-1.5 text-sm text-alo-brand hover:underline transition-colors w-full py-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portals
        </button>

        {/* Logo footer */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-alo-brand">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-alo-brand text-sm font-semibold tracking-tight">
            ALO Education
          </span>
        </div>
      </div>
    </div>
  );
}

export function Unauthorized() {
  const { setView } = usePortalStore();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-crm-danger-bg flex items-center justify-center mb-6">
          <ShieldOff className="w-8 h-8 text-crm-danger-text" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-[var(--alo-text)] mb-3">Access Denied</h2>

        {/* Message */}
        <p className="text-sm text-[var(--alo-text-muted)] leading-relaxed mb-8">
          You do not have permission to access this resource. If you believe this
          is an error, contact your administrator.
        </p>

        {/* Back link */}
        <button
          type="button"
          onClick={() => setView('portals')}
          className="inline-flex items-center justify-center gap-1.5 text-sm text-alo-brand hover:underline transition-colors w-full py-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portals
        </button>

        {/* Logo footer */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-alo-brand">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-alo-brand text-sm font-semibold tracking-tight">
            ALO Education
          </span>
        </div>
      </div>
    </div>
  );
}