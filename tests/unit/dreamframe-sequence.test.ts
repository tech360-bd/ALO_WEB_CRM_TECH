import { describe, expect, it } from 'vitest';
import { isPublicChromeRoute } from '@/components/website/public-chrome-policy';
import { isPublicPageRequest, isStaticAssetBypass } from '@/proxy';
import { easeFrame, FRAME_COUNT, frameFilename, frameUrl, nearestReadyFrame, targetFrameForScroll, type FrameState } from '@/app/dreamframe/sequence';

describe('DreamFrame scroll sequence', () => {
  it('names the first and last supplied frames consistently', () => {
    expect(FRAME_COUNT).toBe(150);
    expect(frameFilename(0)).toBe('frame-001.png');
    expect(frameFilename(149)).toBe('frame-150.png');
    expect(frameUrl(0)).toBe('/images/dreamframe/frames/frame-001.png');
  });

  it('maps the full sticky scroll range to the full sequence, clamped at the ends', () => {
    const target = (top: number) => targetFrameForScroll(top, 3200, 800);
    expect(target(100)).toBe(0);
    expect(target(0)).toBe(0);
    expect(target(-1200)).toBe(74.5);
    expect(target(-2400)).toBe(149);
    expect(target(-5000)).toBe(149);
  });

  it('eases toward changing targets in either direction and reaches a settled endpoint', () => {
    let current = 0;
    current = easeFrame(current, 149, 16);
    expect(current).toBeGreaterThan(0);
    expect(current).toBeLessThan(149);
    for (let i = 0; i < 120; i += 1) current = easeFrame(current, 149, 16);
    expect(current).toBe(149);
    current = easeFrame(current, 0, 16);
    expect(current).toBeLessThan(149);
    for (let i = 0; i < 120; i += 1) current = easeFrame(current, 0, 16);
    expect(current).toBe(0);
    expect(easeFrame(50, 50, 16)).toBe(50);
  });

  it('uses the closest loaded frame without drawing an unavailable image', () => {
    const states: FrameState[] = Array(FRAME_COUNT).fill('idle');
    expect(nearestReadyFrame(70, states)).toBe(-1);
    states[0] = 'ready';
    states[75] = 'ready';
    states[149] = 'ready';
    expect(nearestReadyFrame(0, states)).toBe(0);
    expect(nearestReadyFrame(71, states)).toBe(75);
    expect(nearestReadyFrame(149, states)).toBe(149);
  });
});

describe('DreamFrame route isolation', () => {
  it('is public without inheriting ALO public chrome', () => {
    expect(isPublicPageRequest('/dreamframe')).toBe(true);
    expect(isPublicPageRequest('/dreamframe/')).toBe(true);
    expect(isPublicPageRequest('/dreamframe/private')).toBe(false);
    expect(isPublicChromeRoute('/dreamframe')).toBe(false);
    expect(isPublicChromeRoute('/dreamframe/')).toBe(false);
    expect(isPublicChromeRoute('/dreamframe/anything')).toBe(false);
    expect(isPublicChromeRoute('/dreamframe-other')).toBe(true);
    expect(isPublicPageRequest('/dreamframe-other')).toBe(false);
  });

  it('serves sequence files through the existing public images policy', () => {
    expect(isStaticAssetBypass(frameUrl(0))).toBe(true);
  });
});
