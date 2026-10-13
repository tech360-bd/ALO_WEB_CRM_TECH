/**
 * English Learning loading.tsx — shown during server-component
 * streaming for any /english-learning/* route (e.g. while fetching
 * courses, practice tests, or tutor profiles from Prisma).
 */
export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center px-6 py-16"
      role="status"
      aria-live="polite"
      aria-label="Loading English Learning section"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        <p className="text-xs font-medium text-ink-600">
          Loading English Learning…
        </p>
      </div>
    </div>
  );
}
