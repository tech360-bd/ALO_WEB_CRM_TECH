/**
 * STUDENT PROFILE — REPEATABLE SECTIONS (validation & normalisation)
 * =================================================================
 * The student profile already has the right tables —
 * `StudentEducationRecord`, `StudentWorkExpRecord`, `StudentEnglishTestRecord`
 * and `StudentVisaRefusal` — but by inspection NONE of them is written by any API
 * route: education, work experience and visa refusal records could not be created
 * or updated at all, and only the dashboard read English tests. This module and the
 * route beside it make those sections usable.
 *
 * Everything here is pure: no database, no clock unless passed in. That is what
 * lets the validation rules be executed and proven in any environment.
 *
 * Design rules taken from the requirements:
 *  • A qualification's fields appear per type (SSC/O Level, HSC/A Level, Diploma,
 *    Bachelor, Master) and records are added — never overwritten.
 *  • Work experience is optional and repeatable, with a current position allowed
 *    to have no end date.
 *  • English tests are repeatable: IELTS, IELTS UKVI, PTE, Duolingo, TOEFL, Kaplan.
 *    Expiry is validated as a date order only — no assumed validity period.
 *  • Visa refusal details are required only when the student declares a refusal.
 */

// ────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ────────────────────────────────────────────────────────────────────────────

export interface FieldIssue {
  field: string;
  message: string;
}

const MAX_TEXT = 200;
const MAX_LONG_TEXT = 2000;

function text(value: unknown, max = MAX_TEXT): string {
  const raw = typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);
  // Strip control characters; the portal renders these values directly.
  return raw.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function numeric(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** `YYYY-MM` or `YYYY-MM-DD`; the portal stores dates as strings. */
export function isIsoDate(value: string): boolean {
  return /^\d{4}-(\d{2})(-\d{2})?$/.test(value);
}

export function parseIsoDate(value: string): Date | null {
  if (!isIsoDate(value)) return null;
  const normalised = value.length === 7 ? `${value}-01` : value;
  const parsed = new Date(`${normalised}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** A 4-digit year, or a `YYYY-MM`/`YYYY-MM-DD` string. */
export function isYearOrDate(value: string): boolean {
  return /^\d{4}$/.test(value) || isIsoDate(value);
}

// ────────────────────────────────────────────────────────────────────────────
// Education
// ────────────────────────────────────────────────────────────────────────────

/** The five qualification types named in the requirements. */
export const QUALIFICATION_TYPES = ['SSC_O_LEVEL', 'HSC_A_LEVEL', 'DIPLOMA', 'BACHELOR', 'MASTER'] as const;
export type QualificationType = (typeof QUALIFICATION_TYPES)[number];

export const QUALIFICATION_LABELS: Record<QualificationType, string> = {
  SSC_O_LEVEL: 'SSC / O Level',
  HSC_A_LEVEL: 'HSC / A Level',
  DIPLOMA: 'Diploma',
  BACHELOR: 'Bachelor',
  MASTER: 'Master',
};

/** Accepts the stored spellings plus common free text, and reports failure. */
export function normaliseQualificationType(value: unknown): QualificationType | null {
  const key = text(value).toUpperCase().replace(/[\s./-]+/g, '_');
  if ((QUALIFICATION_TYPES as readonly string[]).includes(key)) return key as QualificationType;
  if (key.includes('SSC') || key.includes('O_LEVEL')) return 'SSC_O_LEVEL';
  if (key.includes('HSC') || key.includes('A_LEVEL')) return 'HSC_A_LEVEL';
  if (key.includes('DIPLOMA')) return 'DIPLOMA';
  if (key.includes('BACHELOR') || key.includes('UNDERGRAD')) return 'BACHELOR';
  if (key.includes('MASTER') || key.includes('POSTGRAD')) return 'MASTER';
  return null;
}

/** Fields shown for each qualification type, so the UI and validator agree. */
export const QUALIFICATION_FIELDS: Record<QualificationType, string[]> = {
  SSC_O_LEVEL: ['institution', 'cityOfStudy', 'countryOfStudy', 'boardName', 'groupSubject', 'resultType', 'resultScore', 'endYear', 'duration'],
  HSC_A_LEVEL: ['institution', 'cityOfStudy', 'countryOfStudy', 'boardName', 'groupSubject', 'resultType', 'resultScore', 'endYear', 'duration'],
  DIPLOMA: ['institution', 'cityOfStudy', 'countryOfStudy', 'boardName', 'groupSubject', 'resultType', 'resultScore', 'endYear', 'duration'],
  BACHELOR: ['institution', 'cityOfStudy', 'countryOfStudy', 'boardName', 'groupSubject', 'resultType', 'resultScore', 'endYear', 'duration'],
  MASTER: ['institution', 'cityOfStudy', 'countryOfStudy', 'boardName', 'groupSubject', 'resultType', 'resultScore', 'endYear', 'duration'],
};

export interface EducationInput {
  qualificationType: string;
  institution: string;
  cityOfStudy?: string;
  countryOfStudy?: string;
  boardName?: string;
  groupSubject?: string;
  resultType?: string;
  resultScore?: string;
  startYear?: string;
  startMonth?: string;
  endYear?: string;
  endMonth?: string;
  duration?: string;
  primaryLanguage?: string;
  studyGap?: string;
}

export function validateEducation(input: EducationInput): { valid: boolean; issues: FieldIssue[]; value: Record<string, unknown> } {
  const issues: FieldIssue[] = [];
  const type = normaliseQualificationType(input.qualificationType);
  if (!type) {
    issues.push({ field: 'qualificationType', message: `Qualification must be one of: ${QUALIFICATION_TYPES.join(', ')}.` });
  }

  const institution = text(input.institution);
  if (!institution) issues.push({ field: 'institution', message: 'Institution name is required.' });

  const endYear = text(input.endYear, 10);
  const startYear = text(input.startYear, 10);
  if (endYear && !/^\d{4}$/.test(endYear)) issues.push({ field: 'endYear', message: 'Passing year must be a 4-digit year.' });
  if (startYear && !/^\d{4}$/.test(startYear)) issues.push({ field: 'startYear', message: 'Start year must be a 4-digit year.' });
  if (startYear && endYear && /^\d{4}$/.test(startYear) && /^\d{4}$/.test(endYear) && Number(endYear) < Number(startYear)) {
    issues.push({ field: 'endYear', message: 'Passing year cannot be earlier than the start year.' });
  }

  const resultScore = text(input.resultScore, 40);
  if (resultScore && !/^[\d.]+(\s*\/\s*[\d.]+)?\s*%?$/.test(resultScore) && !/^[A-F][+-]?$/i.test(resultScore)) {
    issues.push({ field: 'resultScore', message: 'Result should be a GPA/percentage value or a grade.' });
  }

  return {
    valid: issues.length === 0,
    issues,
    value: {
      academicLevel: type ?? '',
      institution,
      cityOfStudy: text(input.cityOfStudy),
      countryOfStudy: text(input.countryOfStudy),
      boardName: text(input.boardName),
      groupSubject: text(input.groupSubject),
      resultType: text(input.resultType, 40),
      resultScore,
      startYear,
      startMonth: text(input.startMonth, 2),
      endYear,
      endMonth: text(input.endMonth, 2),
      duration: text(input.duration, 40),
      primaryLanguage: text(input.primaryLanguage, 40),
      studyGap: text(input.studyGap, 10) || 'no',
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Work experience
// ────────────────────────────────────────────────────────────────────────────

export interface WorkInput {
  companyName: string;
  designation?: string;
  startDate?: string;
  endDate?: string;
  currentlyWorking?: boolean | string;
  responsibilities?: string;
  jobRole?: string;
  salaryMode?: string;
}

export function validateWork(input: WorkInput, now: Date = new Date()): { valid: boolean; issues: FieldIssue[]; value: Record<string, unknown> } {
  const issues: FieldIssue[] = [];
  const companyName = text(input.companyName);
  if (!companyName) issues.push({ field: 'companyName', message: 'Company name is required.' });

  const currentlyWorking = input.currentlyWorking === true || String(input.currentlyWorking || '').toLowerCase() === 'yes';
  const startDate = text(input.startDate, 10);
  const endDate = text(input.endDate, 10);

  if (startDate && !isIsoDate(startDate)) issues.push({ field: 'startDate', message: 'Start date must be YYYY-MM or YYYY-MM-DD.' });
  if (endDate && !isIsoDate(endDate)) issues.push({ field: 'endDate', message: 'End date must be YYYY-MM or YYYY-MM-DD.' });

  // A current position legitimately has no end date — that is not an error.
  if (!currentlyWorking && !endDate) {
    issues.push({ field: 'endDate', message: 'Provide an end date, or mark this as your current position.' });
  }
  if (currentlyWorking && endDate) {
    issues.push({ field: 'endDate', message: 'A current position cannot have an end date.' });
  }

  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (start && end && end.getTime() < start.getTime()) {
    issues.push({ field: 'endDate', message: 'End date cannot be earlier than the start date.' });
  }
  if (start && start.getTime() > now.getTime()) {
    issues.push({ field: 'startDate', message: 'Start date cannot be in the future.' });
  }

  return {
    valid: issues.length === 0,
    issues,
    value: {
      companyName,
      designation: text(input.designation),
      // "Responsibilities" is stored in the existing free-text job role column.
      jobRole: text(input.responsibilities ?? input.jobRole, MAX_LONG_TEXT),
      startDate,
      endDate: currentlyWorking ? '' : endDate,
      currentlyWorking,
      salaryMode: text(input.salaryMode, 40),
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// English proficiency
// ────────────────────────────────────────────────────────────────────────────

/** The six test names named in the requirements. */
export const ENGLISH_TEST_NAMES = ['IELTS', 'IELTS_UKVI', 'PTE', 'DUOLINGO', 'TOEFL', 'KAPLAN'] as const;
export type EnglishTestName = (typeof ENGLISH_TEST_NAMES)[number];

export const ENGLISH_TEST_LABELS: Record<EnglishTestName, string> = {
  IELTS: 'IELTS',
  IELTS_UKVI: 'IELTS UKVI',
  PTE: 'PTE',
  DUOLINGO: 'Duolingo',
  TOEFL: 'TOEFL',
  KAPLAN: 'Kaplan',
};

/**
 * Maps a stored/free-text test name onto the canonical value.
 * "IELTS UKVI" must not be flattened into "IELTS" — they are different tests with
 * different uses, and an IELTS result is not accepted as an IELTS UKVI result.
 */
export function normaliseEnglishTestName(value: unknown): EnglishTestName | null {
  const raw = text(value).toUpperCase();
  const key = raw.replace(/[\s./-]+/g, '_');
  if (key.includes('UKVI')) return 'IELTS_UKVI';
  if ((ENGLISH_TEST_NAMES as readonly string[]).includes(key)) return key as EnglishTestName;
  if (key.includes('IELTS')) return 'IELTS';
  if (key.includes('PTE')) return 'PTE';
  if (key.includes('DUOLINGO')) return 'DUOLINGO';
  if (key.includes('TOEFL')) return 'TOEFL';
  if (key.includes('KAPLAN')) return 'KAPLAN';
  return null;
}

export interface EnglishInput {
  testName: string;
  testDate?: string;
  expirationDate?: string;
  certId?: string;
  overallScore?: number | string;
  listening?: number | string;
  speaking?: number | string;
  writing?: number | string;
  reading?: number | string;
}

export function validateEnglishTest(
  input: EnglishInput,
  now: Date = new Date(),
): { valid: boolean; issues: FieldIssue[]; value: Record<string, unknown> } {
  const issues: FieldIssue[] = [];
  const testName = normaliseEnglishTestName(input.testName);
  if (!testName) issues.push({ field: 'testName', message: `Test must be one of: ${ENGLISH_TEST_NAMES.join(', ')}.` });

  const testDate = text(input.testDate, 10);
  const expirationDate = text(input.expirationDate, 10);
  if (testDate && !isIsoDate(testDate)) issues.push({ field: 'testDate', message: 'Test date must be YYYY-MM or YYYY-MM-DD.' });
  if (expirationDate && !isIsoDate(expirationDate)) issues.push({ field: 'expirationDate', message: 'Expiry must be YYYY-MM or YYYY-MM-DD.' });

  const test = parseIsoDate(testDate);
  const expiry = parseIsoDate(expirationDate);
  if (test && expiry && expiry.getTime() <= test.getTime()) {
    issues.push({ field: 'expirationDate', message: 'Expiry must be after the test date.' });
  }
  if (test && test.getTime() > now.getTime()) {
    issues.push({ field: 'testDate', message: 'Test date cannot be in the future.' });
  }
  // Deliberately NO assumed validity window: the requirements forbid imposing an
  // unsupported expiry period, so only the ordering above is checked.

  const overall = numeric(input.overallScore);
  if (overall === null || overall < 0 || overall > 120) {
    issues.push({ field: 'overallScore', message: 'Overall score must be a number between 0 and 120.' });
  }

  const section = (label: string, raw: unknown): number => {
    const value = numeric(raw);
    if (value === null) return 0;
    if (value < 0 || value > 120) {
      issues.push({ field: label, message: `${label} score must be between 0 and 120.` });
      return 0;
    }
    return value;
  };

  return {
    valid: issues.length === 0,
    issues,
    value: {
      testName: testName ?? '',
      testDate,
      expirationDate,
      certId: text(input.certId, 60),
      overallScore: overall ?? 0,
      listening: section('listening', input.listening),
      speaking: section('speaking', input.speaking),
      writing: section('writing', input.writing),
      reading: section('reading', input.reading),
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Visa refusal history
// ────────────────────────────────────────────────────────────────────────────

export interface VisaRefusalInput {
  appliedCountry: string;
  visaType?: string;
  rejectionDate?: string;
  reason?: string;
}

export function validateVisaRefusal(input: VisaRefusalInput): { valid: boolean; issues: FieldIssue[]; value: Record<string, unknown> } {
  const issues: FieldIssue[] = [];
  const appliedCountry = text(input.appliedCountry);
  if (!appliedCountry) issues.push({ field: 'appliedCountry', message: 'The country that refused the visa is required.' });

  const rejectionDate = text(input.rejectionDate, 10);
  if (rejectionDate && !isIsoDate(rejectionDate)) {
    issues.push({ field: 'rejectionDate', message: 'Refusal date must be YYYY-MM or YYYY-MM-DD.' });
  }

  return {
    valid: issues.length === 0,
    issues,
    value: {
      appliedCountry,
      visaType: text(input.visaType, 60),
      rejectionDate,
      reason: text(input.reason, MAX_LONG_TEXT),
    },
  };
}

/**
 * A refusal record is required only when the student answered Yes. Returns whether
 * the declaration and the stored records are consistent, so the portal can prompt
 * without blocking a student who has answered No.
 */
export function visaRefusalConsistency(declared: string | boolean | null | undefined, recordCount: number): {
  consistent: boolean;
  message: string;
} {
  const isYes = declared === true || String(declared || '').toLowerCase() === 'yes';
  if (isYes && recordCount === 0) {
    return { consistent: false, message: 'You answered Yes to a visa refusal — please add at least one refusal record.' };
  }
  if (!isYes && recordCount > 0) {
    return { consistent: false, message: 'Refusal records exist but the declaration says No — please confirm your answer.' };
  }
  return { consistent: true, message: 'Visa history declaration matches the records on file.' };
}

// ────────────────────────────────────────────────────────────────────────────
// Personal information
// ────────────────────────────────────────────────────────────────────────────

export interface PersonalInfoInput {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  presentAddress?: string;
  permanentAddress?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  immigrationHistory?: string;
}

export const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;

/**
 * Personal-information validation. Passport number and immigration history are
 * accepted here because this runs behind the authenticated student's own session;
 * the corresponding API responses must not include them for other viewers.
 */
export function validatePersonalInfo(input: PersonalInfoInput, now: Date = new Date()): {
  valid: boolean;
  issues: FieldIssue[];
  value: Record<string, unknown>;
} {
  const issues: FieldIssue[] = [];

  const fullName = text(input.fullName, 120);
  if (fullName && fullName.length < 3) issues.push({ field: 'fullName', message: 'Full name looks too short.' });

  const dateOfBirth = text(input.dateOfBirth, 10);
  if (dateOfBirth) {
    if (!isIsoDate(dateOfBirth)) {
      issues.push({ field: 'dateOfBirth', message: 'Date of birth must be YYYY-MM or YYYY-MM-DD.' });
    } else {
      const dob = parseIsoDate(dateOfBirth);
      if (dob && dob.getTime() > now.getTime()) issues.push({ field: 'dateOfBirth', message: 'Date of birth cannot be in the future.' });
      if (dob && now.getUTCFullYear() - dob.getUTCFullYear() < 10) {
        issues.push({ field: 'dateOfBirth', message: 'The applicant must be at least 10 years old.' });
      }
    }
  }

  const gender = text(input.gender, 20).toLowerCase().replace(/[\s-]+/g, '_');
  if (gender && !(GENDERS as readonly string[]).includes(gender)) {
    issues.push({ field: 'gender', message: `Gender must be one of: ${GENDERS.join(', ')}.` });
  }

  const passportNumber = text(input.passportNumber, 20).toUpperCase();
  if (passportNumber && !/^[A-Z0-9]{5,20}$/.test(passportNumber)) {
    issues.push({ field: 'passportNumber', message: 'Passport number should be 5–20 letters and digits.' });
  }

  const passportExpiry = text(input.passportExpiry, 10);
  if (passportExpiry && !isIsoDate(passportExpiry)) {
    issues.push({ field: 'passportExpiry', message: 'Passport expiry must be YYYY-MM or YYYY-MM-DD.' });
  }

  return {
    valid: issues.length === 0,
    issues,
    value: {
      fullName,
      dateOfBirth,
      gender,
      passportNumber,
      passportExpiry,
      nationality: text(input.nationality, 60),
      presentAddress: text(input.presentAddress, 300),
      permanentAddress: text(input.permanentAddress, 300),
      emergencyName: text(input.emergencyName, 120),
      emergencyPhone: text(input.emergencyPhone, 30),
      emergencyRelation: text(input.emergencyRelation, 60),
      immigrationHistory: text(input.immigrationHistory, MAX_LONG_TEXT),
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Public response shaping
// ────────────────────────────────────────────────────────────────────────────

/**
 * Personal fields that must never appear in a public or cross-account response.
 * Passport and immigration data are the ones the requirements single out.
 */
export const SENSITIVE_PERSONAL_FIELDS = [
  'passportNumber',
  'passportExpiry',
  'passportIssuePlace',
  'passportIssueDate',
  'passportIssueCountry',
  'immigrationHistory',
  'hasVisaRefusal',
  'nid',
] as const;

/**
 * Remove sensitive fields for any viewer who is not the owner or an authorised
 * staff member. Frontend hiding is not authorisation, so the removal happens here,
 * before serialisation.
 */
export function redactSensitivePersonal<T extends Record<string, unknown>>(
  record: T,
  options: { isOwner: boolean; isAuthorisedStaff: boolean },
): Partial<T> & { redacted?: string[] } {
  if (options.isOwner || options.isAuthorisedStaff) return record;
  const output: Record<string, unknown> = { ...record };
  const redacted: string[] = [];
  for (const field of SENSITIVE_PERSONAL_FIELDS) {
    if (field in output) {
      delete output[field];
      redacted.push(field);
    }
  }
  return { ...(output as Partial<T>), redacted };
}

/** Which profile sections a caller still has to complete, in portal order. */
export function missingProfileSections(snapshot: {
  hasPersonalInfo: boolean;
  educationCount: number;
  englishTestCount: number;
  hasEmergencyContact: boolean;
  documentCount: number;
}): string[] {
  const missing: string[] = [];
  if (!snapshot.hasPersonalInfo) missing.push('Personal information');
  if (snapshot.educationCount === 0) missing.push('Educational background');
  if (snapshot.englishTestCount === 0) missing.push('English proficiency');
  if (!snapshot.hasEmergencyContact) missing.push('Emergency contact');
  if (snapshot.documentCount === 0) missing.push('Documents');
  return missing;
}
