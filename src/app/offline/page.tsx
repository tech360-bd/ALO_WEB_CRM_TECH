import { WifiOff } from 'lucide-react';
import RetryConnectionButton from "./RetryConnectionButton";

export const metadata = {
  title: "Offline — ALO Education",
  description: "You are offline. Cached content available.",
};

export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-[var(--alo-page)] dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-[var(--alo-border)] dark:border-slate-800 p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="flex size-12 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]"><WifiOff className="size-6" /></span>
        </div>
        <h1 className="text-xl font-bold text-[var(--alo-text)] dark:text-white mb-2">You are offline</h1>
        <p className="text-sm text-[var(--alo-body)] dark:text-[var(--alo-text-muted)] mb-6 leading-relaxed">
          No internet connection. Some cached pages and CRM data may still be available. Your actions will sync when you reconnect.
        </p>
        <div className="space-y-3">
          <RetryConnectionButton />
          <a
            href="/"
            className="block w-full py-3 bg-[var(--alo-surface-muted)] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--alo-body)] dark:text-[var(--alo-placeholder)] font-medium rounded-xl transition-colors"
          >
            Go to Home (Cached)
          </a>
        </div>
        <p className="text-xs text-[var(--alo-text-muted)] mt-6">ALO Education PWA • Offline Ready</p>
      </div>
    </div>
  );
}
