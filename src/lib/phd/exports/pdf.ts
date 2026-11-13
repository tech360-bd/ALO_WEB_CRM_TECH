/**
 * Minimal, dependency-free PDF writer for proposal/report exports.
 *
 * It produces a standards-compliant text PDF (Helvetica, A4) with proper
 * pagination, a draft banner and clickable-looking source URLs. It is
 * intentionally simple: no images, tables or embedded fonts. Non-Latin
 * characters are transliterated, and the limitation is reported to the caller
 * so a user is never told the file contains text it does not.
 */

export interface PdfSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface PdfDocumentInput {
  title: string;
  subtitle?: string;
  draftLabel?: string;
  metadata?: Array<{ label: string; value: string }>;
  sections: PdfSection[];
  footerNote?: string;
  pageSize?: 'A4';
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 54;
const BODY_SIZE = 10.5;
const LINE_HEIGHT = 14.5;

const WIDTHS: Record<string, number> = {
  ' ': 0.278, '!': 0.278, '"': 0.355, '#': 0.556, $: 0.556, '%': 0.889, '&': 0.667, "'": 0.191,
  '(': 0.333, ')': 0.333, '*': 0.389, '+': 0.584, ',': 0.278, '-': 0.333, '.': 0.278, '/': 0.278,
  ':': 0.278, ';': 0.278, '<': 0.584, '=': 0.584, '>': 0.584, '?': 0.556, '@': 1.015,
  A: 0.667, B: 0.667, C: 0.722, D: 0.722, E: 0.667, F: 0.611, G: 0.778, H: 0.722, I: 0.278,
  J: 0.5, K: 0.667, L: 0.556, M: 0.833, N: 0.722, O: 0.778, P: 0.667, Q: 0.778, R: 0.722,
  S: 0.667, T: 0.611, U: 0.722, V: 0.667, W: 0.944, X: 0.667, Y: 0.667, Z: 0.611,
  '[': 0.278, '\\': 0.278, ']': 0.278, '^': 0.469, _: 0.556, '`': 0.333,
  a: 0.556, b: 0.556, c: 0.5, d: 0.556, e: 0.556, f: 0.278, g: 0.556, h: 0.556, i: 0.222,
  j: 0.222, k: 0.5, l: 0.222, m: 0.833, n: 0.556, o: 0.556, p: 0.556, q: 0.556, r: 0.333,
  s: 0.5, t: 0.278, u: 0.556, v: 0.5, w: 0.722, x: 0.5, y: 0.5, z: 0.5,
  '{': 0.334, '|': 0.26, '}': 0.334, '~': 0.584,
};

function textWidth(text: string, size: number): number {
  let units = 0;
  for (const char of text) units += WIDTHS[char] ?? 0.55;
  return units * size;
}

const TRANSLITERATIONS: Record<string, string> = {
  '£': 'GBP ', '€': 'EUR ', '—': '-', '–': '-', '…': '...', '“': '"', '”': '"', '‘': "'", '’': "'",
  '•': '-', '≥': '>=', '≤': '<=', '×': 'x', '→': '->', '≈': '~', '−': '-', '±': '+/-',
  'é': 'e', 'è': 'e', 'ê': 'e', 'á': 'a', 'à': 'a', 'ä': 'a', 'ö': 'o', 'ü': 'u', 'ñ': 'n',
  'ç': 'c', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ß': 'ss', 'æ': 'ae', 'ø': 'o', 'å': 'a',
};

export function toWinAnsi(text: string): { text: string; replaced: number } {
  let replaced = 0;
  let out = '';
  for (const char of text) {
    if (TRANSLITERATIONS[char] !== undefined) {
      out += TRANSLITERATIONS[char];
      continue;
    }
    const code = char.codePointAt(0) ?? 63;
    if (code >= 32 && code <= 126) out += char;
    else if (code === 10 || code === 13) out += ' ';
    else {
      out += '?';
      replaced += 1;
    }
  }
  return { text: out, replaced };
}

function escapePdf(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrap(text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (textWidth(candidate, size) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

class PageBuilder {
  pages: string[][] = [];
  y = PAGE_HEIGHT - MARGIN;

  constructor() {
    this.pages.push([]);
  }

  private get current(): string[] {
    return this.pages[this.pages.length - 1];
  }

  newPage(): void {
    this.pages.push([]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private ensure(space: number): void {
    if (this.y - space < MARGIN + 26) this.newPage();
  }

  write(text: string, options: { font?: 'F1' | 'F2'; size?: number; indent?: number; leading?: number } = {}): void {
    const font = options.font ?? 'F1';
    const size = options.size ?? BODY_SIZE;
    const indent = options.indent ?? 0;
    const leading = options.leading ?? (size >= 14 ? size * 1.35 : LINE_HEIGHT);
    const { text: safe } = toWinAnsi(text);
    const lines = wrap(safe, size, PAGE_WIDTH - MARGIN * 2 - indent);
    for (const line of lines) {
      this.ensure(leading);
      this.current.push('BT', `/${font} ${size} Tf`, `${MARGIN + indent} ${this.y} Td`, `(${escapePdf(line)}) Tj`, 'ET');
      this.y -= leading;
    }
  }

  gap(amount = 6): void {
    this.y -= amount;
  }

  heading(text: string, level: 1 | 2 = 2): void {
    this.gap(level === 1 ? 10 : 8);
    this.ensure(28);
    this.write(text, { font: 'F2', size: level === 1 ? 17 : 12.5, leading: level === 1 ? 22 : 17 });
    this.gap(2);
  }

  rule(): void {
    this.ensure(8);
    this.current.push(`${MARGIN} ${this.y} m ${PAGE_WIDTH - MARGIN} ${this.y} l S`);
    this.y -= 8;
  }
}

export interface PdfOutput {
  buffer: Buffer;
  pageCount: number;
  replacedCharacters: number;
  warnings: string[];
}

export function buildPdf(input: PdfDocumentInput): PdfOutput {
  const builder = new PageBuilder();
  let replacedCharacters = 0;
  const warnings: string[] = [];

  const track = (text: string) => {
    const result = toWinAnsi(text);
    replacedCharacters += result.replaced;
    return result.text;
  };

  // Cover header
  builder.write(track(input.title), { font: 'F2', size: 20, leading: 26 });
  if (input.subtitle) builder.write(track(input.subtitle), { size: 11.5, leading: 16 });
  builder.gap(4);
  if (input.draftLabel) {
    builder.write(track(input.draftLabel), { font: 'F2', size: 9.5, leading: 13 });
  }
  builder.gap(2);
  builder.write(`Generated ${new Date().toISOString().slice(0, 10)} by ALO UK PhD Proposal Builder`, {
    size: 8.5,
    leading: 12,
  });
  builder.rule();

  if (input.metadata?.length) {
    for (const item of input.metadata) {
      builder.write(`${item.label}: ${item.value}`, { size: 9, leading: 12 });
    }
    builder.rule();
  }

  for (const section of input.sections) {
    if (section.heading) builder.heading(track(section.heading), 2);
    for (const paragraph of section.paragraphs ?? []) {
      const clean = paragraph.trim();
      if (!clean) continue;
      for (const chunk of clean.split(/\n{2,}/)) {
        builder.write(track(chunk), { size: BODY_SIZE });
        builder.gap(3);
      }
    }
    for (const bullet of section.bullets ?? []) {
      const lines = track(bullet).split(/\s+/);
      builder.write(`- ${lines.join(' ')}`, { size: BODY_SIZE, indent: 12 });
    }
    builder.gap(2);
  }

  if (input.footerNote) {
    builder.rule();
    builder.write(track(input.footerNote), { size: 8.5, leading: 12 });
  }

  const totalPages = builder.pages.length;
  builder.pages.forEach((ops, index) => {
    const footer = `Page ${index + 1} of ${totalPages} — draft export. Verify all sources before submission.`;
    ops.push(
      'BT',
      '/F1 8 Tf',
      `${MARGIN} ${MARGIN - 12} Td`,
      `(${escapePdf(escapePdfText(footer))}) Tj`,
      'ET',
    );
  });

  const objects: string[] = [];
  const pageIds: number[] = [];
  // Object allocation: 1 catalog, 2 pages, 3 font F1, 4 font F2, then page/content pairs, final info.
  const firstPageId = 5;
  builder.pages.forEach((_, index) => pageIds.push(firstPageId + index * 2));
  const contentIds = pageIds.map((id) => id + 1);
  const infoId = firstPageId + builder.pages.length * 2;

  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${builder.pages.length} >>`;
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
  objects[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

  builder.pages.forEach((ops, index) => {
    const pageId = pageIds[index];
    const contentId = contentIds[index];
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${Buffer.byteLength(ops.join('\n'))} >>\nstream\n${ops.join('\n')}\nendstream`;
  });

  objects[infoId] =
    `<< /Title (${escapePdf(toWinAnsi(input.title).text)}) /Producer (ALO UK PhD Proposal Builder) ` +
    `/CreationDate (D:${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}) >>`;

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets: Record<number, number> = {};
  for (let id = 1; id <= infoId; id += 1) {
    const body = objects[id];
    if (!body) continue;
    offsets[id] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${id} 0 obj\n${body}\nendobj\n`;
  }
  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  const maxId = infoId;
  pdf += `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= maxId; id += 1) {
    const offset = offsets[id];
    pdf += `${String(offset ?? 0).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  if (replacedCharacters > 0) {
    warnings.push(`${replacedCharacters} character(s) outside the PDF Latin-1 set were replaced with “?”. Check names and specialist symbols.`);
  }
  warnings.push('PDF export uses embedded-safe standard fonts and is text-searchable. It is a draft and must be checked before submission.');

  return {
    buffer: Buffer.from(pdf, 'latin1'),
    pageCount: builder.pages.length,
    replacedCharacters,
    warnings,
  };
}

function escapePdfText(text: string): string {
  return toWinAnsi(text).text;
}

/** Re-exported for the PDF text extractor round-trip test. */
export const _internals = { PAGE_WIDTH, PAGE_HEIGHT, MARGIN, BODY_SIZE, LINE_HEIGHT };
