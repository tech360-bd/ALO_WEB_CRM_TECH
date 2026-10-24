import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { parseStudentCsv, parseStudentXlsx } from '@/lib/student-import-file';

describe('student import file parser', () => {
  it('parses quoted CSV fields, commas, and line breaks without splitting rows', () => {
    const rows = parseStudentCsv('\uFEFFFull Name,Email,Notes\r\n"Ayesha Rahman",ayesha@example.com,"Called, then replied\nnext day"\r\n');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ studentName: 'Ayesha Rahman', email: 'ayesha@example.com' });
    expect(rows[0].notes).toBe('Called, then replied\nnext day');
  });

  it('maps supported legacy aliases from the first worksheet in an XLSX workbook', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Students');
    sheet.addRow(['Legacy ID', 'Applicant Name', 'WhatsApp Number', 'Preferred Country']);
    sheet.addRow(['old-12', 'Nusrat Jahan', '+8801700000000', 'Australia']);
    const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());

    await expect(parseStudentXlsx(bytes)).resolves.toEqual([
      expect.objectContaining({
        oldCrmId: 'old-12',
        studentName: 'Nusrat Jahan',
        whatsapp: '+8801700000000',
        countryInterest: 'Australia',
      }),
    ]);
  });

  it('rejects malformed CSV quoting', () => {
    expect(() => parseStudentCsv('name,email\n"unterminated,person@example.com')).toThrow();
  });
});
