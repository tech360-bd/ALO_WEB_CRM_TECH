import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { generateStudentId, generateLeadId } from '@/lib/whatsapp-helpers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// ============================================================
// WHATSAPP WEBHOOK - Meta Cloud API Integration
// ============================================================
//
// Auth model: the webhook is PUBLIC (Meta cannot send a Bearer token). All
// trust is established by HMAC-SHA256 verification of the raw request body
// against WHATSAPP_BUSINESS_APP_SECRET. A missing or mismatched signature
// returns 401 before any DB write happens.

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const APP_SECRET = process.env.WHATSAPP_BUSINESS_APP_SECRET || '';
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/whatsapp');

if (!VERIFY_TOKEN) {
  console.warn(
    '[WhatsApp Webhook] WHATSAPP_VERIFY_TOKEN is not configured — Meta subscription verification will fail with 403.',
  );
}
if (!APP_SECRET) {
  console.warn(
    '[WhatsApp Webhook] WHATSAPP_BUSINESS_APP_SECRET is not configured — every inbound POST will be rejected.',
  );
}

// ----------------------------------------------------------
// GET - Webhook Verification (Meta standard)
// ----------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    if (!VERIFY_TOKEN) {
      // Hard-fail when the env var is missing — never fall back to a
      // hardcoded token (the previous 'alo_education_verify_token_2026'
      // default leaked in source and let anyone spoof the subscription).
      return NextResponse.json(
        { error: 'WHATSAPP_VERIFY_TOKEN not configured' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[WhatsApp Webhook] Verification successful');
      return new NextResponse(challenge, { status: 200 });
    }

    console.warn('[WhatsApp Webhook] Verification failed', { mode });
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  } catch (error) {
    console.error('[WhatsApp Webhook] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ----------------------------------------------------------
// Verify Meta's X-Hub-Signature-256 header against the raw body.
// Constant-time comparison via crypto.timingSafeEqual.
// ----------------------------------------------------------
function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || typeof signatureHeader !== 'string') return false;
  if (!signatureHeader.startsWith('sha256=')) return false;
  if (!APP_SECRET) {
    // Production must set the env var. We still require the header format
    // (above) and explicitly refuse to process without a secret so that a
    // misconfigured deploy fails closed, not open.
    console.error('[WhatsApp Webhook] APP_SECRET missing — refusing to verify signature.');
    return false;
  }

  const expected =
    'sha256=' +
    crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex');

  // Both are 'sha256=<64 hex chars>'. Compare lengths first, then constant-time.
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ----------------------------------------------------------
// POST - Process Incoming Messages
// ----------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // 1. Read the RAW body — we need the exact bytes Meta signed.
    //    `request.json()` would re-serialize and break the signature.
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    if (!verifyMetaSignature(rawBody, signature)) {
      console.warn('[WhatsApp Webhook] Rejected POST: invalid or missing X-Hub-Signature-256');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 },
      );
    }

    // 2. Parse the now-trusted body.
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 3. Immediately return 200 to Meta (they require fast response).
    //    Process async in background.
    processWebhookPayload(payload).catch((err) => {
      console.error('[WhatsApp Webhook] Async processing error:', err);
    });

    return NextResponse.json({ status: 'received' }, { status: 200 });
  } catch (error) {
    console.error('[WhatsApp Webhook] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ----------------------------------------------------------
// Core Processing Logic
// ----------------------------------------------------------
async function processWebhookPayload(payload: Record<string, unknown>) {
  try {
    const entry = payload?.entry as Array<Record<string, unknown>> | undefined;
    if (!entry || !Array.isArray(entry)) return;

    for (const entryItem of entry) {
      const changes = entryItem?.changes as Array<Record<string, unknown>> | undefined;
      if (!changes || !Array.isArray(changes)) continue;

      for (const change of changes) {
        const value = change?.value as Record<string, unknown> | undefined;
        if (!value) continue;

        const messages = value?.messages as Array<Record<string, unknown>> | undefined;
        const contacts = value?.contacts as Array<Record<string, unknown>> | undefined;

        if (!messages || !Array.isArray(messages)) continue;

        for (const message of messages) {
          const senderPhone = message.from as string;
          const messageId = message.id as string;
          const timestamp = message.timestamp as string;
          const contactName = extractContactName(contacts, senderPhone);

          console.log(`[WhatsApp Webhook] Processing message from ${senderPhone}`);

          // 1. Find or create student/lead
          const { student, lead, isNewContact } = await findOrCreateContact(senderPhone, contactName);

          // 2. Find or create conversation
          const conversation = await findOrCreateConversation(senderPhone, contactName, student?.id, lead?.id);

          // 3. Process message content
          const messageType = message.type as string;
          let messageText = '';
          let mediaType: string | null = null;
          let mediaInfo: Record<string, unknown> | null = null;

          if (messageType === 'text') {
            messageText = (message.text as Record<string, string>)?.body || '';
          } else if (['image', 'document', 'audio', 'video', 'sticker'].includes(messageType)) {
            mediaType = messageType;
            mediaInfo = message[messageType] as Record<string, unknown>;
            messageText = (mediaInfo?.caption as string) || '';
          } else if (messageType === 'interactive') {
            const interactive = message.interactive as Record<string, unknown>;
            if (interactive?.type === 'button_reply') {
              messageText = (interactive?.button_reply as Record<string, string>)?.title || '';
            } else if (interactive?.type === 'list_reply') {
              messageText = (interactive?.list_reply as Record<string, string>)?.title || '';
            }
          } else if (messageType === 'location') {
            const location = message.location as Record<string, unknown>;
            messageText = `Location: ${location?.latitude}, ${location?.longitude}${location?.address ? ` - ${location.address}` : ''}`;
          } else if (messageType === 'contacts') {
            messageText = '[Shared Contacts]';
          } else {
            messageText = `[${messageType} message]`;
          }

          // 4. Save the message
          const savedMessage = await db.whatsappMessage.create({
            data: {
              conversationId: conversation.id,
              messageText: messageText || null,
              mediaUrl: mediaInfo ? (mediaInfo.id as string) : null,
              mediaType: mediaType,
              direction: 'inbound',
              status: 'delivered',
              sentAt: timestamp ? new Date(parseInt(timestamp) * 1000) : new Date(),
            },
          });

          // 5. Update conversation
          await db.whatsappConversation.update({
            where: { id: conversation.id },
            data: {
              lastMessage: messageText || (mediaType ? `[${mediaType}]` : '[Message]'),
              lastMessageAt: new Date(),
              unreadCount: { increment: 1 },
            },
          });

          // 6. Handle media if present
          if (mediaInfo && mediaType) {
            await handleMediaAttachment(
              savedMessage.id,
              mediaInfo,
              mediaType,
              senderPhone,
              student?.id
            ).catch((err) => {
              console.error('[WhatsApp Webhook] Media handling error:', err);
            });
          }

          // 7. Auto-welcome for new contacts
          if (isNewContact) {
            await sendWelcomeMessage(senderPhone, conversation.id);
          }

          // 8. Assign counselor if lead was created
          if (lead?.assignedTo) {
            // Already assigned during creation
          }

          // 9. Create activity log
          await createActivityLog(senderPhone, messageText, student?.id, lead?.id);
        }
      }
    }
  } catch (error) {
    console.error('[WhatsApp Webhook] Payload processing error:', error);
  }
}

// ----------------------------------------------------------
// Find or Create Contact (Student/Lead)
// ----------------------------------------------------------
async function findOrCreateContact(senderPhone: string, contactName: string | null) {
  // Try to find existing student
  let student = await db.student.findFirst({
    where: {
      OR: [
        { phone: senderPhone },
        { whatsappNumber: senderPhone },
      ],
    },
  });

  // Try to find existing partner
  let partner = await db.partner.findFirst({
    where: {
      OR: [
        { phone: senderPhone },
        { whatsappNumber: senderPhone },
      ],
    },
  });

  let lead = await db.lead.findFirst({
    where: {
      OR: [
        { phone: senderPhone },
        { whatsappNumber: senderPhone },
      ],
    },
  });

  let isNewContact = false;

  // If no existing contact, auto-create a lead and student
  if (!student && !partner && !lead) {
    isNewContact = true;
    console.log(`[WhatsApp Webhook] New contact: ${senderPhone}, auto-creating lead and student`);

    // Find a counselor to assign (round-robin: pick the active employee with fewest assigned leads)
    const counselor = await findAvailableCounselor();

    // Generate student ID via shared atomic helper: AE-YYYY000001 (spec format)
    const studentId = await generateStudentId();

    // Create student
    student = await db.student.create({
      data: {
        studentId,
        firstName: contactName || 'WhatsApp',
        lastName: contactName ? 'Contact' : senderPhone.slice(-4),
        email: `whatsapp_${senderPhone}@alo-education.temp`,
        phone: senderPhone,
        whatsappNumber: senderPhone,
        source: 'whatsapp',
        status: 'active',
        assignedCounselor: counselor?.id || null,
      },
    });

    // Generate lead ID via shared atomic helper: LEAD-YYYY000001
    const leadIdStr = await generateLeadId();

    // Create lead
    lead = await db.lead.create({
      data: {
        leadId: leadIdStr,
        firstName: contactName || 'WhatsApp',
        lastName: contactName ? 'Contact' : senderPhone.slice(-4),
        phone: senderPhone,
        whatsappNumber: senderPhone,
        source: 'whatsapp',
        status: 'new',
        temperature: 'warm',
        assignedTo: counselor?.id || null,
        lastContactedAt: new Date(),
      },
    });

    // Create lead note
    await db.leadNote.create({
      data: {
        leadId: lead.id,
        note: 'Lead auto-created from incoming WhatsApp message',
        noteType: 'whatsapp',
      },
    });

    // Audit the auto-created contact (system actor — userId null)
    await logAudit({
      action: 'whatsapp.contact.auto_created',
      module: 'whatsapp',
      recordId: student.id,
      newData: {
        studentId,
        leadId: leadIdStr,
        phone: senderPhone,
        counselorId: counselor?.id ?? null,
      },
    }).catch(() => {});
  }

  return { student, partner, lead, isNewContact };
}

// ----------------------------------------------------------
// Find Available Counselor (round-robin by fewest leads)
// ----------------------------------------------------------
async function findAvailableCounselor() {
  const counselors = await db.employee.findMany({
    where: {
      status: 'active',
      role: { in: ['counselor', 'senior_counselor', 'branch_manager'] },
    },
    include: {
      assignedLeads: { where: { status: { in: ['new', 'contacted', 'qualified'] } } },
    },
  });

  if (counselors.length === 0) return null;

  // Sort by fewest active leads
  counselors.sort((a, b) => a.assignedLeads.length - b.assignedLeads.length);
  return counselors[0];
}

// ----------------------------------------------------------
// Find or Create Conversation
// ----------------------------------------------------------
async function findOrCreateConversation(
  senderPhone: string,
  contactName: string | null,
  studentId?: string | null,
  leadId?: string | null
) {
  // Look for existing open conversation
  let conversation = await db.whatsappConversation.findFirst({
    where: {
      contactNumber: senderPhone,
      status: 'open',
    },
  });

  if (!conversation) {
    const ourPhone = process.env.WHATSAPP_PHONE_NUMBER_ID || 'default';
    conversation = await db.whatsappConversation.create({
      data: {
        phoneNumber: ourPhone,
        contactNumber: senderPhone,
        contactName: contactName || null,
        studentId: studentId || null,
        partnerId: null,
        status: 'open',
        lastMessageAt: new Date(),
      },
    });
  } else {
    // Update student link if found
    if (studentId && !conversation.studentId) {
      await db.whatsappConversation.update({
        where: { id: conversation.id },
        data: { studentId },
      });
      conversation.studentId = studentId;
    }
  }

  return conversation;
}

// ----------------------------------------------------------
// Handle Media Attachment
// ----------------------------------------------------------
async function handleMediaAttachment(
  messageId: string,
  mediaInfo: Record<string, unknown>,
  mediaType: string,
  senderPhone: string,
  studentId?: string | null
) {
  try {
    const mediaId = mediaInfo.id as string;
    const mimeType = mediaInfo.mime_type as string | undefined;
    const fileName = (mediaInfo.filename as string) || `${mediaType}_${mediaId}`;
    const fileSize = mediaInfo.file_size ? parseInt(mediaInfo.file_size as string) : null;
    const caption = mediaInfo.caption as string | undefined;

    // Download media from WhatsApp CDN
    let localFilePath = '';
    try {
      localFilePath = await downloadWhatsAppMedia(mediaId, fileName, mimeType);
    } catch (downloadErr) {
      console.error('[WhatsApp Webhook] Media download failed:', downloadErr);
      // Still create the record with the original URL
    }

    // Create WhatsappMedia record
    const whatsappMedia = await db.whatsappMedia.create({
      data: {
        messageId,
        mediaType,
        mediaUrl: localFilePath || `whatsapp://media/${mediaId}`,
        originalUrl: `https://graph.facebook.com/v18.0/${mediaId}`,
        fileName,
        fileSize,
        mimeType: mimeType || null,
        caption: caption || null,
        whatsappMediaId: mediaId,
        studentId: studentId || null,
      },
    });

    // Auto-link to Document if it looks like a document
    if (studentId && shouldAutoLinkDocument(mediaType, mimeType, fileName)) {
      const docType = detectDocumentType(mediaType, mimeType, fileName);
      const documentRecord = await db.document.create({
        data: {
          studentId,
          documentType: docType,
          documentName: fileName,
          filePath: localFilePath || `whatsapp://media/${mediaId}`,
          fileSize: fileSize || null,
          mimeType: mimeType || null,
          status: 'uploaded',
        },
      });

      // Link media to document
      await db.whatsappMedia.update({
        where: { id: whatsappMedia.id },
        data: { documentId: documentRecord.id },
      });

      console.log(`[WhatsApp Webhook] Auto-linked document: ${fileName} -> ${docType}`);
    }

    console.log(`[WhatsApp Webhook] Media saved: ${mediaType} -> ${localFilePath}`);
  } catch (error) {
    console.error('[WhatsApp Webhook] Media handling error:', error);
  }
}

// ----------------------------------------------------------
// Download Media from WhatsApp CDN
// ----------------------------------------------------------
async function downloadWhatsAppMedia(
  mediaId: string,
  fileName: string,
  mimeType?: string
): Promise<string> {
  if (!ACCESS_TOKEN) {
    console.warn('[WhatsApp Webhook] No access token, skipping media download');
    return '';
  }

  // Step 1: Get media URL from Meta API
  const mediaUrlRes = await fetch(
    `https://graph.facebook.com/v18.0/${mediaId}`,
    {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    }
  );

  if (!mediaUrlRes.ok) {
    throw new Error(`Failed to get media URL: ${mediaUrlRes.status}`);
  }

  const mediaUrlData = await mediaUrlRes.json();
  const downloadUrl = mediaUrlData.url as string;

  // Step 2: Download the actual media file
  const downloadRes = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });

  if (!downloadRes.ok) {
    throw new Error(`Failed to download media: ${downloadRes.status}`);
  }

  const arrayBuffer = await downloadRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Step 3: Save to local storage
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = getExtensionFromMime(mimeType) || path.extname(fileName) || '.bin';
  const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}${fileName.includes('.') ? '' : ext}`;
  const fullPath = path.join(UPLOAD_DIR, safeName);

  await writeFile(fullPath, buffer);

  // Return relative path for web access
  return `/uploads/whatsapp/${safeName}`;
}

// ----------------------------------------------------------
// Send Welcome Message
// ----------------------------------------------------------
async function sendWelcomeMessage(senderPhone: string, conversationId: string) {
  const welcomeText = `Welcome to ALO Education! 👋

We help students achieve their dream of studying abroad in the UK, USA, Canada, Australia, and Europe.

Our team will be with you shortly. In the meantime, feel free to:
- Ask about any university or course
- Share your documents for review
- Book a free consultation

Thank you for reaching out! 🎓`;

  try {
    await db.whatsappMessage.create({
      data: {
        conversationId,
        messageText: welcomeText,
        direction: 'outbound',
        status: 'sent',
        sentAt: new Date(),
      },
    });

    await db.whatsappConversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: welcomeText.substring(0, 50) + '...',
        lastMessageAt: new Date(),
      },
    });

    console.log(`[WhatsApp Webhook] Welcome message sent to ${senderPhone}`);
  } catch (error) {
    console.error('[WhatsApp Webhook] Failed to send welcome message:', error);
  }
}

// ----------------------------------------------------------
// Create Activity Log
// ----------------------------------------------------------
async function createActivityLog(
  senderPhone: string,
  messageText: string,
  studentId?: string | null,
  leadId?: string | null
) {
  try {
    await db.activityLog.create({
      data: {
        userId: studentId || leadId || undefined,
        action: leadId ? 'WHATSAPP_INBOUND_LEAD' : 'WHATSAPP_INBOUND',
        description: `WhatsApp message from ${senderPhone}: ${messageText?.substring(0, 200) || '[Media]'}`,
        module: 'whatsapp',
      },
    });

    // Also record an immutable audit-log entry for every inbound message.
    await logAudit({
      action: 'whatsapp.message.received',
      module: 'whatsapp',
      recordId: studentId || leadId || senderPhone,
      newData: {
        phone: senderPhone,
        preview: messageText?.substring(0, 200) || '[Media]',
        studentId: studentId ?? null,
        leadId: leadId ?? null,
      },
    });
  } catch (error) {
    console.error('[WhatsApp Webhook] Activity log error:', error);
  }
}

// ----------------------------------------------------------
// Helper: Extract contact name from contacts array
// ----------------------------------------------------------
function extractContactName(
  contacts: Array<Record<string, unknown>> | undefined,
  phone: string
): string | null {
  if (!contacts || !Array.isArray(contacts)) return null;
  const contact = contacts.find((c) => c.wa_id === phone);
  if (!contact) return null;
  const nameObj = contact.name as Record<string, string> | undefined;
  return nameObj?.formatted_name || nameObj?.first_name || null;
}

// ----------------------------------------------------------
// Helper: Determine if media should auto-link to Document
// ----------------------------------------------------------
function shouldAutoLinkDocument(
  mediaType: string,
  mimeType?: string,
  fileName?: string
): boolean {
  // Documents always auto-link
  if (mediaType === 'document') return true;

  // Images might be passport photos, certificates etc.
  if (mediaType === 'image') {
    const name = (fileName || '').toLowerCase();
    const suspiciousNames = ['passport', 'id', 'certificate', 'transcript', 'marksheet', 'nid', 'visa', 'ielts', 'pte'];
    if (suspiciousNames.some((kw) => name.includes(kw))) return true;
  }

  return false;
}

// ----------------------------------------------------------
// Helper: Detect document type from media info
// ----------------------------------------------------------
function detectDocumentType(
  mediaType: string,
  mimeType?: string,
  fileName?: string
): string {
  const name = (fileName || '').toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (name.includes('passport') || name.includes('pp')) return 'passport';
  if (name.includes('nid') || name.includes('national')) return 'other';
  if (name.includes('ielts') || name.includes('pte') || name.includes('toefl') || name.includes('duolingo')) return 'english_test';
  if (name.includes('transcript') || name.includes('marksheet') || name.includes('certificate') || name.includes('academic')) return 'academic';
  if (name.includes('sop') || name.includes('statement') || name.includes('purpose')) return 'sop';
  if (name.includes('lor') || name.includes('recommendation') || name.includes('reference')) return 'lor';
  if (name.includes('cv') || name.includes('resume')) return 'cv';
  if (name.includes('bank') || name.includes('financial') || name.includes('sponsor')) return 'financial';
  if (name.includes('photo') || name.includes('picture')) return 'photo';
  if (name.includes('visa')) return 'other';

  // By MIME type
  if (mime.includes('pdf')) return 'other';
  if (mediaType === 'image' && mime.includes('image')) return 'photo';

  return 'other';
}

// ----------------------------------------------------------
// Helper: Get file extension from MIME type
// ----------------------------------------------------------
function getExtensionFromMime(mimeType?: string): string {
  if (!mimeType) return '';
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'audio/ogg': '.ogg',
    'audio/mp4': '.m4a',
    'audio/mpeg': '.mp3',
    'audio/amr': '.amr',
    'video/mp4': '.mp4',
    'video/3gp': '.3gp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  };
  return map[mimeType] || '';
}
