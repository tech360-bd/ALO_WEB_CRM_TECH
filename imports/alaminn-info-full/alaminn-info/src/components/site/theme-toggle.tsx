"use client";

import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compact three-state theme toggle: light · system · dark.
 * Mounted as a floating pill at bottom-center on `sm+` screens.
 *
 * Hydration-safe: subscribes to next-themes via an external store
 * (the html element's class attribute) so the server and client
 * first-paint render the same neutral skeleton, then the active
 * state is applied after mount without setState-in-effect.
 */

// External store: tracks whether the component has mounted on the client.
// The server snapshot returns false (skeleton); the client snapshot
// returns true after the first read. This is a stable pattern that
// does not trigger setState-in-effect lint warnings.
let mounted = false;
const mountListeners = new Set<() => void>();
function notifyMount() {
  mounted = true;
  mountListeners.forEach((l) => l());
}
function subscribeMount(listener: () => void) {
  mountListeners.add(listener);
  // Schedule mount notification via microtask so it fires after hydration
  if (!mounted) {
    queueMicrotask(notifyMount);
  }
  return () => {
    mountListeners.delete(listener);
  };
}
function getClientSnapshot() {
  return mounted;
}
function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isMounted = useSyncExternalStore(
    subscribeMount,
    getClientSnapshot,
    getServerSnapshot
  );
  // Local interaction state so we can optimistically update on click
  // before next-themes propagates the change.
  const [localOverride, setLocalOverride] = useState<
    "light" | "system" | "dark" | null
  >(null);

  const options: {
    id: "light" | "system" | "dark";
    icon: typeof Sun;
    label: string;
  }[] = [
    { id: "light", icon: Sun, label: "Light theme" },
    { id: "system", icon: Monitor, label: "System theme" },
    { id: "dark", icon: Moon, label: "Dark theme" },
  ];

  // Compute the active option WITHOUT triggering hydration mismatch:
  // - On the server (isMounted=false), we don't know the theme, so we
  //   render all buttons as inactive.
  // - On the client after mount, we use the theme from next-themes
  //   (or a local override if the user just clicked).
  const active = isMounted
    ? (localOverride ?? (theme as "light" | "system" | "dark") ?? "system")
    : null;

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      suppressHydrationWarning
      className="inline-flex h-10 items-center gap-1 rounded-full border border-ink-200 bg-white/80 p-1 shadow-soft backdrop-blur transition-colors dark:border-white/10 dark:bg-ink-900/80"
    >
      {options.map((opt) => {
        const isActive = active === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={opt.label}
            title={opt.label}
            suppressHydrationWarning
            onClick={() => {
              setLocalOverride(opt.id);
              setTheme(opt.id);
            }}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full transition-all",
              isActive
                ? "bg-orange-600 text-white shadow-orange"
                : "text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:text-blue-200 dark:hover:bg-white/10"
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
      {isMounted && (
        <span className="sr-only">
          Current theme: {resolvedTheme ?? theme ?? "system"}
        </span>
      )}
    </div>
  );
}
