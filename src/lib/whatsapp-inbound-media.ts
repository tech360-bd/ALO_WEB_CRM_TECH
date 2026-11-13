import { createHash } from 'node:crypto';
import { getWhatsAppAccessToken, getWhatsAppGraphUrl, getWhatsAppGraphVersion } from '@/lib/whatsapp-config';

export const MAX_WHATSAPP_INBOUND_FILE_BYTES = 20 * 1024 * 1024;

export type WhatsAppInboundMedia = {
  bytes: Buffer;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  fileName: string;
  fileHash: string;
  providerSha256: string;
  providerMediaId: string;
};

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp',
};

function detectMime(bytes: Buffer): WhatsAppInboundMedia['mimeType'] | null {
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))) return 'image/gif';
  return null;
}

function sanitizeFileName(value: string, mimeType: string): string {
  const basename = value.split(/[\\/]/).pop()?.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 180) || 'whatsapp-document';
  const extension = EXTENSION_BY_MIME[mimeType] || '.bin';
  const hasMatchingExtension = basename.toLowerCase().endsWith(extension) || (mimeType === 'image/jpeg' && basename.toLowerCase().endsWith('.jpeg'));
  return hasMatchingExtension ? basename : `${basename.replace(/\.[^.]*$/, '')}${extension}`;
}

function isAllowedMetaMediaHost(hostname: string): boolean {
  return hostname === 'lookaside.fbsbx.com' || hostname.endsWith('.fbcdn.net') || hostname === 'graph.facebook.com';
}

async function fetchMetaMedia(url: URL, token: string, fetcher: typeof fetch): Promise<Response> {
  let current = url;
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    if (current.protocol !== 'https:' || !isAllowedMetaMediaHost(current.hostname)) throw new Error('MEDIA_URL_HOST_NOT_ALLOWED');
    const response = await fetcher(current.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(20_000),
      redirect: 'manual',
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirects === 3) throw new Error('MEDIA_REDIRECT_INVALID');
      try { current = new URL(location, current); } catch { throw new Error('MEDIA_REDIRECT_INVALID'); }
      continue;
    }
    return response;
  }
  throw new Error('MEDIA_REDIRECT_INVALID');
}

async function readBoundedBody(response: Response, maxBytes: number): Promise<Buffer> {
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > maxBytes) throw new Error('MEDIA_TOO_LARGE');
  if (!response.body) {
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength > maxBytes) throw new Error('MEDIA_TOO_LARGE');
    return bytes;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new Error('MEDIA_TOO_LARGE');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, total);
}

/** Download and validate an inbound Cloud API asset using a fixed Graph API
 * origin and Meta's signed media URL. Arbitrary URLs are never accepted. */
export async function downloadWhatsAppInboundMedia(
  mediaId: string,
  fileName: string,
  expectedMimeType: string,
  fetcher: typeof fetch = fetch,
): Promise<WhatsAppInboundMedia> {
  const token = getWhatsAppAccessToken();
  const apiVersion = getWhatsAppGraphVersion();
  const metadataUrl = getWhatsAppGraphUrl(encodeURIComponent(mediaId));
  if (!token) throw new Error('WHATSAPP_MEDIA_TOKEN_NOT_CONFIGURED');
  if (!apiVersion || !metadataUrl) throw new Error('WHATSAPP_API_VERSION_INVALID');
  if (!/^[A-Za-z0-9_.:-]{1,200}$/.test(mediaId)) throw new Error('MEDIA_ID_INVALID');

  const metadataResponse = await fetcher(metadataUrl, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
    redirect: 'error',
  });
  if (!metadataResponse.ok) throw new Error('MEDIA_METADATA_REQUEST_FAILED');
  const metadata = await metadataResponse.json().catch(() => null) as null | { id?: string; url?: string; mime_type?: string; file_size?: number; sha256?: string };
  if (!metadata || metadata.id !== mediaId || !metadata.url || !metadata.mime_type) throw new Error('MEDIA_METADATA_INVALID');
  if (typeof metadata.file_size === 'number' && metadata.file_size > MAX_WHATSAPP_INBOUND_FILE_BYTES) throw new Error('MEDIA_TOO_LARGE');
  if (!ALLOWED_MIME.has(metadata.mime_type) || (expectedMimeType && metadata.mime_type !== expectedMimeType)) throw new Error('MEDIA_TYPE_NOT_ALLOWED');

  let mediaUrl: URL;
  try { mediaUrl = new URL(metadata.url); } catch { throw new Error('MEDIA_URL_INVALID'); }
  if (mediaUrl.protocol !== 'https:' || !isAllowedMetaMediaHost(mediaUrl.hostname)) throw new Error('MEDIA_URL_HOST_NOT_ALLOWED');
  const mediaResponse = await fetchMetaMedia(mediaUrl, token, fetcher);
  if (!mediaResponse.ok) throw new Error('MEDIA_DOWNLOAD_FAILED');
  const bytes = await readBoundedBody(mediaResponse, MAX_WHATSAPP_INBOUND_FILE_BYTES);
  if (!bytes.length) throw new Error('MEDIA_EMPTY');
  if (typeof metadata.file_size === 'number' && metadata.file_size !== bytes.byteLength) throw new Error('MEDIA_SIZE_MISMATCH');
  const detectedMime = detectMime(bytes);
  if (!detectedMime || detectedMime !== metadata.mime_type) throw new Error('MEDIA_CONTENT_MISMATCH');
  const fileHash = createHash('sha256').update(bytes).digest('hex');
  const providerSha256 = String(metadata.sha256 || '').toLowerCase();
  if (providerSha256 && !/^[a-f0-9]{64}$/.test(providerSha256)) throw new Error('MEDIA_CHECKSUM_INVALID');
  if (providerSha256 && providerSha256 !== fileHash) throw new Error('MEDIA_CHECKSUM_MISMATCH');
  return {
    bytes,
    mimeType: detectedMime,
    fileName: sanitizeFileName(fileName, detectedMime),
    fileHash,
    providerSha256,
    providerMediaId: mediaId,
  };
}
