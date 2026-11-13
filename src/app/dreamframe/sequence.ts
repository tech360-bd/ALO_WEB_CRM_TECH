/** Shared sequence math, independent of the rendering and preload lifecycle. */
export const FRAME_COUNT = 150;
export type FrameState = 'idle' | 'queued' | 'loading' | 'ready' | 'error';

export function frameFilename(index: number): string {
  return `frame-${String(index + 1).padStart(3, '0')}.png`;
}

export function frameUrl(index: number): string {
  return `/images/dreamframe/frames/${frameFilename(index)}`;
}

export function targetFrameForScroll(sectionTop: number, sectionHeight: number, viewportHeight: number): number {
  const scrollableDistance = Math.max(1, sectionHeight - viewportHeight);
  const progress = Math.max(0, Math.min(1, -sectionTop / scrollableDistance));
  return progress * (FRAME_COUNT - 1);
}

export function easeFrame(current: number, target: number, elapsed: number): number {
  const delta = Math.max(0, Math.min(elapsed, 64));
  const next = current + (target - current) * (1 - Math.exp(-delta / 105));
  return Math.abs(target - next) < 0.02 ? target : next;
}

export function nearestReadyFrame(desired: number, states: readonly FrameState[]): number {
  const index = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(desired)));
  for (let distance = 0; distance < FRAME_COUNT; distance += 1) {
    const before = index - distance;
    const after = index + distance;
    if (before >= 0 && states[before] === 'ready') return before;
    if (after < FRAME_COUNT && states[after] === 'ready') return after;
  }
  return -1;
}
