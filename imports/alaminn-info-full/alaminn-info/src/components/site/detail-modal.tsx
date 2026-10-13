"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/**
 * Accessible, animated detail modal.
 * - Closes on ESC, backdrop click, and close button.
 * - Locks body scroll while open.
 * - Focuses the panel on open for screen readers.
 * - Renders a header (eyebrow + title + optional accent gradient) and a scrollable body.
 *
 * `bodyRef` (optional) lets the consumer observe the scrollable body — useful for
 * rendering an in-modal reading-progress bar via framer-motion's `useScroll`.
 */
export function DetailModal({
  open,
  onClose,
  eyebrow,
  title,
  accent = "blue",
  children,
  footer,
  bodyRef,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: ReactNode;
  accent?: "blue" | "orange" | "intelligence" | "momentum";
  children: ReactNode;
  footer?: ReactNode;
  bodyRef?: RefObject<HTMLDivElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll + ESC to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // focus the panel for a11y
    const t = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  const accentClass =
    accent === "orange"
      ? "from-orange-500 to-orange-600"
      : accent === "intelligence"
        ? "grad-intelligence"
        : accent === "momentum"
          ? "grad-momentum"
          : "from-blue-600 to-blue-700";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === "string" ? title : "Detail dialog"}
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          {/* panel */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white dark:bg-[#082044] shadow-2xl outline-none sm:rounded-3xl DetailModal-panel"
          >
            {/* accent header */}
            <div className={`relative bg-gradient-to-br ${accentClass} p-6 text-white sm:p-7`}>
              {/* subtle grid texture */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
              <button
                onClick={onClose}
                aria-label="Close detail"
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="relative">
                {eyebrow && (
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                    {eyebrow}
                  </div>
                )}
                <h3 className="font-display text-2xl font-extrabold leading-tight text-white text-balance sm:text-3xl">
                  {title}
                </h3>
              </div>
            </div>

            {/* scrollable body */}
            <div
              ref={bodyRef}
              className="flex-1 overflow-y-auto p-6 sm:p-8 DetailModal-body scroll-area"
            >
              {children}
            </div>

            {footer && (
              <div className="border-t border-ink-100 dark:border-blue-800/20 bg-ink-50/60 dark:bg-[rgba(10,50,104,0.30)] p-4 sm:px-8 DetailModal-footer">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Small labelled row used inside modal bodies. */
export function ModalField({
  label,
  value,
  accent = "ink",
}: {
  label: string;
  value: ReactNode;
  accent?: "ink" | "blue" | "orange" | "emerald";
}) {
  const labelColor =
    accent === "blue"
      ? "text-blue-600"
      : accent === "orange"
        ? "text-orange-700"
        : accent === "emerald"
          ? "text-emerald-700"
          : "text-ink-400";
  return (
    <div className="rounded-xl border border-ink-100 dark:border-blue-800/20 bg-white dark:bg-[rgba(8,32,68,0.60)] p-3.5 ModalField-card">
      <div className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
        {label}
      </div>
      <div className="mt-1 text-sm leading-relaxed text-ink-700 dark:text-ink-200 ModalField-value">{value}</div>
    </div>
  );
}
