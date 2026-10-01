import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7FAFE] p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#0B5ED7]">
          <span className="text-4xl font-black">404</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-[#0B2447]">Page Not Found</h1>
        <p className="mt-2 text-sm text-[#5A7299]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-xl bg-[#0B5ED7] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0052a3]"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
