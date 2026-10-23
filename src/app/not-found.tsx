import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--alo-page)] p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
          <span className="text-4xl font-black">404</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-[var(--alo-text)]">Page Not Found</h1>
        <p className="mt-2 text-sm text-[var(--alo-text-muted)]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-xl bg-[var(--alo-brand)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--alo-brand-hover)]"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
