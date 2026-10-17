import { describe, expect, it } from 'vitest';
import {
  ALO_STUDY_STEPS,
  buildStudyGuideText,
  destinationGuidePath,
  studyGuideFileName,
} from '@/lib/alo-study-steps';

describe('ALO 7-step study guide (homepage Smart Course Finder download)', () => {
  it('has exactly 7 ordered steps', () => {
    expect(ALO_STUDY_STEPS).toHaveLength(7);
    expect(ALO_STUDY_STEPS.map((s) => s.step)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const s of ALO_STUDY_STEPS) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
    }
  });

  it('builds a country-specific downloadable guide with real ALO contact details', () => {
    const text = buildStudyGuideText('United Kingdom', 'uk');
    expect(text).toContain('Your 7-Step Study Guide — United Kingdom');
    expect(text).toContain('Step 1: Free Counseling & Profile Assessment');
    expect(text).toContain('Step 7: Pre-Departure Briefing & Fly');
    expect(text).toContain('https://aloeducation.com/destinations/uk');
    expect(text).toContain('https://aloeducation.com/course-finder?country=United%20Kingdom');
    expect(text).toContain('+8801805020101');
    expect(text).toContain('info@aloeducation.com');
    expect(text).toContain('https://share.google/aarau5V2GfBrICZTj');
    // Honesty guard: the guide never promises an outcome.
    expect(text.toLowerCase()).not.toContain('guaranteed visa');
    expect(text.toLowerCase()).not.toContain('guaranteed admission');
  });

  it('derives safe file names and destination paths', () => {
    expect(studyGuideFileName('United Kingdom')).toBe('alo-united-kingdom-7-step-study-guide.txt');
    expect(studyGuideFileName('New Zealand')).toBe('alo-new-zealand-7-step-study-guide.txt');
    expect(destinationGuidePath('australia')).toBe('/destinations/australia');
  });
});
