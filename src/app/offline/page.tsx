import RetryConnectionButton from "./RetryConnectionButton";

export const metadata = {
  title: "Offline — ALO Education",
  description: "You are offline. Cached content available.",
};

export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📡</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">You are offline</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          No internet connection. Some cached pages and CRM data may still be available. Your actions will sync when you reconnect.
        </p>
        <div className="space-y-3">
          <RetryConnectionButton />
          <a
            href="/"
            className="block w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors"
          >
            Go to Home (Cached)
          </a>
        </div>
        <p className="text-xs text-slate-400 mt-6">ALO Education PWA • Offline Ready</p>
      </div>
    </div>
  );
}
