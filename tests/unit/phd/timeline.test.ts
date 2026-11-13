import { describe, expect, it } from 'vitest';
import { criticalPath, generateTimeline } from '@/lib/phd/timeline';

const start = '2026-01-15';

describe('Research timeline planner', () => {
  it('defaults to 36 months for business and 42 for engineering', () => {
    const business = generateTimeline({ startDate: start, mode: 'FULL_TIME', discipline: 'BUSINESS' });
    const engineering = generateTimeline({ startDate: start, mode: 'FULL_TIME', discipline: 'ENGINEERING' });
    expect(business.totalMonths).toBe(36);
    expect(engineering.totalMonths).toBe(42);
  });

  it('stretches to 72 months for part-time study', () => {
    const plan = generateTimeline({ startDate: start, mode: 'PART_TIME', discipline: 'BUSINESS' });
    expect(plan.totalMonths).toBe(72);
    expect(plan.mode).toBe('PART_TIME');
  });

  it('clamps implausible durations and warns rather than inventing a shorter programme', () => {
    const plan = generateTimeline({ startDate: start, mode: 'FULL_TIME', discipline: 'BUSINESS', totalMonths: 120 });
    expect(plan.totalMonths).toBe(96);
    expect(plan.warnings.join(' ').toLowerCase()).toContain('outside');
  });

  it('never labels a planning milestone as an official deadline', () => {
    const plan = generateTimeline({ startDate: start, mode: 'FULL_TIME', discipline: 'BUSINESS' });
    expect(plan.milestones.length).toBeGreaterThanOrEqual(10);
    for (const milestone of plan.milestones) {
      expect(milestone.isOfficialDeadline).toBe(false);
    }
    expect(plan.assumptions.join(' ').toLowerCase()).toContain('not official');
  });

  it('produces chronological milestones with real dependencies', () => {
    const plan = generateTimeline({ startDate: start, mode: 'FULL_TIME', discipline: 'ENGINEERING' });
    const byKey = new Map(plan.milestones.map((milestone) => [milestone.key, milestone]));
    let previous = new Date(0);
    for (const milestone of plan.milestones) {
      expect(milestone.startDate.getTime()).toBeGreaterThanOrEqual(previous.getTime() - 1);
      expect(milestone.endDate.getTime()).toBeGreaterThan(milestone.startDate.getTime());
      previous = milestone.endDate;
      if (milestone.dependsOnKey) {
        const dependency = byKey.get(milestone.dependsOnKey);
        expect(dependency).toBeTruthy();
        expect(dependency!.startDate.getTime()).toBeLessThan(milestone.startDate.getTime() + 1);
      }
    }
  });

  it('includes ethics before data collection and submission at the end', () => {
    const plan = generateTimeline({ startDate: start, mode: 'FULL_TIME', discipline: 'BUSINESS' });
    const keys = plan.milestones.map((milestone) => milestone.key);
    expect(keys.indexOf('ethics')).toBeLessThan(keys.indexOf('data'));
    expect(keys[keys.length - 1]).toBe('submission');
  });

  it('computes a critical path that ends with submission', () => {
    const plan = generateTimeline({ startDate: start, mode: 'FULL_TIME', discipline: 'BUSINESS' });
    const path = criticalPath(plan);
    expect(path.length).toBeGreaterThan(1);
    expect(path[path.length - 1].key).toBe('submission');
  });

  it('rejects an invalid start date instead of inventing one', () => {
    expect(() => generateTimeline({ startDate: 'not-a-date', mode: 'FULL_TIME', discipline: 'BUSINESS' })).toThrow(/start date/i);
  });
});
