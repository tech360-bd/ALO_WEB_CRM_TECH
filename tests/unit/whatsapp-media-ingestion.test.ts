import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/storage/private-file-store', () => ({ storePrivateFile: vi.fn(), removePrivateFile: vi.fn() }));
import { classifyIncomingDocument, downloadWhatsAppMedia } from '@/lib/whatsapp-media-ingestion';

describe('WhatsApp media download', () => {
  const bytes = Buffer.from('%PDF-1.7\nreal-test-document');
  const metadata = { url: 'https://lookaside.fbsbx.com/media', mime_type: 'application/pdf', file_size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  beforeEach(() => { vi.stubEnv('WHATSAPP_ACCESS_TOKEN', 'test-only-provider-token'); vi.stubEnv('WHATSAPP_GRAPH_VERSION', 'v23.0'); });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it('downloads actual bytes with bearer authentication and verifies their digest', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(metadata)).mockResolvedValueOnce(new Response(bytes));
    vi.stubGlobal('fetch', fetchMock);
    expect(await downloadWhatsAppMedia('123456', '789')).toMatchObject({ bytes, mimeType: 'application/pdf', hash: metadata.sha256 });
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://graph.facebook.com/v23.0/123456?phone_number_id=789');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ headers: { Authorization: 'Bearer test-only-provider-token' }, redirect: 'error' });
  });
  it.each(['http://lookaside.fbsbx.com/file', 'https://127.0.0.1/file', 'https://fbcdn.net.attacker.example/file'])('rejects untrusted metadata download URL %s before sending credentials', async url => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ...metadata, url }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(downloadWhatsAppMedia('123456')).rejects.toThrow('untrusted');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('rejects MIME spoofing and corrupt content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json(metadata)).mockResolvedValueOnce(new Response('<script>fake PDF</script>')));
    await expect(downloadWhatsAppMedia('123456')).rejects.toThrow('MIME type');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json({ ...metadata, sha256: 'invalid' })).mockResolvedValueOnce(new Response(bytes)));
    await expect(downloadWhatsAppMedia('123456')).rejects.toThrow('integrity');
  });
  it('rejects oversized provider metadata without downloading it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ...metadata, file_size: 21 * 1024 * 1024 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(downloadWhatsAppMedia('123456')).rejects.toThrow('20 MB');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('rejects downloaded bytes when numeric provider file_size does not match the payload', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ ...metadata, file_size: bytes.length + 1 }))
      .mockResolvedValueOnce(new Response(bytes));
    vi.stubGlobal('fetch', fetchMock);
    await expect(downloadWhatsAppMedia('123456')).rejects.toThrow('file size does not match');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('classifies English certificates before general academic certificates', () => {
    expect(classifyIncomingDocument('IELTS certificate.pdf')).toBe('english_test');
    expect(classifyIncomingDocument('HSC certificate.pdf')).toBe('academic_certificate');
  });
});
