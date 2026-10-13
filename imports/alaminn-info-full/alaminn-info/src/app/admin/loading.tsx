/**
 * Admin loading.tsx — shown during server-component streaming for the
 * /admin/* segment. Mirrors the admin shell's compact, dense aesthetic.
 */
export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center bg-background p-6"
      role="status"
      aria-live="polite"
      aria-label="Loading admin section"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs font-medium text-muted-foreground">
          Loading admin…
        </p>
      </div>
    </div>
  );
}
