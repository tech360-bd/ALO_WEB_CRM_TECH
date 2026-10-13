"use client";

/**
 * Lightbox — premium, accessible image lightbox.
 *
 * Features:
 *  - Keyboard navigation (← → Esc)
 *  - Click outside / close button to dismiss
 *  - Prev / next chevrons with hover states
 *  - Caption + index counter
 *  - Framer Motion transitions (fade + scale)
 *  - Focus trap-friendly (aria-dialog, role=dialog)
 *  - Prevents body scroll while open
 *  - Lazy-loads the active image only
 */
import { useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  /** Controlled open index. null = closed. */
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export function Lightbox({ images, index, onClose, onIndexChange }: LightboxProps) {
  const isOpen = index !== null;

  const goNext = useCallback(() => {
    if (index === null) return;
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange]);

  const goPrev = useCallback(() => {
    if (index === null) return;
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, goNext, goPrev]);

  const current = index !== null ? images[index] : null;

  return (
    <AnimatePresence>
      {isOpen && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/90 backdrop-blur-md p-4 sm:p-8"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-6">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {index! + 1} / {images.length}
            </span>
            <button
              onClick={onClose}
              aria-label="Close viewer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Prev */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:left-4"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <motion.div
            key={current.src}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[82vh] max-w-[90vw] flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-h-[78vh] overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src={current.src}
                alt={current.alt}
                width={1600}
                height={1200}
                className="h-auto w-auto max-h-[78vh] max-w-[90vw] object-contain"
                priority
              />
            </div>
            {current.caption && (
              <p className="mt-4 max-w-2xl text-center text-sm text-blue-100">
                {current.caption}
              </p>
            )}
          </motion.div>

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:right-4"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Trigger button with a zoom icon overlay — used by gallery tiles. */
export function LightboxZoomHint() {
  return (
    <span className="pointer-events-none absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-950/50 text-white opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
      <ZoomIn className="h-4 w-4" />
    </span>
  );
}
