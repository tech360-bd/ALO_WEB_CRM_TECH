export const UNIVERSITY_COURSE_INTAKE_WINDOW = {
  start: '2027-01',
  end: '2028-01',
  label: 'January 2027 – January 2028',
} as const;

// Eligibility must be an explicit positive status from a source-verified course record.
// Unknown, blank, closed, or free-text statuses are not treated as international eligibility.
export const VERIFIED_INTERNATIONAL_ELIGIBILITY_VALUES = [
  'eligible',
  'eligible for international students',
  'eligible_for_international_students',
  'international students eligible',
  'international_students_eligible',
  'international eligible',
  'international_eligible',
  'yes',
  'true',
] as const;

export function verifiedInternationalEligibilityWhere() {
  return { internationalEligibility: { in: [...VERIFIED_INTERNATIONAL_ELIGIBILITY_VALUES] } };
}

const MONTHS: Array<{ names: string[] }> = [
  { names: ['January', 'Jan'] },
  { names: ['February', 'Feb'] },
  { names: ['March', 'Mar'] },
  { names: ['April', 'Apr'] },
  { names: ['May'] },
  { names: ['June', 'Jun'] },
  { names: ['July', 'Jul'] },
  { names: ['August', 'Aug'] },
  { names: ['September', 'Sept', 'Sep'] },
  { names: ['October', 'Oct'] },
  { names: ['November', 'Nov'] },
  { names: ['December', 'Dec'] },
];

const MONTH_NUMBERS: Record<string, number> = Object.fromEntries(
  MONTHS.flatMap(({ names }, index) => names.map(name => [name.toLowerCase(), index + 1])),
);

export function normalizeIntakeMonth(month: string | null | undefined): number | null {
  if (!month) return null;
  const normalized = month.trim().toLowerCase().replace(/\s+/g, ' ');
  const numeric = normalized.match(/^(?:20\d{2}[-/])?(\d{1,2})$/);
  if (numeric) {
    const value = Number(numeric[1]);
    return value >= 1 && value <= 12 ? value : null;
  }

  const named = normalized.match(/^(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)(?:\s+20\d{2})?$/);
  return named ? MONTH_NUMBERS[named[1]] ?? null : null;
}

/** The requested window is inclusive at month granularity: Jan 2027 to Jan 2028. */
export function isInUniversityCourseIntakeWindow(year: number, month: string | null | undefined): boolean {
  const monthNumber = normalizeIntakeMonth(month);
  if (!Number.isInteger(year) || monthNumber === null) return false;
  return (year === 2027 && monthNumber >= 1 && monthNumber <= 12) || (year === 2028 && monthNumber === 1);
}

function monthValuesForYear(year: number, monthNumbers: number[]): string[] {
  return [...new Set(monthNumbers.flatMap((monthNumber) => {
    const { names } = MONTHS[monthNumber - 1];
    const unpadded = String(monthNumber);
    const padded = unpadded.padStart(2, '0');
    return [
      ...names,
      unpadded,
      padded,
      ...names.flatMap(name => [`${name} ${year}`]),
      `${year}-${unpadded}`,
      `${year}-${padded}`,
      `${year}/${unpadded}`,
      `${year}/${padded}`,
    ];
  }))];
}

/**
 * Prisma relation filter for the existing intake tables. The month aliases
 * reflect values accepted by legacy CSV/import surfaces. Unrecognized months
 * are excluded rather than guessed into the requested calendar window.
 */
export function universityIntakeWindowWhere() {
  return {
    OR: [
      {
        intakeYear: 2027,
        intakeMonth: { in: monthValuesForYear(2027, Array.from({ length: 12 }, (_, index) => index + 1)) },
      },
      {
        intakeYear: 2028,
        intakeMonth: { in: monthValuesForYear(2028, [1]) },
      },
    ],
  };
}
