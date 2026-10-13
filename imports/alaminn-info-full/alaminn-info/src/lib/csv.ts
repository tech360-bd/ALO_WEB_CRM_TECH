/**
 * CSV helpers — tiny, dependency-free.
 * -------------------------------------
 * Builds RFC 4180-compliant CSV strings from arrays of row objects.
 * Fields containing commas, double quotes, or newlines are wrapped in
 * double quotes with embedded quotes doubled.
 */

export type CsvColumn<T> = {
  /** Header label (also used as the column key when no `get` is supplied). */
  header: string;
  /** Field name on the row to read; ignored if `get` is supplied. */
  key?: keyof T;
  /** Custom accessor — preferred over `key` when both are present. */
  get?: (row: T) => string | number | null | undefined;
};

/** Escape a single CSV cell per RFC 4180. */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "string" ? value : String(value);
  // Quote if the string contains a comma, double-quote, newline, or CR.
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Build a CSV string from an array of row objects + a column spec. */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => csvCell(c.header)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const v = c.get
            ? c.get(row)
            : (row as Record<string, unknown>)[c.key as string];
          return csvCell(v);
        })
        .join(",")
    )
    .join("\n");
  // Trailing newline keeps most CSV consumers happy.
  return `${header}\n${body}\n`;
}

/** Format a Date or ISO string as YYYYMMDD (UTC) — used for filenames. */
export function yyyymmdd(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
