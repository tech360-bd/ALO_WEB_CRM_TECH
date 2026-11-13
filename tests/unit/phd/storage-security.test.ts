import { describe, expect, it } from 'vitest';
import { createZip } from '@/lib/phd/exports/zip';
import { resolveStoragePath, validateFileSignature } from '@/lib/phd/storage';
import { PhdAccessError } from '@/lib/phd/auth';

describe('Upload signature validation', () => {
  it('accepts a real PDF signature', () => {
    expect(() => validateFileSignature('pdf', Buffer.from('%PDF-1.7\ncontent'))).not.toThrow();
  });

  it('rejects an executable renamed as a PDF', () => {
    expect(() => validateFileSignature('pdf', Buffer.from('MZ\x90\x00'))).toThrow(/pdf/i);
  });

  it('rejects a DOCX that is only a renamed zip without OOXML parts', () => {
    const zip = createZip([{ path: 'hello.txt', data: Buffer.from('hello') }]);
    expect(() => validateFileSignature('docx', zip)).toThrow(/content_types/i);
  });

  it('accepts an OOXML container with [Content_Types].xml', () => {
    const zip = createZip([
      { path: '[Content_Types].xml', data: Buffer.from('<Types/>') },
      { path: 'word/document.xml', data: Buffer.from('<w:document/>') },
    ]);
    expect(() => validateFileSignature('docx', zip)).not.toThrow();
  });

  it('rejects PNG and JPEG files whose magic bytes do not match', () => {
    expect(() => validateFileSignature('png', Buffer.from('not a png'))).toThrow(/png/i);
    expect(() => validateFileSignature('jpg', Buffer.from('not a jpeg'))).toThrow(/jpeg/i);
  });

  it('rejects null bytes in text uploads', () => {
    expect(() => validateFileSignature('txt', Buffer.from('hello\x00world'))).toThrow(/null/i);
  });

  it('rejects unsupported extensions at the storage layer', () => {
    expect(() => validateFileSignature('exe', Buffer.from('MZ'))).toThrow(PhdAccessError);
  });
});

describe('Storage path safety', () => {
  it('accepts canonical storage keys', () => {
    const resolved = resolveStoragePath('phd/documents/user_123/abc-def.pdf');
    expect(resolved.endsWith('abc-def.pdf')).toBe(true);
  });

  it('rejects traversal, absolute paths and unknown scopes', () => {
    expect(() => resolveStoragePath('phd/documents/../../etc/passwd')).toThrow(PhdAccessError);
    expect(() => resolveStoragePath('/etc/passwd')).toThrow(PhdAccessError);
    expect(() => resolveStoragePath('phd/public/file.pdf')).toThrow(PhdAccessError);
    expect(() => resolveStoragePath('phd/documents/user/../../secret.pdf')).toThrow(PhdAccessError);
  });
});
