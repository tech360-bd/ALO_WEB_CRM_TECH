/**
 * Root error.tsx — catches runtime errors thrown by the root segment
 * (anywhere under src/app/ that is not /admin, /higher-study, or
 * /english-learning which have their own error boundaries).
 *
 * Renders inside the root layout (fonts, ThemeProvider, Navbar/Footer
 * still active), so it just needs to replace {children} with a friendly
 * message + Try again button.
 *
 * Must be a client component (Next.js requirement for error.tsx).
 */
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to the browser console for debugging — in
    // production this is silent to end users but useful to developers
    // tailing logs.
    console.error("Root error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          An unexpected error occurred while rendering this page. You can try
          again, or head back to the home page. If the problem persists, please
          reach out via the contact page.
        </p>
        {error?.digest ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
