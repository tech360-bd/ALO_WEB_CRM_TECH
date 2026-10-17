import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { requireMarketingAccess } from '@/lib/auth-rbac';
import {
  generateStudentId,
  generateLeadId,
  normalizePhone,
  detectDocumentType,
} from '@/lib/whatsapp-helpers';

/**
 * WhatsApp document auto-upload detection.
 *
 * Flow:
 *  1. Detect document type from filename + caption (Bangla + English keywords).
 *  2. Match sender by phone (normalized last-10-digits) to Student/Partner/Lead.
 *  3. If no profile exists, create Student + Lead using atomic year-scoped IDs.
 *     **If profile creation fails, return `needs_confirmation` and DO NOT
 *     create a Document — no orphan documents.**
 *  4. If type is unclear, ask the user to confirm.
 *  5. Persist Document + WhatsappMedia + StudentTimeline + audit trail.
 *
 * Audit events (one per meaningful step):
 *   - whatsapp.document.received        (file received from a phone)
 *   - whatsapp.document.type_detected   (type confidently identified)
 *   - whatsapp.document.matched_to_entity (linked to existing student/partner/lead)
 *   - whatsapp.document.attached        (Document row created and linked)
 */

const FALLBACK_DOC_TYPE = 'other';

export async function POST(request: NextRequest) {
  // Auth: marketing access required. The webhook itself does inline document
  // detection in its own `handleMediaAttachment` flow; this endpoint is the
  // CRM-side tool used by counselors to re-detect / re-link a document.
  const authOrResponse = await requireMarketingAccess(request);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  const ip = request.headers.get('x-forwarded-for') || null;
  const userAgent = request.headers.get('user-agent') || null;

  try {
    const body = await request.json();
    const { phoneNumber, fileName, fileUrl, mimeType, fileSize, caption, mediaUrl } = body;
    if (!phoneNumber || !fileName) {
      return NextResponse.json(
        { error: 'phoneNumber and fileName are required' },
        { status: 400 },
      );
    }

    const cleanPhone = normalizePhone(phoneNumber);
    const phoneSuffix = cleanPhone.slice(-10);

    // ---- Step 1: detect document type -------------------------------------
    const detection = detectDocumentType(fileName, caption);
    const detectedType = detection.needsConfirmation ? null : detection.type;

    await logAudit({
      action: 'whatsapp.document.received',
      module: 'whatsapp',
      recordId: phoneNumber,
      newData: {
        fileName,
        mimeType: mimeType ?? null,
        fileSize: fileSize ?? null,
        caption: caption ?? null,
        phone: phoneNumber,
      },
      ip,
      userAgent,
    });

    if (detectedType) {
      await logAudit({
        action: 'whatsapp.document.type_detected',
        module: 'whatsapp',
        recordId: phoneNumber,
        newData: {
          fileName,
          detectedType,
          confidence: detection.confidence,
        },
        ip,
        userAgent,
      });
    }

    // ---- Step 2: match sender by phone ------------------------------------
    let student = await db.student.findFirst({
      where: {
        OR: [
          { phone: { contains: phoneSuffix } },
          { whatsappNumber: { contains: phoneSuffix } },
        ],
      },
    });
    let partner = await db.partner.findFirst({
      where: {
        OR: [
          { phone: { contains: phoneSuffix } },
          { whatsappNumber: { contains: phoneSuffix } },
        ],
      },
    });
    let lead = await db.lead.findFirst({
      where: {
        OR: [
          { phone: { contains: phoneSuffix } },
          { whatsappNumber: { contains: phoneSuffix } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (student || partner || lead) {
      await logAudit({
        action: 'whatsapp.document.matched_to_entity',
        module: 'whatsapp',
        recordId: (student || partner || lead)?.id ?? phoneNumber,
        newData: {
          matchedTo: student ? 'student' : partner ? 'partner' : 'lead',
          studentId: student?.id ?? null,
          partnerId: partner?.id ?? null,
          leadId: lead?.id ?? null,
          phone: phoneNumber,
        },
        ip,
        userAgent,
      });
    }

    // ---- Step 3: create Student + Lead if no profile exists ---------------
    let newStudentId: string | null = null;
    if (!student && !partner && !lead) {
      const newStudentCode = await generateStudentId();
      const created = await db.student
        .create({
          data: {
            studentId: newStudentCode,
            firstName: 'WhatsApp',
            lastName: 'Doc',
            email: `wa_${phoneSuffix}@aloeducation.com`,
            phone: phoneNumber,
            whatsappNumber: phoneNumber,
            nationality: 'Bangladesh',
            status: 'prospective',
          },
        })
        .catch((err: unknown) => {
          console.error('[whatsapp/document-detect] Student creation failed:', err);
          return null;
        });

      if (!created) {
        // Bug 8 fix: never create a Document with null studentId/partnerId/leadId.
        // Surface the failure to the caller and let a counselor review manually.
        await logAudit({
          action: 'whatsapp.document.profile_creation_failed',
          module: 'whatsapp',
          recordId: phoneNumber,
          newData: { fileName, phone: phoneNumber },
          ip,
          userAgent,
        });
        return NextResponse.json(
          {
            status: 'needs_confirmation',
            message:
              'We received your document but could not create your profile automatically. A counselor will review and reach out shortly.',
            fileName,
            studentId: null,
            partnerId: null,
            leadId: null,
          },
          { status: 202 },
        );
      }

      student = created;
      newStudentId = created.id;

      const newLeadCode = await generateLeadId();
      lead = await db.lead
        .create({
          data: {
            leadId: newLeadCode,
            firstName: 'WhatsApp',
            lastName: 'Doc',
            phone: phoneNumber,
            whatsappNumber: phoneNumber,
            source: 'whatsapp',
            status: 'new',
            convertedToStudentId: created.id,
            notes: `Auto-created from WhatsApp document upload: ${fileName}`,
          },
        })
        .catch((err: unknown) => {
          console.error('[whatsapp/document-detect] Lead creation failed:', err);
          return null;
        });

      await logAudit({
        action: 'whatsapp.contact.auto_created',
        module: 'whatsapp',
        recordId: created.id,
        newData: {
          studentId: newStudentCode,
          leadId: newLeadCode,
          phone: phoneNumber,
          source: 'document_upload',
        },
        ip,
        userAgent,
      });
    }

    // ---- Step 4: if type unclear, ask user to confirm ---------------------
    if (!detectedType) {
      return NextResponse.json({
        status: 'needs_confirmation',
        message:
          'I received your document but could not identify the type. Please reply with one of: passport, transcript, certificate, IELTS, bank statement, sponsor letter, SOP, CV, offer letter, CAS, I-20, COE, deposit receipt, visa decision, etc.',
        fileName,
        studentId: student?.id || null,
        partnerId: partner?.id || null,
        leadId: lead?.id || null,
        detectedType: FALLBACK_DOC_TYPE,
      });
    }

    // ---- Step 5: persist Document + WhatsappMedia + timeline + audit ------
    // The Document model only has a `studentId` column (no partnerId/leadId).
    // Therefore we refuse to create a Document unless we have a non-null
    // `student` — otherwise the file would be orphaned with no linkable
    // entity. The student is either matched in Step 2 or auto-created in
    // Step 3 (which itself bails early on creation failure). The only way
    // `student` can still be null here is when only a partner/lead matched
    // but no student profile exists — in that case, escalate to a human.
    if (!student) {
      await logAudit({
        action: 'whatsapp.document.orphan_prevented',
        module: 'whatsapp',
        recordId: phoneNumber,
        newData: {
          fileName,
          phone: phoneNumber,
          reason: 'no_student_profile',
          partnerMatched: !!partner,
          leadMatched: !!lead,
        },
        ip,
        userAgent,
      });
      return NextResponse.json(
        {
          status: 'needs_confirmation',
          message:
            'We received your document but could not link it to a student profile. A counselor will review and reach out shortly.',
          fileName,
          partnerId: partner?.id || null,
          leadId: lead?.id || null,
        },
        { status: 202 },
      );
    }

    const document = await db.document
      .create({
        data: {
          studentId: student.id,
          documentType: detectedType,
          documentName: fileName,
          filePath: fileUrl || mediaUrl || `/uploads/whatsapp/${fileName}`,
          fileSize: fileSize || null,
          mimeType: mimeType || null,
          status: 'uploaded',
          note: caption || `Auto-uploaded via WhatsApp from ${phoneNumber}`,
        },
      })
      .catch((err: unknown) => {
        console.error('[whatsapp/document-detect] Document creation failed:', err);
        return null;
      });

    if (!document) {
      return NextResponse.json(
        { error: 'Failed to persist document' },
        { status: 500 },
      );
    }

    const whatsappMedia = await db.whatsappMedia
      .create({
        data: {
          mediaType: mimeType?.startsWith('image/')
            ? 'image'
            : mimeType?.startsWith('video/')
              ? 'video'
              : 'document',
          mediaUrl: fileUrl || mediaUrl || `/uploads/whatsapp/${fileName}`,
          originalUrl: mediaUrl || null,
          fileName,
          fileSize: fileSize || null,
          mimeType: mimeType || null,
          caption: caption || null,
          autoLinkedToDocument: true,
          documentId: document.id,
          studentId: student.id,
        },
      })
      .catch(() => null);

    // `student` is guaranteed non-null here (we bailed in the orphan-prevention
    // guard above), so we can safely use `student.id`.
    await db.studentTimeline
      .create({
        data: {
          studentId: student.id,
          eventType: 'document_uploaded',
          title: `Document uploaded via WhatsApp: ${detectedType}`,
          description: `File: ${fileName}. Auto-detected and linked.`,
          actorType: 'student',
          documentId: document.id,
          isPublic: true,
        },
      })
      .catch(() => {});

    await logAudit({
      userId: auth.user.id,
      action: 'whatsapp.document.attached',
      module: 'whatsapp',
      recordId: document.id,
      newData: {
        fileName,
        detectedType,
        studentId: student.id,
        partnerId: partner?.id ?? null,
        leadId: lead?.id ?? null,
        whatsappMediaId: whatsappMedia?.id ?? null,
        newStudentCreated: !!newStudentId,
      },
      ip,
      userAgent,
    });

    return NextResponse.json(
      {
        status: 'linked',
        detectedType,
        documentId: document.id,
        studentId: student.id,
        studentCode: student.studentId,
        partnerId: partner?.id || null,
        leadId: lead?.id || null,
        newStudentCreated: !!newStudentId,
        whatsappMediaId: whatsappMedia?.id || null,
        message: `Your ${detectedType.replace(/_/g, ' ')} has been received and linked to your profile. Our team will review it shortly.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('WhatsApp document detect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  // Lightweight introspection endpoint — list the supported document types.
  const supportedTypes = [
    'passport',
    'certificate',
    'transcript',
    'bank_statement',
    'english_test',
    'visa_file',
    'offer_letter',
    'cas_coe_i20',
    'payment_receipt',
    'partner_agreement',
    'invoice',
    'other',
  ];
  return NextResponse.json({
    supportedDocumentTypes: supportedTypes,
    description:
      'POST { phoneNumber, fileName, fileUrl, mimeType, fileSize, caption } to auto-detect and link a document.',
  });
}
