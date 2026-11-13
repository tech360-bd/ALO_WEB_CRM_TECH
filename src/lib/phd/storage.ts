import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_LIMITS } from './constants';
import { PhdAccessError } from './auth';
import { readZip } from './exports/zip';

/**
 * Private document storage for the PhD module.
 *
 * - Files live under storage/phd (never under public/), so there is no public
 *   URL. Downloads require an authenticated, ownership-checked API request.
 * - Extensions AND file signatures are validated; the client MIME type alone is
 *   never trusted.
 * - Stored filenames are random UUIDs; user-supplied names remain metadata only.
 */

/**
 * Root of the private document store.
 *
 * Defaults to `storage/phd` under the working directory. `PHD_STORAGE_ROOT`
 * exists so tests (and a host with a separate data volume) can point at a
 * different directory without changing behaviour when it is unset.
 */
function resolveRoot(): string {
  return process.env.PHD_STORAGE_ROOT
    ? path.resolve(process.env.PHD_STORAGE_ROOT)
    : path.join(process.cwd(), 'storage', 'phd');
}
export const STORAGE_PREFIX = 'phd';

export interface StoredFile {
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  extension: string;
}

const EXTENSION_MIME: Record<string, string[]> = {
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'],
  txt: ['text/plain', 'application/octet-stream'],
  csv: ['text/csv', 'text/plain', 'application/octet-stream'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
};

function extensionOf(filename: string): string {
  const ext = path.extname(filename).replace('.', '').toLowerCase();
  if (!UPLOAD_LIMITS.allowedExtensions.includes(ext as (typeof UPLOAD_LIMITS.allowedExtensions)[number])) {
    throw new PhdAccessError(`File type “.${ext || 'unknown'}” is not allowed.`, 415);
  }
  return ext;
}

export function validateFileSignature(extension: string, buffer: Buffer): void {
  const starts = (bytes: number[]) => bytes.every((byte, index) => buffer[index] === byte);
  switch (extension) {
    case 'pdf':
      if (!buffer.subarray(0, 5).toString('latin1').startsWith('%PDF-')) {
        throw new PhdAccessError('The file does not look like a PDF (missing %PDF header).', 415);
      }
      break;
    case 'docx':
    case 'xlsx': {
      if (!starts([0x50, 0x4b, 0x03, 0x04])) {
        throw new PhdAccessError('The file is not a valid OOXML (ZIP) container.', 415);
      }
      const zip = readZip(buffer);
      if (!zip.valid || !zip.entries.some((entry) => entry.path === '[Content_Types].xml')) {
        throw new PhdAccessError('The OOXML container is missing [Content_Types].xml.', 415);
      }
      break;
    }
    case 'png':
      if (!starts([0x89, 0x50, 0x4e, 0x47])) throw new PhdAccessError('Invalid PNG signature.', 415);
      break;
    case 'jpg':
    case 'jpeg':
      if (!starts([0xff, 0xd8, 0xff])) throw new PhdAccessError('Invalid JPEG signature.', 415);
      break;
    case 'txt':
    case 'csv':
      if (buffer.includes(0)) throw new PhdAccessError('Text uploads must not contain null bytes.', 415);
      break;
    default:
      throw new PhdAccessError('Unsupported file type.', 415);
  }
}

export interface SaveOptions {
  scope: 'documents' | 'commission';
  ownerSegment: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export async function savePhdFile(options: SaveOptions): Promise<StoredFile> {
  const { buffer, filename, mimeType, scope, ownerSegment } = options;
  if (!buffer.length) throw new PhdAccessError('The uploaded file is empty.', 400);
  if (buffer.length > UPLOAD_LIMITS.maxBytes) {
    throw new PhdAccessError(`File exceeds the ${Math.round(UPLOAD_LIMITS.maxBytes / 1024 / 1024)} MB limit.`, 413);
  }
  const extension = extensionOf(filename);
  const allowedMimes = EXTENSION_MIME[extension] ?? [];
  if (!allowedMimes.includes(mimeType)) {
    throw new PhdAccessError(`The declared MIME type does not match .${extension}.`, 415);
  }
  validateFileSignature(extension, buffer);

  const safeOwner = ownerSegment.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  if (!safeOwner) throw new PhdAccessError('Invalid storage scope.', 400);

  const uuid = randomUUID();
  const relative = `${scope}/${safeOwner}/${uuid}.${extension}`;
  const storageKey = `${STORAGE_PREFIX}/${relative}`;
  const root = resolveRoot();
  const absolute = path.join(root, relative);
  const directory = path.dirname(absolute);
  if (!directory.startsWith(root + path.sep)) throw new PhdAccessError('Invalid storage path.', 400);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(absolute, buffer, { mode: 0o600 });

  return {
    storageKey,
    originalName: path.basename(filename).slice(0, 200),
    mimeType,
    sizeBytes: buffer.length,
    checksum: createHash('sha256').update(buffer).digest('hex'),
    extension,
  };
}

export function resolveStoragePath(storageKey: string): string {
  if (!new RegExp(`^${STORAGE_PREFIX}/(documents|commission)/[a-zA-Z0-9_-]+/[a-zA-Z0-9._-]+$`).test(storageKey)) {
    throw new PhdAccessError('Invalid document reference.', 400);
  }
  const relative = storageKey.slice(STORAGE_PREFIX.length + 1);
  const root = resolveRoot();
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(root + path.sep)) throw new PhdAccessError('Invalid document path.', 400);
  return absolute;
}

export async function readPhdFile(storageKey: string): Promise<Buffer> {
  const absolute = resolveStoragePath(storageKey);
  try {
    return await readFile(absolute);
  } catch {
    throw new PhdAccessError('The stored file is unavailable. It may have been removed under the retention policy.', 410);
  }
}

export async function deletePhdFile(storageKey: string): Promise<void> {
  const absolute = resolveStoragePath(storageKey);
  try {
    await unlink(absolute);
  } catch {
    // A missing file is already deleted; do not fail the retention operation.
  }
}

export function storageRoot(): string {
  return resolveRoot();
}
