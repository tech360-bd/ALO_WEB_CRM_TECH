"use client";

import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { SearchPalette } from "./search-palette";
import { ScheduleMeetingModal } from "./schedule-meeting-modal";
import { ThemeToggle } from "./theme-toggle";
import { useOpenCommandCenter } from "./command-center-bridge";
import { WhatsAppChatWidget } from "./whatsapp/whatsapp-chat-widget";

/**
 * Top-level client chrome that wires together global keyboard shortcuts,
 * the command palette, the schedule-meeting modal, the skip-to-content
 * link, and the theme toggle.  Mounted once in app/page.tsx inside the
 * CommandCenterBridge so it can imperatively open the Command Center.
 */
export function SiteChrome() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const openCommandCenter = useOpenCommandCenter();

  // Check session on mount so we can hide staff-only actions (e.g. the
  // "Open Command Center" entry in the search palette) from the public.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/auth/session", { credentials: "include" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json?.success && json?.data?.user?.role) {
          setIsAuthed(true);
        }
      } catch {
        // ignore — treated as not authed
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Global keyboard shortcuts:
  //   ⌘K / Ctrl+K  → open command palette
  //   ⌘J / Ctrl+J  → open schedule meeting
  // (The Command Center has its own discreet Ctrl/Cmd+Shift+C shortcut
  //  registered inside command-center.tsx — NOT here — so that staff-only
  //  access is not advertised in the public chrome.)
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (k === "j") {
        e.preventDefault();
        setScheduleOpen((v) => !v);
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  // Listen for navbar "Schedule a Meeting" triggers (cross-component).
  useEffect(() => {
    const handler = () => setScheduleOpen(true);
    window.addEventListener("alaminn:open-schedule-meeting", handler);
    return () => window.removeEventListener("alaminn:open-schedule-meeting", handler);
  }, []);

  return (
    <>
      {/* Skip-to-content link — visible only on keyboard focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-lg focus:bg-orange-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>

      <SearchPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        isAuthed={isAuthed}
        onAction={(action) => {
          if (action === "open-command-center") openCommandCenter?.();
          if (action === "schedule-meeting") setScheduleOpen(true);
        }}
      />
      <ScheduleMeetingModal open={scheduleOpen} onOpenChange={setScheduleOpen} />

      {/* Floating search trigger — bottom-left, mirrors the back-to-top */}
      <button
        onClick={() => setPaletteOpen(true)}
        aria-label="Open search (Cmd+K)"
        className="fixed bottom-5 left-5 z-40 inline-flex h-12 items-center gap-2 rounded-2xl border border-ink-200 bg-white/80 px-3.5 text-xs font-semibold text-ink-700 shadow-soft backdrop-blur transition-all hover:border-blue-300 hover:text-blue-700"
      >
        <Search className="h-4 w-4 text-blue-600" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden items-center gap-0.5 rounded-md border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px] font-bold text-ink-500 sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      {/* Theme toggle — bottom-center, between search + command center */}
      <div className="fixed bottom-5 left-1/2 z-40 hidden -translate-x-1/2 sm:block">
        <ThemeToggle />
      </div>

      {/* WhatsApp AI chat widget — bottom-right */}
      <WhatsAppChatWidget />
    </>
  );
}
