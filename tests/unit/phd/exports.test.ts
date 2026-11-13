import { describe, expect, it } from 'vitest';
import { deflateSync } from 'node:zlib';
import { buildPdf } from '@/lib/phd/exports/pdf';
import { buildDocx } from '@/lib/phd/exports/docx';
import { createZip, readZip } from '@/lib/phd/exports/zip';
import { toCsv } from '@/lib/phd/exports/csv';
import { buildWorkbook } from '@/lib/phd/exports/xlsx';
import { buildProposalDocuments } from '@/lib/phd/exports/proposal';
import { extractPdfPages } from '@/lib/phd/pdf/extract';

describe('PDF writer and text extraction round-trip', () => {
  const input = {
    title: 'Artificial intelligence adoption in UK small retailers',
    subtitle: 'Draft research proposal',
    draftLabel: 'DRAFT — institutional requirements not yet verified.',
    metadata: [{ label: 'Prepared', value: '25 October 2026' }],
    sections: [
      { heading: '1. Problem statement', paragraphs: ['Small retailers face uneven access to artificial intelligence tools. This paragraph is long enough to wrap across multiple lines in the exported PDF document.'] },
      { heading: '2. Methodology', bullets: ['Representative survey of 300 small retailers', 'Fifteen semi-structured interviews with owners'] },
    ],
    footerNote: 'Draft export. Verify every source before submission.',
  };

  it('produces a valid PDF header, xref and EOF marker', () => {
    const output = buildPdf(input);
    const text = output.buffer.toString('latin1');
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('/Type /Catalog');
    expect(text).toContain('xref');
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(output.pageCount).toBeGreaterThanOrEqual(1);
    expect(output.warnings.join(' ').toLowerCase()).toContain('draft');
  });

  it('round-trips its own text through the PDF extractor', () => {
    const output = buildPdf(input);
    const extracted = extractPdfPages(output.buffer);
    expect(extracted.pageCount).toBe(output.pageCount);
    const allText = extracted.pages.map((page) => page.text).join('\n');
    expect(extracted.extractable).toBe(true);
    expect(allText).toContain('Artificial intelligence adoption in UK small retailers');
    expect(allText).toContain('Problem statement');
    expect(allText).toContain('Representative survey of 300 small retailers');
  });

  it('decodes Flate-compressed content streams and reports page numbers', () => {
    const content = 'BT /F1 12 Tf 72 720 Td (Compressed page text that is long enough to extract) Tj ET';
    const compressed = deflateSync(Buffer.from(content, 'latin1'));
    const pieces: Buffer[] = [];
    const push = (value: string) => pieces.push(Buffer.from(value, 'latin1'));
    push('%PDF-1.4\n');
    push('1 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 3 0 R >>\nendobj\n');
    push(`3 0 obj\n<< /Length ${compressed.length} /Filter /FlateDecode >>\nstream\n`);
    pieces.push(compressed);
    push('\nendstream\nendobj\n');
    push('trailer\n<< /Root 1 0 R >>\n%%EOF\n');
    const result = extractPdfPages(Buffer.concat(pieces));
    expect(result.usedFlate).toBe(true);
    expect(result.pageCount).toBe(1);
    expect(result.pages[0].text).toContain('Compressed page text');
  });

  it('reports non-Latin characters instead of silently corrupting them', () => {
    const output = buildPdf({ title: 'Тема исследование', sections: [] });
    expect(output.replacedCharacters).toBeGreaterThan(0);
    expect(output.warnings.join(' ')).toContain('replaced');
  });

  it('falls back to MANUAL_REQUIRED guidance when a PDF has no extractable text', () => {
    const result = extractPdfPages(Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Page >>\nendobj\n%%EOF', 'latin1'));
    expect(result.extractable).toBe(false);
    expect(result.warnings.join(' ').toLowerCase()).toContain('manually');
  });
});

describe('ZIP and DOCX packaging', () => {
  it('creates and reads a store-only zip with CRC32 validation', () => {
    const buffer = createZip([
      { path: 'hello.txt', data: Buffer.from('hello world') },
      { path: 'nested/data.txt', data: Buffer.from('nested') },
    ]);
    const zip = readZip(buffer);
    expect(zip.valid).toBe(true);
    expect(zip.entries.map((entry) => entry.path)).toEqual(['hello.txt', 'nested/data.txt']);
    expect(zip.entries[0].data?.toString()).toBe('hello world');
  });

  it('detects a corrupted zip entry', () => {
    const buffer = createZip([{ path: 'a.txt', data: Buffer.from('abcdef') }]);
    const corrupted = Buffer.from(buffer);
    const index = corrupted.indexOf(Buffer.from('abcdef'));
    corrupted[index] = 0x00;
    const zip = readZip(corrupted);
    expect(zip.valid).toBe(false);
  });

  it('builds a Word-openable DOCX package with the expected OOXML parts', () => {
    const buffer = buildDocx({
      title: 'PhD research proposal',
      subtitle: 'Example University',
      draftLabel: 'Draft — requirements not verified.',
      metadata: [{ label: 'Word count', value: '1,234' }],
      sections: [
        { heading: 'Problem statement', paragraphs: ['This is a paragraph of proposal text.'] },
        { heading: 'Objectives', bullets: ['Objective one', 'Objective two'] },
      ],
      footerNote: 'Draft export.',
    });
    const zip = readZip(buffer);
    expect(zip.valid).toBe(true);
    const paths = zip.entries.map((entry) => entry.path);
    expect(paths).toContain('[Content_Types].xml');
    expect(paths).toContain('_rels/.rels');
    expect(paths).toContain('word/document.xml');
    expect(paths).toContain('word/_rels/document.xml.rels');
    expect(paths).toContain('word/styles.xml');
    expect(paths).toContain('word/numbering.xml');

    const contentTypes = zip.entries.find((entry) => entry.path === '[Content_Types].xml')!.data!.toString();
    expect(contentTypes).toContain('wordprocessingml.document.main+xml');
    const document = zip.entries.find((entry) => entry.path === 'word/document.xml')!.data!.toString();
    expect(document).toContain('PhD research proposal');
    expect(document).toContain('Draft');
    expect(document).toContain('Problem statement');
    expect(document).toContain('Objective one');
  });
});

describe('Tabular exports', () => {
  it('escapes CSV values and adds a UTF-8 BOM', () => {
    const csv = toCsv(
      [{ name: 'Doe, Jane', note: 'He said "hello"', amount: 100 }],
      [
        { header: 'Name', value: (row: { name: string }) => row.name },
        { header: 'Note', value: (row: { note: string }) => row.note },
        { header: 'Amount (£)', value: (row: { amount: number }) => row.amount },
      ],
    );
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"Doe, Jane"');
    expect(csv).toContain('"He said ""hello"""');
    expect(csv).toContain('Amount (£)');
  });

  it('builds a real XLSX workbook that exceljs can read back', async () => {
    const { buffer, sheetNames, rowCounts } = await buildWorkbook([{
      name: 'Funding tracker',
      columns: [
        { header: 'Opportunity', key: 'name' },
        { header: 'Status', key: 'status' },
      ],
      rows: [
        { name: 'Example Doctoral Scholarship', status: 'Needs verification' },
        { name: 'Second opportunity', status: 'Expired' },
      ],
    }]);
    expect(buffer.subarray(0, 2).toString('latin1')).toBe('PK');
    expect(sheetNames).toEqual(['Funding tracker']);
    expect(rowCounts['Funding tracker']).toBe(2);

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet('Funding tracker')!;
    expect(sheet.getRow(1).getCell(1).value).toBe('Opportunity');
    expect(sheet.getRow(2).getCell(1).value).toBe('Example Doctoral Scholarship');
    expect(sheet.getRow(3).getCell(2).value).toBe('Expired');
  });
});

describe('Full proposal export', () => {
  const input = {
    title: 'Artificial intelligence adoption and operational performance in UK small retailers',
    universityName: 'Example University',
    programmeName: 'PhD Business and Management',
    draftLabel: 'Draft prepared against unverified requirements.',
    requirements: { wordLimit: null, referencingStyle: 'NOT_SPECIFIED', verificationStatus: 'NOT_YET_VERIFIED' },
    sections: [
      { sectionKey: 'title', title: 'Working title', content: 'Artificial intelligence adoption and operational performance in UK small retailers' },
      { sectionKey: 'problem', title: 'Problem statement', content: 'Small retailers face uneven access to artificial intelligence tools.' },
      { sectionKey: 'bibliography', title: 'References', content: 'Doe, J. (2024) Artificial intelligence in retail. Journal of Retail Operations.' },
    ],
    sources: [{
      title: 'Artificial intelligence in retail operations',
      authors: 'Doe, J.',
      year: 2024,
      venue: 'Journal of Retail Operations',
      doi: '10.1234/jro.2024.001',
      url: 'https://doi.org/10.1234/jro.2024.001',
      verificationStatus: 'VERIFIED_OFFICIAL',
    }],
    citations: [{ rawText: '(Doe, 2024)', sectionKey: 'problem', sourceTitle: 'Artificial intelligence in retail operations', isValid: true }],
    wordCount: 900,
    qualitySummary: '0 errors, 2 warnings, readiness NEEDS_WORK.',
  };

  it('labels exports as drafts and includes a source-verification appendix', () => {
    const documents = buildProposalDocuments(input);
    expect(documents.docx.length).toBeGreaterThan(3000);
    expect(documents.pdf.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(documents.metadata).toContainEqual({ label: 'Requirement verification', value: 'NOT_YET_VERIFIED' });

    const zip = readZip(documents.docx);
    const document = zip.entries.find((entry) => entry.path === 'word/document.xml')!.data!.toString();
    expect(document).toContain('Draft');
    expect(document.toLowerCase()).toContain('source');
    expect(document).toContain('Journal of Retail Operations');
  });

  it('produces a PDF containing all 20 section headings from real data', () => {
    const sections = Array.from({ length: 20 }, (_, index) => ({
      sectionKey: `s${index}`,
      title: `Section ${index + 1}`,
      content: `Content for section ${index + 1}.`,
    }));
    const documents = buildProposalDocuments({ ...input, sections });
    const extracted = extractPdfPages(documents.pdf.buffer);
    const text = extracted.pages.map((page) => page.text).join('\n');
    expect(text).toContain('Section 1');
    expect(text).toContain('Section 20');
  });
});
