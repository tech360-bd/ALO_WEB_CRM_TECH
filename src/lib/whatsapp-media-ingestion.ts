import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/phone-normalization';
import { removePrivateFile, storePrivateFile } from '@/lib/storage/private-file-store';

const MAX_BYTES = 20 * 1024 * 1024;
export const whatsappGraphBase = () => {
  const version = process.env.WHATSAPP_GRAPH_VERSION || 'v23.0';
  if (!/^v\d+\.0$/.test(version)) throw new Error('Invalid WHATSAPP_GRAPH_VERSION');
  return `https://graph.facebook.com/${version}`;
};

export function whatsappPhoneVariants(phone: string): string[] {
  const normalized = normalizePhone(phone);
  return [...new Set([phone, normalized, `+${normalized}`, ...(normalized.startsWith('8801') ? [normalized.slice(3)] : [])])].filter(Boolean);
}

export function detectIncomingMediaMime(bytes: Buffer): string | null {
  if (bytes.subarray(0, 5).toString() === '%PDF-') return 'application/pdf';
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (/^GIF8[79]a/.test(bytes.subarray(0, 6).toString())) return 'image/gif';
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (bytes.subarray(4, 8).toString() === 'ftyp') return 'video/mp4';
  if (bytes.subarray(0, 4).toString() === 'OggS') return 'audio/ogg';
  if (bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224)) return 'audio/mpeg';
  return null;
}

export function classifyIncomingDocument(fileName: string): string {
  const name = fileName.toLowerCase();
  if (/passport/.test(name)) return 'passport';
  if (/transcript|marksheet|result/.test(name)) return 'transcript';
  if (/ielts|pte|toefl|duolingo/.test(name)) return 'english_test';
  if (/certificate|degree|ssc|hsc/.test(name)) return 'academic_certificate';
  if (/bank|financial/.test(name)) return 'bank_statement';
  if (/sop|statement.of.purpose/.test(name)) return 'sop';
  if (/resume|\bcv\b/.test(name)) return 'cv';
  if (/visa/.test(name)) return 'visa';
  return 'other'; // Classification never marks a document as verified.
}

async function boundedBytes(response: Response): Promise<Buffer> {
  if (!response.ok || !response.body) throw new Error('WhatsApp media download failed');
  if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('WhatsApp media exceeds 20 MB');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) throw new Error('WhatsApp media exceeds 20 MB');
      chunks.push(value);
    }
  } catch (error) { await reader.cancel(); throw error; }
  if (!size) throw new Error('WhatsApp media is empty');
  return Buffer.concat(chunks);
}

export async function downloadWhatsAppMedia(mediaId: string, phoneNumberId?: string) {
  if (!/^\d+$/.test(mediaId)) throw new Error('Invalid WhatsApp media ID');
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
  if (!token) throw new Error('WhatsApp media access is not configured');
  const metadataUrl = new URL(`${whatsappGraphBase()}/${mediaId}`);
  if (phoneNumberId) metadataUrl.searchParams.set('phone_number_id', phoneNumberId);
  const options = { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' as const, redirect: 'error' as const, signal: AbortSignal.timeout(30_000) };
  const metadataResponse = await fetch(metadataUrl, options);
  if (!metadataResponse.ok) throw new Error('WhatsApp media metadata request failed');
  const metadata = await metadataResponse.json();
  if (Number(metadata.file_size) > MAX_BYTES) throw new Error('WhatsApp media exceeds 20 MB');
  const url = new URL(metadata.url);
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      !(url.hostname === 'lookaside.fbsbx.com' || url.hostname.endsWith('.fbcdn.net'))) {
    throw new Error('WhatsApp returned an untrusted media URL');
  }
  const bytes = await boundedBytes(await fetch(url, { ...options, signal: AbortSignal.timeout(30_000) }));
  const mimeType = detectIncomingMediaMime(bytes);
  const declared = String(metadata.mime_type || '').split(';')[0].trim().toLowerCase();
  if (!mimeType || (declared !== mimeType && !(declared === 'audio/mp4' && mimeType === 'video/mp4'))) {
    throw new Error('Unsupported media or file content does not match its MIME type');
  }
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (metadata.sha256 && metadata.sha256 !== hash && metadata.sha256 !== Buffer.from(hash, 'hex').toString('base64')) {
    throw new Error('WhatsApp media integrity check failed');
  }
  return { bytes, mimeType: declared || mimeType, hash };
}

/** Called only after the webhook's app-secret signature has been verified. */
export async function ingestWhatsAppMedia(input: {
  providerMessageId: string; mediaId: string; senderPhone: string; senderName?: string;
  fileName?: string; phoneNumberId?: string; conversationId?: string; messageId?: string;
}) {
  if (!input.providerMessageId || input.providerMessageId.length > 191) throw new Error('Invalid provider message ID');
  const event = await db.webhookEvent.upsert({
    where: { provider_eventId: { provider: 'WHATSAPP_MEDIA', eventId: input.providerMessageId } },
    create: { provider: 'WHATSAPP_MEDIA', eventId: input.providerMessageId, eventType: 'MEDIA_INGEST', payload: JSON.stringify({ mediaId: input.mediaId }), verified: true },
    update: {},
  });
  if (event.processed) {
    const result = JSON.parse(event.payload || '{}') as { attachmentId?: string; documentId?: string; fileSize?: number };
    return { duplicate: true, ...result };
  }
  const claim = await db.webhookEvent.updateMany({
    where: { id: event.id, processed: false, OR: [{ processedAt: null }, { errorMessage: { not: 'processing' } }, { processedAt: { lt: new Date(Date.now() - 120_000) } }] },
    data: { processedAt: new Date(), errorMessage: 'processing' },
  });
  if (claim.count !== 1) throw new Error('WhatsApp media processing is in progress; retry later');
  let stored: Awaited<ReturnType<typeof storePrivateFile>> | undefined;
  try {
    const media = await downloadWhatsAppMedia(input.mediaId, input.phoneNumberId);
    const extension = ({ 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'video/mp4': 'mp4' } as Record<string, string>)[media.mimeType];
    const fileName = (input.fileName || `whatsapp-${input.mediaId}.${extension}`).replace(/[\/\\\u0000-\u001f]/g, '_').slice(0, 191);
    stored = await storePrivateFile(media.bytes, fileName);
    const storage = stored;
    const student = await db.student.findFirst({ where: { phone: { in: whatsappPhoneVariants(input.senderPhone) } }, select: { id: true } });
    const conversation = input.conversationId ? { id: input.conversationId } :
      (await db.uccConversation.findFirst({ where: { channel: 'whatsapp', participantPhone: { in: whatsappPhoneVariants(input.senderPhone) } } })) ||
      (await db.uccConversation.create({ data: { channel: 'whatsapp', participantName: input.senderName || input.senderPhone, participantPhone: normalizePhone(input.senderPhone), studentId: student?.id, externalId: `wa-${normalizePhone(input.senderPhone)}` } }));
    const isDocument = media.mimeType === 'application/pdf' || media.mimeType.startsWith('image/');
    const category = classifyIncomingDocument(fileName);
    return await db.$transaction(async tx => {
      const attachment = await tx.uccAttachment.create({ data: {
        conversationId: conversation.id, messageId: input.messageId, fileName, fileType: isDocument ? 'document' : 'media',
        mimeType: media.mimeType, fileSize: media.bytes.length, fileUrl: '', studentId: student?.id,
        detectedDocType: category, ocrExtractedData: JSON.stringify({ storagePath: storage.storagePath, fileHash: storage.fileHash, providerMessageId: input.providerMessageId, mediaId: input.mediaId, source: 'whatsapp', reviewRequired: true }),
      } });
      const fileUrl = `/api/crm/ucc/documents/${attachment.id}/download`;
      await tx.uccAttachment.update({ where: { id: attachment.id }, data: { fileUrl } });
      let documentId: string | undefined;
      if (student && isDocument) {
        const previous = await tx.studentDocument.findFirst({ where: { studentId: student.id, category, isArchived: false }, orderBy: { version: 'desc' } });
        const document = await tx.studentDocument.create({ data: {
          studentId: student.id, category, fileName, fileUrl: '', storagePath: storage.storagePath,
          mimeType: media.mimeType, fileSize: media.bytes.length, fileHash: storage.fileHash, status: 'pending_review',
          version: (previous?.version || 0) + 1, previousVersionId: previous?.id || '',
        } });
        documentId = document.id;
        await tx.studentDocument.update({ where: { id: document.id }, data: { fileUrl: `/api/student/documents/${document.id}/download` } });
        await tx.documentAudit.create({ data: { documentId: document.id, studentId: student.id, actorRole: 'WHATSAPP_PROVIDER', action: 'upload', newStatus: 'pending_review', note: 'Signed WhatsApp media stored privately; document classification requires review.' } });
        await tx.studentEvent.create({ data: { studentId: student.id, eventType: 'DOCUMENT_UPLOADED', payload: JSON.stringify({ documentId: document.id, source: 'whatsapp' }) } });
      }
      if (isDocument) await tx.ocrJob.create({ data: { documentId: attachment.id, fileUrl, fileName, mimeType: media.mimeType, fileHash: storage.fileHash, status: 'queued', studentId: student?.id, conversationId: conversation.id } });
      await tx.webhookEvent.update({ where: { id: event.id }, data: { processed: true, processedAt: new Date(), errorMessage: null, payload: JSON.stringify({ attachmentId: attachment.id, documentId, mediaId: input.mediaId, fileSize: media.bytes.length }) } });
      return { duplicate: false, attachmentId: attachment.id, documentId, fileSize: media.bytes.length };
    });
  } catch (error) {
    if (stored) await removePrivateFile(stored.storagePath).catch(() => {});
    await db.webhookEvent.update({ where: { id: event.id }, data: { errorMessage: 'Media ingest failed; provider retry is required', processed: false } }).catch(() => {});
    throw error;
  }
}
