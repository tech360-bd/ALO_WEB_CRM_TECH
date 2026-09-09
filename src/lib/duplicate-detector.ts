// ALO Education — Duplicate Detection & Conflict Categorization Engine
// Detects exact duplicates, probable duplicates, and conflicting record claims

export type DuplicateOutcome =
  | 'EXACT_DUPLICATE'
  | 'PROBABLE_DUPLICATE'
  | 'SAME_RECORD_UNCHANGED'
  | 'SAME_RECORD_UPDATED'
  | 'POSSIBLE_CONFLICT'
  | 'NEW_RECORD';

export interface DuplicateCheckResult {
  outcome: DuplicateOutcome;
  confidenceScore: number; // 0 to 100
  matchedRecordId?: string;
  matchedField?: string;
  reason: string;
}

function cleanDomain(url: string | undefined): string {
  if (!url) return '';
  return url.toLowerCase().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '').trim();
}

export function detectUniversityDuplicate(
  incoming: { externalId?: string; name: string; websiteUrl?: string; country: string },
  existingRecords: { id: string; externalId?: string; name: string; websiteUrl?: string; country: string }[]
): DuplicateCheckResult {
  // 1. External ID Match
  if (incoming.externalId) {
    const extMatch = existingRecords.find(r => r.externalId === incoming.externalId);
    if (extMatch) {
      if (extMatch.name === incoming.name && cleanDomain(extMatch.websiteUrl) === cleanDomain(incoming.websiteUrl)) {
        return { outcome: 'SAME_RECORD_UNCHANGED', confidenceScore: 100, matchedRecordId: extMatch.id, matchedField: 'externalId', reason: 'Exact external ID and attribute match.' };
      }
      return { outcome: 'SAME_RECORD_UPDATED', confidenceScore: 95, matchedRecordId: extMatch.id, matchedField: 'externalId', reason: 'Existing record found by external ID with updated attributes.' };
    }
  }

  // 2. Exact Website Domain Match
  const incomingDomain = cleanDomain(incoming.websiteUrl);
  if (incomingDomain) {
    const domainMatch = existingRecords.find(r => cleanDomain(r.websiteUrl) === incomingDomain);
    if (domainMatch) {
      return { outcome: 'EXACT_DUPLICATE', confidenceScore: 98, matchedRecordId: domainMatch.id, matchedField: 'websiteUrl', reason: 'Exact official domain match.' };
    }
  }

  // 3. Name & Country Similarity Match
  const normName = incoming.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nameMatch = existingRecords.find(r => r.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normName && r.country.toUpperCase() === incoming.country.toUpperCase());

  if (nameMatch) {
    return { outcome: 'PROBABLE_DUPLICATE', confidenceScore: 85, matchedRecordId: nameMatch.id, matchedField: 'name', reason: 'Matching university name and destination country.' };
  }

  return { outcome: 'NEW_RECORD', confidenceScore: 0, reason: 'No duplicate university record found.' };
}

export function detectCourseDuplicate(
  incoming: { externalId?: string; universityId: string; courseTitle: string; qualification: string; studyMode?: string },
  existingCourses: { id: string; externalId?: string; universityId: string; courseTitle: string; qualification: string; studyMode?: string }[]
): DuplicateCheckResult {
  // 1. External ID Match
  if (incoming.externalId) {
    const extMatch = existingCourses.find(c => c.externalId === incoming.externalId);
    if (extMatch) {
      return { outcome: 'SAME_RECORD_UNCHANGED', confidenceScore: 100, matchedRecordId: extMatch.id, matchedField: 'externalId', reason: 'Exact external course ID match.' };
    }
  }

  // 2. Title, Qualification & University Match
  const normTitle = incoming.courseTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
  const titleMatch = existingCourses.find(c =>
    c.universityId === incoming.universityId &&
    c.courseTitle.toLowerCase().replace(/[^a-z0-9]/g, '') === normTitle &&
    c.qualification.toLowerCase() === incoming.qualification.toLowerCase()
  );

  if (titleMatch) {
    return { outcome: 'EXACT_DUPLICATE', confidenceScore: 95, matchedRecordId: titleMatch.id, matchedField: 'courseTitle', reason: 'Matching course title, qualification, and university.' };
  }

  return { outcome: 'NEW_RECORD', confidenceScore: 0, reason: 'No duplicate course record found.' };
}
