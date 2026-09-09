export interface Course {
  id: string;
  universityName: string;
  courseTitle: string;
  country: string;
  studyLevel: string;
  duration: string;
  tuitionFee: number;
  tuitionCurrency: string;
  intake: string;
  hasScholarship: boolean;
  scholarshipDetails?: string;
  ieltsMin: number | null;
  pteMin: number | null;
  sourceUrl: string;
  subjectArea?: string;
  city?: string;
  commissionExpected?: number;
  commissionIncreased?: number;
  commissionPartner?: number;
  sourceVerified?: boolean;
}

export interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  type: string;
  ranking: number;
  tuitionMin: number;
  tuitionMax: number;
  tuitionCurrency: string;
  website: string;
  courseCount: number;
}

export interface Scholarship {
  id: string;
  universityName: string;
  courseName: string;
  scholarshipName: string;
  amount: number;
  currency: string;
  country: string;
}

export interface ImportBatch {
  batchId: string;
  type: string;
  fileName: string;
  date: string;
  rowsReceived: number;
  rowsImported: number;
  rowsFailed: number;
  status: 'completed' | 'failed' | 'in_progress' | 'rolled_back';
}

export interface ValidationRowError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'blocked';
}

export interface ValidationResult {
  total: number;
  valid: number;
  warnings: number;
  blocked: number;
  duplicates: number;
  unknownUniversity: number;
  missingSource: number;
  errors: ValidationRowError[];
}

export const COUNTRIES = [
  'UK', 'USA', 'Canada', 'Australia', 'Ireland',
  'Germany', 'New Zealand', 'Denmark', 'Japan', 'Malaysia',
  'South Korea', 'Dubai', 'India',
] as const;

export const STUDY_LEVELS = [
  'Undergraduate', 'Postgraduate', 'Foundation', 'Diploma', 'PhD',
] as const;

export const COUNTRY_FLAGS: Record<string, string> = {
  UK: '🇬🇧',
  USA: '🇺🇸',
  Canada: '🇨🇦',
  Australia: '🇦🇺',
  Ireland: '🇮🇪',
  Germany: '🇩🇪',
  'New Zealand': '🇳🇿',
  Denmark: '🇩🇰',
  Japan: '🇯🇵',
  Malaysia: '🇲🇾',
  'South Korea': '🇰🇷',
  Dubai: '🇦🇪',
  India: '🇮🇳',
};