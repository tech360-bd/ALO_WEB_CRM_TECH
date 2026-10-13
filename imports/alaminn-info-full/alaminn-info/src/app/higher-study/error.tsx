/**
 * Higher Study error.tsx — catches runtime errors thrown by any
 * /higher-study/* route. Renders inside the HigherStudyShell so the
 * shared nav and footer remain usable.
 *
 * Must be a client component (Next.js requirement for error.tsx).
 */
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function HigherStudyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Higher Study error boundary:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
        <AlertTriangle className="h-6 w-6 text-orange-600" aria-hidden="true" />
      </div>
      <h1 className="font-display text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        An error occurred while loading this Higher Study page. You can try
        again, or head back to the Higher Study home to continue exploring
        universities, courses, scholarships and PhD opportunities.
      </p>
      {error?.digest ? (
        <p className="mt-3 font-mono text-xs text-ink-500">
          Error ID: {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          onClick={() => reset()}
          className="gap-2 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
        <Button
          asChild
          variant="outline"
          className="gap-2 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <Link href="/higher-study">
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to Higher Study
          </Link>
        </Button>
      </div>
    </div>
  );
}
