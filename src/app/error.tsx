"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatePanel } from "@/components/ui/state-panel";

/**
 * Global error boundary (Master §14): semantic warning surface, an explicit
 * text explanation and a labelled retry. Colour is never the only channel.
 */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-alo-page p-4">
      <div className="w-full max-w-lg">
        <StatePanel
          tone="warning"
          title="Something went wrong"
          description="An unexpected error occurred. Please try again — your entered information is preserved where possible."
          role="alert"
          actions={
            <Button onClick={reset} className="bg-alo-brand text-white hover:bg-alo-brand-hover">
              <RefreshCw aria-hidden="true" className="size-4" />
              Try Again
            </Button>
          }
        />
      </div>
    </main>
  );
}
