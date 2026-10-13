"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (/public/sw.js) for offline PWA support.
 * - Only runs in production (NODE_ENV=production) to avoid caching dev assets.
 * - Skips if service workers aren't supported (older Safari, etc.).
 * - Logs registration success/failure to console (silent in production).
 *
 * Mounted once at the root layout level.
 */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Silent — SW failure should never break the page
        });
    };

    // Register after window load to avoid competing with first paint
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
