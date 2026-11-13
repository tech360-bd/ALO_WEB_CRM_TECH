import ExcelJS from 'exceljs';

export interface WorkbookSheet {
  name: string;
  columns: Array<{ header: string; key: string; width?: number }>;
  rows: Array<Record<string, string | number | null | undefined>>;
}

export interface WorkbookResult {
  buffer: Buffer;
  sheetNames: string[];
  rowCounts: Record<string, number>;
}

/** XLSX export from real saved records (exceljs is already a project dependency). */
export async function buildWorkbook(sheets: WorkbookSheet[]): Promise<WorkbookResult> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ALO UK PhD Proposal Builder';
  workbook.created = new Date();
  const rowCounts: Record<string, number> = {};
  const sheetNames: string[] = [];

  for (const sheet of sheets) {
    const safeName = sheet.name.replace(/[\\/*?:[\]]/g, ' ').slice(0, 31) || 'Sheet';
    const worksheet = workbook.addWorksheet(safeName);
    worksheet.columns = sheet.columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: column.width ?? Math.min(48, Math.max(14, column.header.length + 4)),
    }));
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF7' } };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const row of sheet.rows) worksheet.addRow(row);
    worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columns.length } };
    rowCounts[safeName] = sheet.rows.length;
    sheetNames.push(safeName);
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return { buffer: Buffer.from(arrayBuffer), sheetNames, rowCounts };
}
