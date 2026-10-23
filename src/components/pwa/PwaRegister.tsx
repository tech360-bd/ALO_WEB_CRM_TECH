"use client";

import { useEffect, useState } from "react";

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if already installed / standalone
    const checkStandalone = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    };
    checkStandalone();

    // Register service worker
    const registerWorker = () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((reg) => {
            console.log("[PWA] SW registered:", reg.scope);
            reg.addEventListener("updatefound", () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    setUpdateAvailable(true);
                  }
                });
              }
            });
          })
          .catch((err) => console.warn("[PWA] SW registration failed:", err));
      }
    };
    if (document.readyState === 'complete') registerWorker();
    else window.addEventListener('load', registerWorker, { once: true });

    // Capture beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
      console.log("[PWA] beforeinstallprompt captured");
    };

    const handleAppInstalled = () => {
      console.log("[PWA] App installed");
      setShowInstall(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener('load', registerWorker);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (updateAvailable) return (
    <div role="status" className="fixed bottom-4 left-4 z-[9999] max-w-sm rounded-xl border border-emerald-200 bg-white p-4 shadow-xl">
      <p className="text-sm text-[var(--alo-text)]">A website update is ready. Save your work, then refresh.</p>
      <div className="mt-3 flex gap-3">
        <button className="min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white" onClick={() => window.location.reload()}>Refresh</button>
        <button className="min-h-11 px-3 text-sm text-[var(--alo-body)]" onClick={() => setUpdateAvailable(false)}>Later</button>
      </div>
    </div>
  );
  if (isStandalone || !showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-[9999] bg-white dark:bg-slate-900 border border-[var(--alo-border)] dark:border-slate-800 rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-4">
      <div className="flex gap-3">
        <div className="h-12 w-12 rounded-xl bg-[var(--alo-brand)] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          ALO
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--alo-text)] dark:text-white text-sm">Install ALO Education</h4>
          <p className="text-xs text-[var(--alo-body)] dark:text-[var(--alo-text-muted)] mt-0.5 leading-relaxed">
            Add ALO Education to your home screen. An internet connection is required for your portal and documents.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Install App
            </button>
            <button
              onClick={() => setShowInstall(false)}
              className="px-3 py-2 bg-[var(--alo-surface-muted)] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--alo-body)] dark:text-[var(--alo-placeholder)] text-xs font-medium rounded-lg transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button onClick={() => setShowInstall(false)} className="text-[var(--alo-text-muted)] hover:text-[var(--alo-body)] dark:hover:text-[var(--alo-placeholder)] -mt-1">
          ✕
        </button>
      </div>
    </div>
  );
}

export function PwaMetaTags() {
  return null; // Metadata handled in layout.tsx
}
