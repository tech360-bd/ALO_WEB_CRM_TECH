/**
 * CANONICAL INTAKE WINDOW
 * =======================
 * Master-build requirement: "all courses are added for every month — Jan 2027 to
 * Jan 2028 intakes."
 *
 * This file is the single definition of that window. Everything that shows or
 * filters intakes (public Course Finder chips, the search API, the student and
 * partner finders, the backfill script and the admin screen) reads it from here,
 * so the window can never drift between screens.
 *
 * Honesty rules from the brief (§47 NO FAKE DATA) are respected by the backfill:
 * a generated row records that the month is an ALO-tracked intake, and carries
 * NO tuition, deadline, deposit or application fee. Those stay empty until an
 * official source is verified, and the UI labels such rows as pending
 * verification instead of inventing numbers.
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export interface IntakePeriod {
  year: number;
  /** 1-12. */
  month: number;
  /** Canonical label, e.g. "Jan 2027". */
  label: string;
  /** Long month name, e.g. "January". */
  monthName: string;
  /** Stable key used in URLs and UI state, e.g. "2027-01". */
  key: string;
}

/** First month of the ALO intake window. */
export const INTAKE_WINDOW_START: { year: number; month: number } = { year: 2027, month: 1 };
/** Last month of the ALO intake window (inclusive). */
export const INTAKE_WINDOW_END: { year: number; month: number } = { year: 2028, month: 1 };

export const SCHEDULED_INTAKE_VERIFICATION = 'SCHEDULED';

function period(year: number, month: number): IntakePeriod {
  const monthName = MONTH_NAMES[month - 1];
  return {
    year,
    month,
    monthName,
    label: `${monthName.slice(0, 3)} ${year}`,
    key: `${year}-${String(month).padStart(2, '0')}`,
  };
}

/** Every month in the window, oldest first — Jan 2027 … Jan 2028 (13 months). */
export const INTAKE_WINDOW_MONTHS: IntakePeriod[] = (() => {
  const months: IntakePeriod[] = [];
  for (let year = INTAKE_WINDOW_START.year; year <= INTAKE_WINDOW_END.year; year += 1) {
    const firstMonth = year === INTAKE_WINDOW_START.year ? INTAKE_WINDOW_START.month : 1;
    const lastMonth = year === INTAKE_WINDOW_END.year ? INTAKE_WINDOW_END.month : 12;
    for (let month = firstMonth; month <= lastMonth; month += 1) months.push(period(year, month));
  }
  return months;
})();

/** Years touched by the window, oldest first. */
export const INTAKE_WINDOW_YEARS: number[] = [...new Set(INTAKE_WINDOW_MONTHS.map((m) => m.year))];

/** Default year preselected in the public finder. */
export const DEFAULT_INTAKE_YEAR = INTAKE_WINDOW_START.year;

/** Years offered in the year selector: the window plus a few planning years. */
export const INTAKE_YEAR_OPTIONS: number[] = [
  ...INTAKE_WINDOW_YEARS,
  ...Array.from({ length: 4 }, (_, index) => INTAKE_WINDOW_END.year + 1 + index),
];

export function isInIntakeWindow(year: number, month: number): boolean {
  return INTAKE_WINDOW_MONTHS.some((entry) => entry.year === year && entry.month === month);
}

export function intakePeriodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Months to show as chips for a given year (the window subset when it applies). */
export function intakeMonthsForYear(year: number): IntakePeriod[] {
  const inWindow = INTAKE_WINDOW_MONTHS.filter((entry) => entry.year === year);
  if (inWindow.length > 0) return inWindow;
  return Array.from({ length: 12 }, (_, index) => period(year, index + 1));
}

/**
 * Parse a month token from the UI or an API caller.
 * Accepts "2027-01", "2027-1", "Jan 2027", "January 2027", "1" or "January".
 * A bare month or name needs a fallback year (the caller's `year` parameter).
 */
export function parseIntakePeriodToken(token: string, fallbackYear?: number): IntakePeriod | null {
  const value = token.trim();
  if (!value) return null;

  const iso = value.match(/^(\d{4})-(\d{1,2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    return month >= 1 && month <= 12 ? period(year, month) : null;
  }

  const named = value.match(/^([A-Za-z]{3,9})\.?\s*(\d{4})$/);
  if (named) {
    const monthIndex = MONTH_NAMES.findIndex((name) => name.toLowerCase().startsWith(named[1].toLowerCase().slice(0, 3)));
    if (monthIndex < 0) return null;
    return period(Number(named[2]), monthIndex + 1);
  }

  const numeric = value.match(/^(\d{1,2})$/);
  if (numeric && fallbackYear) {
    const month = Number(numeric[1]);
    return month >= 1 && month <= 12 ? period(fallbackYear, month) : null;
  }

  const nameOnly = MONTH_NAMES.findIndex((name) => name.toLowerCase() === value.toLowerCase())
    || (value.length >= 3 ? MONTH_NAMES.findIndex((name) => name.toLowerCase().startsWith(value.toLowerCase())) : -1);
  if (nameOnly >= 0 && fallbackYear) return period(fallbackYear, nameOnly + 1);

  return null;
}

/** Human sentence used in empty states and the finder blurb. */
export const INTAKE_WINDOW_LABEL = `${INTAKE_WINDOW_MONTHS[0].label} – ${INTAKE_WINDOW_MONTHS[INTAKE_WINDOW_MONTHS.length - 1].label}`;
