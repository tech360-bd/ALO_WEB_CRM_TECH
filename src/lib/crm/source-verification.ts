export const VERIFICATION_STATES = [
  'DISCOVERED_ONLY',
  'SOURCE_FOUND',
  'PARTIALLY_VERIFIED',
  'VERIFIED',
  'NEEDS_REVIEW',
  'SOURCE_MISSING',
  'URL_UNREACHABLE',
  'SOFT_404',
  'ARCHIVED',
  'NOT_APPLICABLE',
] as const;

export type VerificationState = (typeof VERIFICATION_STATES)[number];

export const PIPELINE_STATES = [
  'DISCOVERED',
  'OFFICIAL_SOURCE_FOUND',
  'VALIDATED',
  'ADMIN_REVIEWED',
  'PUBLISHED',
] as const;

export type PipelineState = (typeof PIPELINE_STATES)[number];

export function normalizeInstitutionName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\bthe\b/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isOfficialUniversityUrl(url: string, officialDomain: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const domain = officialDomain.replace(/^www\./, '').toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

export function canPublishVerifiedCourse(input: {
  verificationStatus: string;
  officialCourseUrl: string;
  officialUniversityName: string;
  officialCourseTitle: string;
  lastCheckedAt: string;
}): boolean {
  return (
    input.verificationStatus === 'VERIFIED' &&
    input.officialCourseUrl.trim().startsWith('https://') &&
    input.officialUniversityName.trim().length > 0 &&
    input.officialCourseTitle.trim().length > 0 &&
    input.lastCheckedAt.trim().length > 0
  );
}

export function scholarshipPercentageIsValid(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}
