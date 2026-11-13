import { describe, expect, it } from 'vitest';
import { readRequestTextLimited } from '@/lib/request-body';

describe('readRequestTextLimited', () => {
  it('reads a bounded JSON request body', async () => {
    const req = new Request('https://alo.example/api/lead-forms', {
      method: 'POST',
      body: JSON.stringify({ name: 'Student' }),
    });
    await expect(readRequestTextLimited(req, 128)).resolves.toEqual({ ok: true, text: '{"name":"Student"}' });
  });

  it('rejects oversized bodies even when Content-Length is omitted', async () => {
    const req = new Request('https://alo.example/api/lead-forms', {
      method: 'POST',
      body: '0123456789',
    });
    await expect(readRequestTextLimited(req, 5)).resolves.toEqual({ ok: false, status: 413 });
  });

  it('rejects oversized declared content before consuming the stream', async () => {
    const req = new Request('https://alo.example/api/lead-forms', {
      method: 'POST',
      headers: { 'content-length': '999' },
      body: 'small',
    });
    await expect(readRequestTextLimited(req, 10)).resolves.toEqual({ ok: false, status: 413 });
  });
});
