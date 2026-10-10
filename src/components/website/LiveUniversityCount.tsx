'use client';

import { useEffect, useState } from 'react';

/**
 * Renders the real number of universities in the live directory
 * (from /api/universities `total`), instead of a hardcoded marketing number.
 * Falls back to the provided `fallback` text (default: an em dash) while
 * loading or if the API is unavailable — it never invents a figure.
 */
export function useUniversityCount(): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/universities?limit=1')
      .then(r => r.json())
      .then(d => {
        if (!cancelled && typeof d.total === 'number') setCount(d.total);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return count;
}

export default function LiveUniversityCount({ fallback = '—', suffix = '' }: { fallback?: string; suffix?: string }) {
  const count = useUniversityCount();
  return <>{count !== null ? `${count}${suffix}` : fallback}</>;
}
