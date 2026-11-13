import { parse as parseCsv } from 'csv-parse/sync';
import ExcelJS from 'exceljs';

export const MAX_STUDENT_IMPORT_BYTES = 20 * 1024 * 1024;
export const MAX_STUDENT_IMPORT_ROWS = 25_000;

const HEADER_ALIASES: Record<string, string[]> = {
  oldCrmId: ['oldcrmid', 'legacyid', 'sourcecrmid', 'crmrecordid', 'recordid', 'id'],
  studentName: ['studentname', 'fullname', 'name', 'applicantname'],
  phone: ['phone', 'mobile', 'phonenumber', 'telephone'],
  whatsapp: ['whatsapp', 'whatsappnumber', 'whatsappphone'],
  email: ['email', 'emailaddress'],
  passportNumber: ['passportnumber', 'passport', 'passportno'],
  dateOfBirth: ['dateofbirth', 'dob', 'birthdate'],
  countryInterest: ['countryinterest', 'preferredcountry', 'country', 'destination'],
  courseInterest: ['courseinterest', 'preferredcourse', 'course', 'program'],
  universityInterest: ['universityinterest', 'preferreduniversity', 'university', 'institution'],
  applicationStatus: ['applicationstatus', 'applicationstage', 'status'],
  counselorName: ['counselorname', 'counselor', 'assignedcounselor'],
  documents: ['documents', 'documentlist', 'documentreferences'],
  notes: ['notes', 'note', 'internalnotes'],
  communicationHistory: ['communicationhistory', 'messages', 'communications', 'messagehistory'],
  paymentStatus: ['paymentstatus', 'payment'],
  visaStatus: ['visastatus', 'visa'],
  createdDate: ['createddate', 'createdat', 'datecreated'],
  updatedDate: ['updateddate', 'updatedat', 'lastmodified'],
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function cellText(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    const cell = value as Record<string, unknown>;
    if (Array.isArray(cell.richText)) return cell.richText.map((part) => cellText((part as Record<string, unknown>).text)).join('');
    if (typeof cell.text === 'string') return cell.text;
    if (typeof cell.hyperlink === 'string') return cell.hyperlink;
    if (cell.result != null) return cellText(cell.result);
    return '';
  }
  return String(value).trim();
}

function mapRecord(record: Record<string, unknown>): Record<string, string> {
  const indexed = new Map<string, unknown>();
  for (const [key, value] of Object.entries(record)) indexed.set(normalizeHeader(key), value);
  const mapped: Record<string, string> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const value = aliases.map((alias) => indexed.get(alias)).find((candidate) => candidate != null && cellText(candidate) !== '');
    mapped[field] = cellText(value);
  }
  return mapped;
}

export function parseStudentCsv(text: string): Record<string, string>[] {
  const records = parseCsv(text, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: false,
    relax_column_count: false,
    max_record_size: 200_000,
  }) as Record<string, unknown>[];
  if (records.length > MAX_STUDENT_IMPORT_ROWS) throw new Error(`Import is limited to ${MAX_STUDENT_IMPORT_ROWS} rows.`);
  return records.map(mapRecord);
}

export async function parseStudentXlsx(bytes: Uint8Array): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(bytes) as any);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('The Excel workbook has no worksheet.');
  const headerRow = worksheet.getRow(1);
  const headers = headerRow.values as unknown[];
  const normalizedHeaders = headers.slice(1).map(cellText);
  const rows: Record<string, unknown>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values as unknown[];
    const record: Record<string, unknown> = {};
    normalizedHeaders.forEach((header, index) => { record[header] = values[index + 1]; });
    if (Object.values(record).some((value) => cellText(value) !== '')) rows.push(record);
  });
  if (rows.length > MAX_STUDENT_IMPORT_ROWS) throw new Error(`Import is limited to ${MAX_STUDENT_IMPORT_ROWS} rows.`);
  return rows.map(mapRecord);
}
