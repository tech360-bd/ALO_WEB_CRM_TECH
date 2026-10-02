"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/alo/shared";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7FAFE] p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <Icon name="AlertTriangle" className="size-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-[#0B2447]">Something went wrong</h1>
        <p className="mt-2 text-sm text-[#5A7299]">
          An unexpected error occurred. Please try again.
        </p>
        {error?.message && (
          <p className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
            {error.message}
          </p>
        )}
        <Button
          onClick={reset}
          className="mt-6 bg-[#0B5ED7] text-white hover:bg-[#0052a3]"
        >
          <Icon name="RefreshCw" className="mr-2 size-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
