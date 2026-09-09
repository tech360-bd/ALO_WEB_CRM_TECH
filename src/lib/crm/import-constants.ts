// Course CSV Template - 50 columns
export const COURSE_COLUMNS = [
  'university_id',
  'university_name',
  'country',
  'city',
  'campus_name',
  'ranking',
  'world_ranking',
  'university_type',
  'founded',
  'students',
  'scholarships',
  'featured',
  'website',
  'official_url',
  'source_url',
  'course_id',
  'course_title',
  'study_level',
  'program_level',
  'subject_area',
  'discipline_area',
  'duration_months',
  'public_tags',
  'intake_year',
  'intake_month',
  'intake_name',
  'application_deadline',
  'app_fee_currency',
  'app_fee_amount',
  'tuition_currency',
  'yearly_tuition',
  'total_tuition',
  'deposit_currency',
  'deposit_amount',
  'academic_req',
  'grading_system',
  'min_score',
  'ielts_overall',
  'ielts_min_band',
  'pte_overall',
  'pte_min_band',
  'toefl_overall',
  'det_overall',
  'moi_accepted',
  'portfolio_required',
  'interview_required',
  'scholarship_name',
  'scholarship_amount',
  'internal_expected',
  'internal_notes',
];

export const UNIVERSITY_COLUMNS = [
  'id',
  'name',
  'country',
  'city',
  'ranking',
  'worldRanking',
  'type',
  'founded',
  'students',
  'intlStudents',
  'ieltsMin',
  'courses',
  'tuitionRange',
  'scholarships',
  'description',
  'featured',
  'website',
];

export const VALID_CURRENCIES = ['GBP', 'USD', 'AUD', 'CAD', 'EUR', 'NZD', 'AED', 'BDT'] as const;
export const VALID_STATUSES = ['active', 'draft', 'archived', 'needs_review', 'needs_official_source'] as const;

export const CURRENCY_FIELDS = ['app_fee_currency', 'tuition_currency', 'deposit_currency'];
export const BOOLEAN_FIELDS = ['scholarships', 'featured', 'moi_accepted', 'portfolio_required', 'interview_required'];
export const NUMBER_FIELDS = [
  'ranking',
  'world_ranking',
  'founded',
  'duration_months',
  'app_fee_amount',
  'yearly_tuition',
  'total_tuition',
  'deposit_amount',
  'ielts_overall',
  'ielts_min_band',
  'pte_overall',
  'pte_min_band',
  'toefl_overall',
  'det_overall',
  'scholarship_amount',
  'intake_year',
  'internal_expected',
];
export const DATE_FIELDS = ['application_deadline'];
export const REQUIRED_FIELDS = [
  'university_id',
  'university_name',
  'course_id',
  'course_title',
  'study_level',
  'intake_year',
  'intake_month',
];

// Simple CSV row parser that handles quoted fields
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((l) => parseCsvLine(l));
  return { headers, rows };
}

export function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsvRow(values: string[]): string {
  return values.map(escapeCsvField).join(',');
}

export function buildDuplicateKey(universityId: string, courseId: string, intakeYear: string, intakeMonth: string): string {
  return `${universityId}|${courseId}|${intakeYear}|${intakeMonth}`;
}