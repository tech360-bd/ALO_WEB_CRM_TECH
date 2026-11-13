import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { db } from '@/lib/db';
import { canViewB2B } from '@/lib/application-manager/service';
import { buildOfficialDocumentHtml, escapeHtml, moneyRow } from '@/lib/documents/official-documents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function canReadOffers(roles: string[], permissions: string[], counselorId: string, userId: string): boolean {
  const normalized = roles.map((role) => role.toLowerCase());
  const globalRoles = ['super_admin', 'admin', 'application_manager', 'application_team', 'application_officer', 'visa_officer'];
  if (normalized.some((role) => globalRoles.includes(role))) return true;
  if (permissions.includes('application.view_offer') || permissions.includes('application.manage_offer')) return true;
  return normalized.includes('counselor') && counselorId === userId;
}

/**
 * GET /api/applications/[id]/offer-letter
 *
 * Renders the university offer as an ALO Education official document: always on
 * the company letterhead, and carrying the official seal only when a Super Admin
 * is the issuing authority (src/lib/documents/official-documents.ts).
 *
 * Access mirrors the offer API: a student may download their own offer, ALO
 * staff need offer-view permission, and partner users are refused because offer
 * records are private ALO data.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await authenticateUnified(req);
  if (auth instanceof NextResponse) return auth;

  const portal = auth.type === 'portal' ? auth.data : null;
  const roles = (portal?.roles || []).map((role) => role.toLowerCase());
  const isPartner = Boolean(portal && (
    portal.partnerId
    || portal.userType.toLowerCase() === 'partner'
    || roles.some((role) => role.startsWith('partner'))
  ));
  if (isPartner) {
    return NextResponse.json({ success: false, error: 'Partner access to private offer records is not permitted.' }, { status: 403 });
  }

  const app = await db.application.findFirst({
    where: { id: params.id, ...(auth.type === 'student' ? { studentId: auth.data.studentId } : {}) },
  });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

  if (portal) {
    if (!canReadOffers(portal.roles, portal.permissions, app.counselorId, portal.userId)) {
      return NextResponse.json({ success: false, error: 'Application is not within your offer-view permission scope.' }, { status: 403 });
    }
    if ((app.isB2b || app.isB2bConfidential) && !canViewB2B(portal.roles, portal.permissions)) {
      return NextResponse.json({ success: false, error: 'B2B offer letters require explicit B2B permission.' }, { status: 403 });
    }
  }

  const offer = await db.applicationOffer.findFirst({
    where: { applicationId: params.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!offer) return NextResponse.json({ success: false, error: 'No offer recorded for this application.' }, { status: 404 });

  const student = await db.student.findUnique({
    where: { id: app.studentId },
    select: { name: true, studentId: true },
  });

  const conditions = typeof offer.offerConditions === 'string' ? offer.offerConditions.trim() : '';
  const rows = [
    offer.scholarship ? moneyRow('Scholarship', offer.scholarshipAmount || 0) : '',
    offer.depositAmount ? moneyRow('Deposit required', offer.depositAmount) : '',
  ].filter(Boolean).join('');

  const html = await buildOfficialDocumentHtml({
    kind: 'offer-letter',
    title: `Offer letter — ${offer.offerStatus.replace(/_/g, ' ').toLowerCase()}`,
    issuedTo: student?.name ? `${student.name}${student.studentId ? ` (${student.studentId})` : ''}` : app.studentId,
    reference: app.applicationCode,
    authority: portal
      ? { userType: portal.userType, roles: portal.roles, actingAsSessionId: portal.actingAsSessionId }
      : null,
    meta: [
      { label: 'Application', value: app.applicationCode },
      { label: 'University', value: app.universityName || '—' },
      { label: 'Programme', value: app.courseName || '—' },
      { label: 'Intake', value: app.intake || '—' },
      { label: 'Destination', value: app.country || '—' },
      { label: 'Offer status', value: offer.offerStatus },
      ...(offer.decisionDate ? [{ label: 'Decision date', value: offer.decisionDate.toISOString().slice(0, 10) }] : []),
      ...(offer.conditionDeadline ? [{ label: 'Conditions due', value: offer.conditionDeadline.toISOString().slice(0, 10) }] : []),
    ],
    bodyHtml: `
      ${rows ? `<table class="amounts"><tbody>${rows}</tbody></table>` : ''}
      <h2 style="font-size:13px;margin:16px 0 4px;color:#0057B8">Conditions of this offer</h2>
      <p>${conditions ? escapeHtml(conditions) : 'No conditions have been recorded on this offer.'}</p>
      ${offer.decisionNote ? `<h2 style="font-size:13px;margin:16px 0 4px;color:#0057B8">Decision note</h2><p>${escapeHtml(offer.decisionNote)}</p>` : ''}
      <p class="note">This letter restates the university&apos;s decision as recorded by ALO Education. The university&apos;s own offer document remains the authoritative record; where the two differ, the university document governs.</p>
    `,
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="alo-offer-letter-${app.applicationCode.replace(/[^A-Za-z0-9-]/g, '')}.html"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
    },
  });
}
