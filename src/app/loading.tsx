import { LoadingState } from "@/components/ui/state-panel";

/**
 * Global loading state (Master §14): stable dimensions, visible spinner and
 * a text label. No fake progress percentage and no invented content.
 */
export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-alo-page p-4">
      <div className="w-full max-w-lg">
        <LoadingState label="Loading ALO Education…" />
      </div>
    </main>
  );
}
