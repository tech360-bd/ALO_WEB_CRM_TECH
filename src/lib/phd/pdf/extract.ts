import { inflateSync } from 'node:zlib';

/**
 * Page-aware text extraction for text-based PDFs.
 *
 * This is a dependency-free extractor designed for commission-structure PDFs
 * and uploaded evidence. It supports uncompressed and Flate-compressed content
 * streams and the common Tj/TJ/'/" text operators. It deliberately does NOT
 * pretend to be a full PDF parser: encrypted files, scanned images, and some
 * object-stream layouts will yield no text. In those cases the caller must fall
 * back to manual page entry and the document is marked MANUAL_REQUIRED.
 *
 * Every page keeps its original 1-based page number so a quoted commission
 * condition can be traced back to a specific page.
 */

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface PdfExtractionResult {
  pageCount: number;
  pages: ExtractedPage[];
  usedFlate: boolean;
  warnings: string[];
  extractable: boolean;
}

function decodePdfString(raw: string): string {
  let out = '';
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (char !== '\\') {
      out += char;
      continue;
    }
    const next = raw[i + 1];
    if (next === undefined) break;
    switch (next) {
      case 'n': out += '\n'; i += 1; break;
      case 'r': out += '\r'; i += 1; break;
      case 't': out += '\t'; i += 1; break;
      case 'b': out += '\b'; i += 1; break;
      case 'f': out += '\f'; i += 1; break;
      case '(': out += '('; i += 1; break;
      case ')': out += ')'; i += 1; break;
      case '\\': out += '\\'; i += 1; break;
      case '\n': i += 1; break;
      case '\r': i += 1; if (raw[i + 1] === '\n') i += 1; break;
      default: {
        if (/[0-7]/.test(next)) {
          let octal = '';
          let j = i + 1;
          while (j < raw.length && /[0-7]/.test(raw[j]) && octal.length < 3) {
            octal += raw[j];
            j += 1;
          }
          out += String.fromCharCode(parseInt(octal, 8));
          i = j - 1;
        } else {
          out += next;
          i += 1;
        }
      }
    }
  }
  return out;
}

function extractTextFromContent(content: string): string {
  const pieces: Array<{ index: number; text: string; breakAfter?: boolean }> = [];
  const pattern = new RegExp(
    [
      '\\(((?:\\\\.|[^\\\\()])*)\\)\\s*Tj',
      '\\[((?:[^\\[\\]]|\\\\.)*)\\]\\s*TJ',
      '\\(((?:\\\\.|[^\\\\()])*)\\)\\s*\'',
      '\\(((?:\\\\.|[^\\\\()])*)\\)\\s*"',
      '(T\\*|Td|TD|ET|BT)',
    ].join('|'),
    'g',
  );

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    if (match[1] !== undefined) {
      pieces.push({ index: match.index, text: decodePdfString(match[1]) });
    } else if (match[2] !== undefined) {
      const inner = match[2];
      const stringPattern = /\(((?:\\.|[^\\()])*)\)/g;
      let innerMatch: RegExpExecArray | null;
      let joined = '';
      while ((innerMatch = stringPattern.exec(inner)) !== null) {
        joined += decodePdfString(innerMatch[1]);
      }
      pieces.push({ index: match.index, text: joined });
    } else if (match[3] !== undefined || match[4] !== undefined) {
      pieces.push({ index: match.index, text: decodePdfString(match[3] ?? match[4] ?? '') });
    } else if (match[5] !== undefined) {
      if (['Td', 'TD', 'T*', 'ET'].includes(match[5])) {
        pieces.push({ index: match.index, text: '\n' });
      }
    }
  }

  let text = '';
  for (const piece of pieces) {
    if (piece.text === '\n') {
      if (!text.endsWith('\n')) text += '\n';
    } else {
      text += piece.text;
      if (!piece.text.endsWith(' ')) text += ' ';
    }
  }
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface RawObject {
  id: number;
  dict: string;
  stream: Buffer | null;
}

function readObjects(buffer: Buffer): RawObject[] {
  const latin = buffer.toString('latin1');
  const objects: RawObject[] = [];
  const objectPattern = /(\d+)\s+0\s+obj\b([\s\S]*?)\bendobj/g;
  let match: RegExpExecArray | null;
  while ((match = objectPattern.exec(latin)) !== null) {
    const id = Number(match[1]);
    const body = match[2];
    const bodyStart = match.index + match[0].indexOf(body);
    const streamIndex = body.indexOf('stream');
    let stream: Buffer | null = null;
    let dict = body;
    if (streamIndex !== -1) {
      dict = body.slice(0, streamIndex);
      const contentStart = bodyStart + streamIndex + 'stream'.length;
      const endStreamIndex = body.lastIndexOf('endstream');
      const contentEnd = endStreamIndex === -1 ? bodyStart + body.length : bodyStart + endStreamIndex;
      const skip = buffer.slice(contentStart, contentStart + 2).toString('latin1') === '\r\n' ? 2 : 1;
      stream = buffer.slice(contentStart + skip, Math.max(contentStart + skip, contentEnd));
      // Trim the single EOL that the PDF grammar places before `endstream`.
      if (stream.length && stream[stream.length - 1] === 0x0a) stream = stream.slice(0, -1);
      if (stream.length && stream[stream.length - 1] === 0x0d) stream = stream.slice(0, -1);
    }
    objects.push({ id, dict, stream });
  }
  return objects;
}

export function extractPdfPages(buffer: Buffer): PdfExtractionResult {
  const warnings: string[] = [];
  const objects = readObjects(buffer);
  const objectById = new Map(objects.map((object) => [object.id, object]));
  const pageObjects = objects.filter((object) => /\/Type\s*\/Page\b(?!s)/.test(object.dict));

  const pages: ExtractedPage[] = [];
  let usedFlate = false;

  const decodeStream = (raw: Buffer, dict: string): string | null => {
    if (/\/Filter\s*\/FlateDecode/.test(dict)) {
      usedFlate = true;
      try {
        return inflateSync(raw).toString('latin1');
      } catch {
        try {
          return inflateSync(raw, { finishFlush: 2 }).toString('latin1');
        } catch {
          warnings.push('A compressed content stream could not be decompressed.');
          return null;
        }
      }
    }
    if (/\/Filter/.test(dict)) {
      const filter = /\/Filter\s*\/(\w+)/.exec(dict)?.[1] ?? 'unknown';
      warnings.push(`Unsupported PDF stream filter: ${filter}.`);
      return null;
    }
    return raw.toString('latin1');
  };

  if (pageObjects.length) {
    pageObjects.forEach((page, index) => {
      const contentsRef = /\/Contents\s*(\[[^\]]*\]|\d+\s+0\s+R)/.exec(page.dict)?.[1] ?? '';
      const ids = [...contentsRef.matchAll(/(\d+)\s+0\s+R/g)].map((match) => Number(match[1]));
      let text = '';
      for (const id of ids) {
        const contentObject = objectById.get(id);
        if (!contentObject?.stream) continue;
        const decoded = decodeStream(contentObject.stream, contentObject.dict);
        if (decoded) text += `\n${extractTextFromContent(decoded)}`;
      }
      pages.push({ pageNumber: index + 1, text: text.trim() });
    });
  } else {
    const text = objects
      .filter((object) => object.stream)
      .map((object) => {
        const decoded = object.stream ? decodeStream(object.stream, object.dict) : null;
        return decoded ? extractTextFromContent(decoded) : '';
      })
      .filter(Boolean)
      .join('\n\n');
    if (text) pages.push({ pageNumber: 1, text });
    else warnings.push('No page objects or extractable text streams were found.');
  }

  const extractable = pages.some((page) => page.text.replace(/\s/g, '').length > 20);
  if (!extractable) {
    warnings.push(
      'No meaningful text could be extracted. The PDF may be scanned, encrypted or use an unsupported layout. Enter the conditions manually and cite the page number.',
    );
  }

  return {
    pageCount: pages.length,
    pages,
    usedFlate,
    warnings,
    extractable,
  };
}

export function normaliseExtractedText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
