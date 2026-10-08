import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

function storageRoot(): string {
  const configured = process.env.STORAGE_POOL_C;
  if (process.env.NODE_ENV === 'production') {
    if (!configured || !path.isAbsolute(configured)) {
      throw new Error('STORAGE_POOL_C must be an absolute, persistent private storage path in production');
    }
    const root = path.resolve(configured);
    const publicRoot = path.resolve(process.cwd(), 'public');
    if (root === publicRoot || root.startsWith(`${publicRoot}${path.sep}`)) {
      throw new Error('STORAGE_POOL_C must not be inside the public web root');
    }
    return root;
  }
  if (configured) {
    if (!path.isAbsolute(configured)) throw new Error('STORAGE_POOL_C must be absolute');
    return path.resolve(configured);
  }
  return path.join(os.tmpdir(), 'alo-education-private-documents');
}

function safeStoredName(value: string): string {
  if (!value || value !== path.basename(value) || value.includes('..') || /[\\/\0]/.test(value)) {
    throw new Error('Invalid stored file identifier');
  }
  return value;
}

export async function storePrivateFile(bytes: Uint8Array, originalName: string) {
  if (!bytes.byteLength) throw new Error('Cannot store an empty file');
  const root = storageRoot();
  await mkdir(root, { recursive: true, mode: 0o700 });
  const extension = path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 12);
  const storedName = `${randomUUID()}${extension}`;
  const finalPath = path.join(root, storedName);
  const tempPath = path.join(root, `.${storedName}.tmp`);
  const handle = await open(tempPath, 'wx', 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  } finally {
    await handle.close();
  }
  try {
    await rename(tempPath, finalPath);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
  return {
    storagePath: storedName,
    fileHash: createHash('sha256').update(bytes).digest('hex'),
    fileSize: bytes.byteLength,
  };
}

export async function readPrivateFile(storedPath: string): Promise<Buffer> {
  const name = safeStoredName(storedPath);
  const root = storageRoot();
  const resolvedRoot = path.resolve(root);
  const filePath = path.resolve(resolvedRoot, name);
  if (!filePath.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error('Invalid storage path');
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) throw new Error('Stored object is not a file');
  return readFile(filePath);
}

export async function removePrivateFile(storedPath: string): Promise<void> {
  const name = safeStoredName(storedPath);
  const root = path.resolve(storageRoot());
  const filePath = path.resolve(root, name);
  if (!filePath.startsWith(`${root}${path.sep}`)) throw new Error('Invalid storage path');
  await rm(filePath, { force: true });
}
