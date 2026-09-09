import { describe, expect, it } from 'vitest';
import {
  canPublishVerifiedCourse,
  isOfficialUniversityUrl,
  normalizeInstitutionName,
  scholarshipPercentageIsValid,
} from '@/lib/crm/source-verification';

describe('source verification policy', () => {
  it('normalizes aliases without merging unrelated institutions', () => {
    expect(normalizeInstitutionName("Queen's University Belfast")).toBe('queens university belfast');
    expect(normalizeInstitutionName('University of the West of Scotland')).not.toBe(normalizeInstitutionName('University of Westminster'));
  });

  it('requires official university domains for official URLs', () => {
    expect(isOfficialUniversityUrl('https://www.ucl.ac.uk/prospective-students', 'ucl.ac.uk')).toBe(true);
    expect(isOfficialUniversityUrl('https://example.com/ucl-course', 'ucl.ac.uk')).toBe(false);
  });

  it('blocks publication unless official verification fields are complete', () => {
    expect(canPublishVerifiedCourse({
      verificationStatus: 'VERIFIED',
      officialCourseUrl: 'https://www.ucl.ac.uk/course',
      officialUniversityName: 'University College London',
      officialCourseTitle: 'MSc Example',
      lastCheckedAt: '2026-08-01T00:00:00.000Z',
    })).toBe(true);

    expect(canPublishVerifiedCourse({
      verificationStatus: 'DISCOVERED_ONLY',
      officialCourseUrl: 'https://www.ucl.ac.uk/course',
      officialUniversityName: 'University College London',
      officialCourseTitle: 'MSc Example',
      lastCheckedAt: '2026-08-01T00:00:00.000Z',
    })).toBe(false);
  });

  it('rejects invalid scholarship percentages', () => {
    expect(scholarshipPercentageIsValid(0)).toBe(true);
    expect(scholarshipPercentageIsValid(100)).toBe(true);
    expect(scholarshipPercentageIsValid(-1)).toBe(false);
    expect(scholarshipPercentageIsValid(101)).toBe(false);
  });
});
