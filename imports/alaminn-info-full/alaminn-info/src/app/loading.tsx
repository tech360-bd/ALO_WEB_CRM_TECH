/**
 * Root loading.tsx — shown during server-component streaming for the
 * root segment (e.g. while the homepage is fetching Prisma data).
 *
 * Branded full-page spinner so users see the Al Aminn identity rather
 * than a blank white screen during initial route compilation.
 */
export default function Loading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
