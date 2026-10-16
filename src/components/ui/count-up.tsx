'use client';

/**
 * CountUp — animates a REAL metric value when it first appears.
 *
 * Rules (master redesign §8): the value always comes from the caller (an API
 * payload); this component never invents a number. Non-numeric values
 * (currency strings, percentages already formatted by the API, labels) render
 * unchanged. `prefers-reduced-motion` disables the animation entirely, and
 * the final value is present in the DOM from the first frame for screen
 * readers (aria-label carries the real value; the animated digits are
 * aria-hidden).
 */

import { useEffect, useRef, useState } from 'react';

function parseNumeric(value: string): { amount: number; decimals: number } | null {
  const clean = value.replace(/,/g, '').trim();
  if (!/^-?\d+(\.\d+)?$/.test(clean)) return null;
  const amount = Number(clean);
  if (!Number.isFinite(amount)) return null;
  return { amount, decimals: clean.includes('.') ? clean.split('.')[1].length : 0 };
}

export function CountUp({
  value,
  durationMs = 700,
  className,
}: {
  value: string;
  durationMs?: number;
  className?: string;
}) {
  const parsed = parseNumeric(value);
  const [display, setDisplay] = useState(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!parsed) {
      setDisplay(value);
      return;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = parsed.amount * eased;
      setDisplay(
        current.toLocaleString('en-US', {
          minimumFractionDigits: parsed.decimals,
          maximumFractionDigits: parsed.decimals,
        }),
      );
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, durationMs, parsed]);

  return (
    <span className={className} aria-label={value}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
