import { lstatSync, readdirSync } from 'node:fs';
import path from 'node:path';

// Metadata-only, non-destructive packaging gate. Never reads upload bytes or
// follows symlinks. No automatic migration/deletion: operator review required.
export function assertNoPublicUploads(publicRoot) {
  let info;
  try { info = lstatSync(publicRoot); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  if (info.isSymbolicLink() || !info.isDirectory()) {
    throw new Error('Public asset packaging blocked: root must be a real directory. Review storage mapping.');
  }
  for (const entry of readdirSync(publicRoot, { withFileTypes: true })) {
    if (entry.name.toLowerCase() === 'uploads' || entry.isSymbolicLink()) {
      throw new Error('Public asset packaging blocked: uploads directory or symlink detected. No files changed; backup and approved migration plan required.');
    }
    if (entry.isDirectory()) assertNoPublicUploads(path.join(publicRoot, entry.name));
  }
}
