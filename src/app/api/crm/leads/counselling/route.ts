import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { APPLICATION_FORM_SECTIONS, type FormSectionKey } from '@/lib/forms/application-form-schema';
import { allocateIdentifier } from '@/lib/identity/student-id';
import { acquireStudentCreateLock, releaseStudentCreateLock, studentLockKey } from '@/lib/identity/student-create-lock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * FORM C — manual lead add (counsellor)
 * =====================================
 * Spec: "Counsellor auto-assignment ALSO MANUAL LEAD ADD SAME FROM B CAN
 * COMPLETED Counselling — CRM-ready."
 *
 * A counselor opens /crm/leads/new, fills the *same* Form B sections
 * (src/lib/forms/application-form-schema.ts renders both screens), and this
 * endpoint turns that into CRM records:
 *
 *   1. a lead (LeadForm — the same table the public forms write, so the CRM lead
 *      queue stays one queue),
 *   2. a Student row keyed on the email/phone when one does not exist yet, so the
 *      counseling can continue in the portal without re-typing anything,
 *   3. StudentProfileSection rows for each submitted section, marked complete —
 *      which is what makes Form B completeness (and therefore Apply Now) real for
 *      a student whose profile was filled by a counselor,
 *   4. assignment to the chosen counselor, a portal notification and an audit log.
 *
 * Values captured here are the same keys the portal sends, so a student who later
 * signs in sees their own answers already filled in.
 */

const MAX_TEXT = 2000;

type SectionPayload = Record<string, Record<string, unknown>>;

function bounded(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length > MAX_TEXT) return trimmed.slice(0, MAX_TEXT);
  return trimmed;
}

function cleanPayload(raw: unknown): SectionPayload {
  if (!raw || typeof raw !== 'object') return {};
  const allowed = new Set(APPLICATION_FORM_SECTIONS.map((section) => section.key as string));
  const out: SectionPayload = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!allowed.has(key) || !value || typeof value !== 'object') continue;
    const fields: Record<string, unknown> = {};
    for (const [field, fieldValue] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = bounded(fieldValue);
      if (cleaned !== null && cleaned !== '') fields[field] = cleaned;
    }
    if (Object.keys(fields).length > 0) out[key] = fields;
  }
  return out;
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function looksLikePhone(value: string) {
  return /^[+\d][\d\s()-]{6,24}$/.test(value);
}

export const POST = withAuth(async (req, auth) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const sections = cleanPayload(body.sections);
  const lead = sections.lead || {};
  const personal = sections.personal || {};
  const contact = sections.contact || {};

  const name = String(personal.fullName || [lead.givenName, lead.familyName].filter(Boolean).join(' ') || '').trim();
  const email = String(lead.leadEmail || contact.primaryEmail || '').trim().toLowerCase();
  const phone = String(
    [lead.countryCode, lead.mobile].filter(Boolean).join(' ').trim() || contact.contactPhone || ''
  ).trim();

  if (!name) return NextResponse.json({ success: false, error: 'A full name is required to create a lead.' }, { status: 400 });
  if (!email || !looksLikeEmail(email)) return NextResponse.json({ success: false, error: 'A valid email is required to create a lead.' }, { status: 400 });
  if (!phone || !looksLikePhone(phone)) return NextResponse.json({ success: false, error: 'A valid phone number is required to create a lead.' }, { status: 400 });
  if (Object.keys(sections).length === 0) {
    return NextResponse.json({ success: false, error: 'Fill at least one section before saving the lead.' }, { status: 400 });
  }

  const counselingMode = body.counselingMode === true;
  const welcomeEmail = sections.notes?.sendWelcomeEmail === 'true' || sections.notes?.notifyStudent === 'true';
  const requestedCounselorId = typeof body.counselorId === 'string' ? body.counselorId.trim() : '';

  try {
    const result = await db.$transaction(async (tx) => {
      // ── 1. Lead row (same table the public forms use) ──────────────────────
      const preference = (sections.admission || {}) as Record<string, string>;
      const now = new Date();
      const existingLead = await tx.leadForm.findFirst({
        where: { OR: [{ email }, { phone }] },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      const leadData = {
        name,
        phone,
        email,
        preferredCountry: String(lead.preferredDestination || preference.studyDestination || ''),
        preferredLevel: String(preference.studyLevel || ''),
        preferredSubject: String(preference.programTitle || ''),
        intake: String(preference.intake || ''),
        message: String(sections.notes?.caseNotes || lead.remarks || ''),
        source: 'crm_manual_lead',
        sourceSection: `crm-manual — filled by ${auth.name || auth.userId}${counselingMode ? ' · counseling session' : ''}`,
        status: 'new',
        assignedCounselorId: requestedCounselorId || auth.userId,
      };

      const leadRow = existingLead
        ? await tx.leadForm.update({ where: { id: existingLead.id }, data: { ...leadData, updatedAt: now } })
        : await tx.leadForm.create({ data: leadData });

      // ── 2. Student row so the case can move into the portal ────────────────
      //
      // Duplicate-safety, two independent layers:
      //
      // (a) Student ID — allocated by the canonical `StudentIdSequence` counter
      //     (src/lib/identity/student-id.ts), the same allocator used by portal
      //     registration and the admin import center. It advances one row with
      //     `LAST_INSERT_ID(expr)` under a row lock, so two concurrent
      //     transactions can never receive the same number. The previous
      //     implementation counted matching `studentId` prefixes and added one,
      //     which handed the identical identifier to every concurrent
      //     submission and produced a 6-digit sequence that matched no other
      //     writer's `AE-YYYY#####` format.
      //
      // (b) Student row — `email`/`phone` carry no unique index, so the
      //     find-then-create below is serialized on an advisory lock keyed by
      //     the normalized natural key (see student-create-lock.ts for why a
      //     unique index is not added here).
      const lockKey = studentLockKey(email, phone);
      const lockHeld = await acquireStudentCreateLock(tx, lockKey);
      let studentId = '';
      let existingStudent: { id: string; studentId: string; userId: string | null; counselorId: string | null } | null = null;
      try {
        existingStudent = await tx.student.findFirst({
          where: { OR: [{ email }, { phone }] },
          select: { id: true, studentId: true, userId: true, counselorId: true },
        });

        studentId = existingStudent?.id || '';
        if (!existingStudent) {
          const studentCode = await allocateIdentifier(tx, 'AE');
          const created = await tx.student.create({
            data: {
              studentId: studentCode,
              name,
              email,
              phone,
              status: 'active',
              userType: 'ALO_FULL_STUDENT',
              journeyStage: 'lead_created',
              counselorId: requestedCounselorId || auth.userId,
              counselorName: auth.name || '',
              leadId: leadRow.id,
            },
            select: { id: true, studentId: true },
          });
          studentId = created.id;
        } else if (!existingStudent.counselorId && (requestedCounselorId || auth.userId)) {
          await tx.student.update({
            where: { id: existingStudent.id },
            data: { counselorId: requestedCounselorId || auth.userId, counselorName: auth.name || '' },
          });
        }
      } finally {
        if (lockHeld) await releaseStudentCreateLock(tx, lockKey);
      }

      // ── 3. Form B sections captured by the counselor ───────────────────────
      const written: FormSectionKey[] = [];
      for (const [key, payload] of Object.entries(sections)) {
        const sectionKey = key as FormSectionKey;
        // StudentProfileSection has no compound unique index on every deployed
        // database, so a counselor's captured answer is written with an explicit
        // find-then-write: update the existing row, otherwise create it.
        const data = JSON.stringify({ ...payload, capturedBy: auth.userId, capturedAt: now.toISOString() });
        const existingSection = await tx.studentProfileSection.findFirst({
          where: { studentId, section: sectionKey },
          select: { id: true },
        });
        if (existingSection) {
          await tx.studentProfileSection.update({
            where: { id: existingSection.id },
            data: { status: 'complete', data, completedAt: now },
          });
        } else {
          await tx.studentProfileSection.create({
            data: { studentId, section: sectionKey, status: 'complete', data, completedAt: now },
          });
        }
        written.push(sectionKey);
      }

      // ── 4. Team visibility ─────────────────────────────────────────────────
      const counselorId = requestedCounselorId || existingStudent?.counselorId || auth.userId;
      if (counselorId && counselorId !== auth.userId) {
        await tx.portalNotification.create({
          data: {
            userId: counselorId,
            title: 'New lead assigned to you',
            message: `${name} (${email}) — added by ${auth.name || 'a teammate'}. Sections captured: ${written.join(', ')}.`,
            type: 'new_lead',
            isRead: false,
            actionUrl: `/crm/leads/${leadRow.id}`,
          },
        }).catch(() => {});
      }
      await tx.studentEvent.create({
        data: {
          studentId,
          eventType: 'MANUAL_LEAD_CREATED',
          payload: JSON.stringify({ leadId: leadRow.id, sections: written, counselorId, welcomeEmail }),
        },
      }).catch(() => {});
      await tx.timelineEvent.create({
        data: {
          studentId,
          stage: 'lead_created',
          title: 'Lead created by ALO counselor',
          description: `Sections captured: ${written.join(', ')}.`,
          actor: auth.userId,
        },
      }).catch(() => {});
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.userId,
          action: 'manual_lead.created',
          entityType: 'LeadForm',
          entityId: leadRow.id,
          metadata: JSON.stringify({ studentId, sections: written, counselingMode, welcomeEmail }),
        },
      }).catch(() => {});

      return { leadId: leadRow.id, studentId, sections: written, isExistingLead: Boolean(existingLead) };
    }, { timeout: 20000 });

    // Welcome / notification email — outside the transaction, best-effort.
    if (welcomeEmail && email) {
      try {
        const { sendEmail } = await import('@/lib/email-service');
        const sent = await sendEmail({
          to: email,
          subject: 'Welcome to ALO Education',
          html: `<h2 style="font-family:sans-serif">Welcome, ${name}</h2>
            <p style="font-family:sans-serif">Your counselor at ALO Education has opened your file and captured the details you shared.</p>
            <p style="font-family:sans-serif">Next step: create your portal account with this email address so you can review and complete your application profile.</p>`,
          text: `Welcome to ALO Education, ${name}. Your counselor has opened your file — create your portal account with this email to continue.`,
        });
        if (!sent.success) console.warn('[crm/leads/counselling] welcome email not sent:', sent.error);
      } catch (mailError) {
        console.error('[crm/leads/counselling] welcome email failed:', mailError);
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: result.isExistingLead
        ? 'Lead updated — the existing record was reused for this email/phone.'
        : 'Lead created with the Form B sections you captured.',
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/crm/leads/counselling error', error);
    return NextResponse.json({ success: false, error: 'The lead could not be created.' }, { status: 500 });
  }
});
