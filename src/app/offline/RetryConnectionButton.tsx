'use client';

// Interactive retry control for the offline page.
// The page itself stays a Server Component so it can export `metadata`.
export default function RetryConnectionButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="w-full py-3 bg-[#0057B8] hover:bg-[#004494] text-white font-semibold rounded-xl transition-colors"
    >
      Retry Connection
    </button>
  );
}
