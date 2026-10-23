"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/alo/shared";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--alo-page)] p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <Icon name="AlertTriangle" className="size-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-[var(--alo-text)]">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--alo-text-muted)]">
          An unexpected error occurred. Please try again.
        </p>
        <Button
          onClick={reset}
          className="mt-6 bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)]"
        >
          <Icon name="RefreshCw" className="mr-2 size-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
