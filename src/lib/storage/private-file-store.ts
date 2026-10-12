import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, realpath, rename, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function storageRoot(): string {
  const configured = process.env.STORAGE_POOL_C;
  if (process.env.NODE_ENV === 'production') {
    if (!configured || !path.isAbsolute(configured)) {
      throw new Error('STORAGE_POOL_C must be an absolute, persistent private storage path in production');
    }
    const root = path.resolve(configured);
    return root;
  }
  if (configured) {
    if (!path.isAbsolute(configured)) throw new Error('STORAGE_POOL_C must be absolute');
    return path.resolve(configured);
  }
  return path.join(os.tmpdir(), 'alo-education-private-documents');
}

// Resolve operator-managed mount aliases before checking the security boundary.
// Below this canonical root only flat generated identifiers are accepted; leaf
// reads use O_NOFOLLOW. The mount and its ancestors must remain operator-owned:
// this is not protection against a privileged concurrent mount replacement.
async function canonicalPath(value: string): Promise<string> {
  try { return await realpath(value); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const parent = path.dirname(value);
    if (parent === value) throw error;
    return path.join(await canonicalPath(parent), path.basename(value));
  }
}

async function validatedStorageRoot(create = false): Promise<string> {
  const root = await canonicalPath(path.resolve(storageRoot()));
  const contains = (parent: string, child: string) =>
    parent === child || child.startsWith(parent.endsWith(path.sep) ? parent : `${parent}${path.sep}`);
  for (const webDirectory of ['public', 'public_html', '.next']) {
    const webRoot = path.resolve(process.cwd(), webDirectory);
    const realWebRoot = await canonicalPath(webRoot);
    if ([webRoot, realWebRoot].some(web => contains(web, root) || contains(root, web))) {
      throw new Error('Private storage must not overlap a web root');
    }
  }
  if (create) await mkdir(root, { recursive: true, mode: 0o700 });
  // Detect a substituted root between validation and creation; operations use
  // the canonical path rather than following the configured alias again.
  if (await realpath(root) !== root) throw new Error('Private storage root changed during validation');
  return root;
}

function safeStoredName(value: string): string {
  if (!value || value !== path.basename(value) || value.includes('..') || /[\\/\0]/.test(value)) {
    throw new Error('Invalid stored file identifier');
  }
  return value;
}

export async function storePrivateFile(bytes: Uint8Array, originalName: string) {
  if (!bytes.byteLength) throw new Error('Cannot store an empty file');
  const root = await validatedStorageRoot(true);
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
  const root = await validatedStorageRoot();
  const resolvedRoot = path.resolve(root);
  const filePath = path.resolve(resolvedRoot, name);
  if (!filePath.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error('Invalid storage path');
  // Read through the same descriptor that was checked. stat()+readFile() can
  // follow a substituted symlink or race a path replacement between calls.
  // O_NONBLOCK lets us reject a FIFO rather than waiting on its writer.
  const handle = await open(filePath, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    if (!(await handle.stat()).isFile()) throw new Error('Stored object is not a file');
    return await handle.readFile();
  } finally { await handle.close(); }
}

export async function removePrivateFile(storedPath: string): Promise<void> {
  const name = safeStoredName(storedPath);
  const root = await validatedStorageRoot();
  const filePath = path.resolve(root, name);
  if (!filePath.startsWith(`${root}${path.sep}`)) throw new Error('Invalid storage path');
  await rm(filePath, { force: true });
}
