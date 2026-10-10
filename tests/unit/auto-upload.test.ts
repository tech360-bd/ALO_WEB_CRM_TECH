import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Canonical Student.studentId contract: AE-YYYYXXXXXX.
const CANONICAL_REGEX = /^AE-(\d{4})(\d{6})$/;
function isCanonicalStudentCode(value: string) { return typeof value === 'string' && CANONICAL_REGEX.test(value); }

describe('canonical Student ID format', () => {
  it('validates AE-YYYYXXXXXX', () => {
    expect(isCanonicalStudentCode('AE-2025000001')).toBe(true);
    expect(isCanonicalStudentCode('AE-2026000001')).toBe(true);
    expect(isCanonicalStudentCode('AE-2025XXXX')).toBe(false);
    expect(isCanonicalStudentCode('ALO-S-123')).toBe(false);
    expect(isCanonicalStudentCode('ae-2025000001')).toBe(false);
    expect(isCanonicalStudentCode('')).toBe(false);
  });

  it('uses a current-year prefix and bounded collision retries in the canonical allocator', async () => {
    const canonical = readFileSync('src/lib/student/canonical-student.ts', 'utf8');
    expect(canonical).toContain('AE-${year}');
    expect(canonical).toContain('MAX_CODE_RETRIES');
  });
});

describe('private document upload endpoints', () => {
  it('does not manufacture Student IDs, profiles, or Applications from a document upload', () => {
    const route = readFileSync('src/app/api/documents/auto-upload/route.ts', 'utf8');
    expect(route).toContain('Document upload does not create applications');
    expect(route).not.toContain('createCanonicalStudent');
    expect(route).not.toContain('db.application.create');
    expect(route).toContain('Student not found.');
  });

  it('validates actual file signatures before private storage', () => {
    const route = readFileSync('src/app/api/documents/auto-upload/route.ts', 'utf8');
    const readBytes = route.indexOf('Buffer.from(await file.arrayBuffer())');
    const signatureCheck = route.indexOf('if (!detectedMime');
    const storeBytes = route.indexOf('storePrivateFile(fileBytes, file.name)');
    expect(readBytes).toBeGreaterThanOrEqual(0);
    expect(signatureCheck).toBeGreaterThan(readBytes);
    expect(storeBytes).toBeGreaterThan(signatureCheck);
    expect(route).toContain('MAX_FILE_BYTES = 20 * 1024 * 1024');
    expect(route).toContain('fileHash: stored.fileHash');
  });

  it('uses the authenticated shared document handler and counselor upload retains private storage', () => {
    const route = readFileSync('src/app/api/documents/auto-upload/route.ts', 'utf8');
    const counselorRoute = readFileSync('src/app/api/counselor/documents/upload-on-behalf/route.ts', 'utf8');
    expect(route).toContain('authenticateUnified');
    expect(route).toContain('storePrivateFile');
    expect(route).toContain('tx.portalStudentDocument.create');
    expect(route).toContain('tx.studentDocument.create');
    expect(counselorRoute).toContain('storePrivateFile');
    expect(counselorRoute).toContain('Document uploads do not create applications');
    expect(counselorRoute).not.toContain('createCanonicalStudent');
  });
});
