import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadWhatsAppInboundMedia } from '@/lib/whatsapp-inbound-media';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('secure WhatsApp inbound media ingestion', () => {
  it('downloads from Meta, validates file bytes and checksum, and returns a safe private-file payload', async () => {
    vi.stubEnv('WHATSAPP_ACCESS_TOKEN', 'test-secret');
    vi.stubEnv('WHATSAPP_API_VERSION', 'v22.0');
    const bytes = Buffer.from('%PDF-1.7\nPrivate document sample');
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'media_123',
        url: 'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=media_123',
        mime_type: 'application/pdf',
        file_size: bytes.length,
        sha256,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(bytes, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(bytes.length) } }));

    const result = await downloadWhatsAppInboundMedia('media_123', '../passport', 'application/pdf', fetcher as typeof fetch);
    expect(result.fileName).toBe('passport.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.fileHash).toBe(sha256);
    expect(result.bytes).toEqual(bytes);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][0]).toContain('https://graph.facebook.com/v22.0/media_123');
    expect(fetcher.mock.calls[1][1]).toMatchObject({ redirect: 'manual' });
  });

  it('rejects provider URLs outside Meta media hosts before fetching them', async () => {
    vi.stubEnv('WHATSAPP_TOKEN', 'test-secret');
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 'media_456', url: 'https://attacker.example/private.pdf', mime_type: 'application/pdf', file_size: 20,
    }), { status: 200 }));

    await expect(downloadWhatsAppInboundMedia('media_456', 'file.pdf', 'application/pdf', fetcher as typeof fetch)).rejects.toThrow('MEDIA_URL_HOST_NOT_ALLOWED');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('validates every redirect hop and never requests an untrusted media host', async () => {
    vi.stubEnv('WHATSAPP_TOKEN', 'test-secret');
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'media_redirect', url: 'https://lookaside.fbsbx.com/file', mime_type: 'application/pdf' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: 'https://attacker.example/steal' } }));
    await expect(downloadWhatsAppInboundMedia('media_redirect', 'file.pdf', 'application/pdf', fetcher as typeof fetch)).rejects.toThrow('MEDIA_URL_HOST_NOT_ALLOWED');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('rejects downloaded bytes when numeric Meta file_size differs from the actual payload length', async () => {
    vi.stubEnv('WHATSAPP_TOKEN', 'test-secret');
    const bytes = Buffer.from('%PDF-1.7\nSize mismatch sample');
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'media_size_mismatch', url: 'https://lookaside.fbsbx.com/file', mime_type: 'application/pdf', file_size: bytes.length + 1 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(bytes, { status: 200 }));
    await expect(downloadWhatsAppInboundMedia('media_size_mismatch', 'file.pdf', 'application/pdf', fetcher as typeof fetch)).rejects.toThrow('MEDIA_SIZE_MISMATCH');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('rejects bytes whose detected file signature does not match the Meta MIME type', async () => {
    vi.stubEnv('WHATSAPP_TOKEN', 'test-secret');
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'media_789', url: 'https://lookaside.fbsbx.com/file', mime_type: 'application/pdf' }), { status: 200 }))
      .mockResolvedValueOnce(new Response('not a PDF', { status: 200 }));
    await expect(downloadWhatsAppInboundMedia('media_789', 'file.pdf', 'application/pdf', fetcher as typeof fetch)).rejects.toThrow('MEDIA_CONTENT_MISMATCH');
  });
});
