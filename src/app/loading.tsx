export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--alo-page)]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-info)] text-white shadow-lg">
          <span className="text-2xl font-black">A</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-5 animate-spin rounded-full border-2 border-[var(--alo-brand)] border-t-transparent" />
          <span className="text-sm font-medium text-[var(--alo-text-muted)]">Loading ALO Education...</span>
        </div>
      </div>
    </div>
  );
}
