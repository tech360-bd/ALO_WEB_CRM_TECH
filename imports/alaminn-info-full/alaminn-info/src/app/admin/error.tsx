/**
 * Admin error.tsx — catches runtime errors thrown by any /admin/*
 * route. Renders inside the admin layout (AdminShell sidebar still
 * visible) so the user can recover without losing their place.
 *
 * Must be a client component (Next.js requirement for error.tsx).
 */
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background p-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          Admin error
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Something went wrong while loading this section of the Command Center.
          You can retry, or head back to the dashboard.
        </p>
        {error?.digest ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
