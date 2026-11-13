import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { seedFollowUpTemplates, DEFAULT_FOLLOWUP_DAYS } from '@/lib/whatsapp-followup-engine';
import { getWhatsAppAccessToken, getWhatsAppGraphUrl } from '@/lib/whatsapp-config';
import { MAIN_NUMBER } from '@/lib/whatsapp-number-pool';
import { normalizePhone } from '@/lib/phone-normalization';

function isSuperAdmin(auth: AuthContext) {
  return auth.roles.some((role) => role.toLowerCase() === 'super_admin');
}

export const GET = withAuth(async (req, auth) => {
  if (!auth.permissions.includes('m1') && !auth.permissions.includes('m2') && !isSuperAdmin(auth)) {
    return NextResponse.json({ success: false, error: 'Marketing template view permission required.' }, { status: 403 });
  }
  try {
    await seedFollowUpTemplates();
    const { searchParams } = new URL(req.url);
    const day = searchParams.get('day');
    const language = searchParams.get('language');
    const active = searchParams.get('active');
    const where: Record<string, unknown> = {};
    if (day && /^\d+$/.test(day)) where.day = Number(day);
    if (language) where.language = language;
    if (active) where.activeStatus = active;
    const templates = await db.whatsAppFollowUpTemplate.findMany({ where, orderBy: { day: 'asc' } });
    return NextResponse.json({
      success: true,
      templates,
      defaultSchedule: DEFAULT_FOLLOWUP_DAYS,
      variables: ['{{name}}', '{{student_code}}', '{{portal_link}}', '{{counselor_name}}', '{{branch_name}}', '{{country}}', '{{intake}}'],
      note: 'Seeded templates are drafts only. Neither ALO approval nor Meta template approval is implied.',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'WhatsApp follow-up templates could not be loaded.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req, auth) => {
  if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid template payload is required.' }, { status: 400 });

  if (body.action === 'verify_meta') {
    if (!isSuperAdmin(auth)) return NextResponse.json({ success: false, error: 'Super Admin access is required to verify a template against Meta.' }, { status: 403 });
    const templateId = typeof body.templateId === 'string' ? body.templateId.trim() : '';
    const template = templateId ? await db.whatsAppFollowUpTemplate.findUnique({ where: { id: templateId } }) : null;
    if (!template) return NextResponse.json({ success: false, error: 'Template not found.' }, { status: 404 });
    const number = await db.whatsAppOfficialNumber.findUnique({ where: { normalizedPhone: normalizePhone(MAIN_NUMBER) } });
    const accessToken = getWhatsAppAccessToken();
    if (!accessToken || !number?.metaBusinessAccountId) {
      const errorCode = !accessToken ? 'CLOUD_API_TOKEN_NOT_CONFIGURED' : 'META_BUSINESS_ACCOUNT_ID_NOT_CONFIGURED';
      const updated = await db.whatsAppFollowUpTemplate.update({ where: { id: template.id }, data: { metaTemplateStatus: 'unknown', metaTemplateCheckedAt: new Date(), metaTemplateCheckError: errorCode, activeStatus: 'inactive' } });
      return NextResponse.json({ success: false, error: errorCode, template: updated }, { status: 503 });
    }
    const url = getWhatsAppGraphUrl(`${number.metaBusinessAccountId}/message_templates`);
    if (!url) return NextResponse.json({ success: false, error: 'WHATSAPP_GRAPH_VERSION_INVALID' }, { status: 503 });
    try {
      const providerUrl = new URL(url);
      providerUrl.searchParams.set('name', template.metaTemplateName || template.templateName);
      providerUrl.searchParams.set('fields', 'name,status,language,category');
      const response = await fetch(providerUrl, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(12000), redirect: 'error' });
      const data: any = await response.json().catch(() => ({}));
      const providerCode = Number(data?.error?.code);
      const matches = Array.isArray(data?.data)
        ? data.data.filter((row: any) => row?.name === (template.metaTemplateName || template.templateName))
        : [];
      const approved = response.ok && matches.some((row: any) => String(row.status).toUpperCase() === 'APPROVED');
      const providerStatus = approved ? 'APPROVED' : response.ok ? (String(matches[0]?.status || 'NOT_FOUND').toUpperCase()) : 'ERROR';
      const errorCode = approved ? '' : !response.ok ? `META_TEMPLATE_HTTP_${response.status}${Number.isFinite(providerCode) ? `_CODE_${providerCode}` : ''}` : matches.length ? 'META_TEMPLATE_NOT_APPROVED' : 'META_TEMPLATE_NOT_FOUND';
      const updated = await db.whatsAppFollowUpTemplate.update({
        where: { id: template.id },
        data: { metaTemplateStatus: providerStatus, metaTemplateCheckedAt: new Date(), metaTemplateCheckError: errorCode, ...(approved ? {} : { activeStatus: 'inactive' }) },
      });
      await db.auditLog.create({
        data: {
          userId: auth.userId,
          action: approved ? 'WHATSAPP_TEMPLATE_META_VERIFIED' : 'WHATSAPP_TEMPLATE_META_CHECK_FAILED',
          resource: 'WhatsAppFollowUpTemplate',
          resourceId: template.id,
          actorRole: auth.roles.join(','),
          details: JSON.stringify({ providerStatus, errorCode: errorCode || undefined, metaTemplateName: template.metaTemplateName || template.templateName }),
        },
      }).catch(() => {});
      return NextResponse.json({ success: approved, template: updated, error: errorCode || undefined }, { status: approved ? 200 : 502 });
    } catch {
      const updated = await db.whatsAppFollowUpTemplate.update({ where: { id: template.id }, data: { metaTemplateStatus: 'ERROR', metaTemplateCheckedAt: new Date(), metaTemplateCheckError: 'META_TEMPLATE_CHECK_FAILED', activeStatus: 'inactive' } }).catch(() => null);
      return NextResponse.json({ success: false, error: 'META_TEMPLATE_CHECK_FAILED', template: updated || undefined }, { status: 502 });
    }
  }

  if (body.action === 'activate') {
    if (!isSuperAdmin(auth)) return NextResponse.json({ success: false, error: 'Super Admin access is required to activate a follow-up template.' }, { status: 403 });
    const templateId = typeof body.templateId === 'string' ? body.templateId.trim() : '';
    const template = templateId ? await db.whatsAppFollowUpTemplate.findUnique({ where: { id: templateId } }) : null;
    if (!template) return NextResponse.json({ success: false, error: 'Template not found.' }, { status: 404 });
    const recentlyVerified = Boolean(template.metaTemplateCheckedAt && Date.now() - template.metaTemplateCheckedAt.getTime() >= 0 && Date.now() - template.metaTemplateCheckedAt.getTime() <= 24 * 60 * 60 * 1000);
    const approval = await db.marketingApproval.findFirst({ where: { itemType: 'WhatsAppFollowUpTemplate', itemId: template.id, status: 'approved' }, select: { id: true } });
    if (template.approvalStatus !== 'approved' || template.metaTemplateStatus !== 'APPROVED' || !recentlyVerified || !approval) {
      return NextResponse.json({ success: false, error: 'Template requires ALO approval and a recent successful Meta template check before activation.' }, { status: 409 });
    }
    const updated = await db.whatsAppFollowUpTemplate.update({ where: { id: template.id }, data: { activeStatus: 'active', metaTemplateCheckError: '' } });
    await db.auditLog.create({ data: { userId: auth.userId, action: 'WHATSAPP_TEMPLATE_ACTIVATED', resource: 'WhatsAppFollowUpTemplate', resourceId: template.id, actorRole: auth.roles.join(','), details: JSON.stringify({ metaTemplateName: template.metaTemplateName }) } }).catch(() => {});
    return NextResponse.json({ success: true, template: updated });
  }

  const canSubmit = isSuperAdmin(auth) || auth.roles.some((role) => ['admin', 'marketing_manager', 'marketing'].includes(role.toLowerCase()));
  if (!canSubmit) return NextResponse.json({ success: false, error: 'Marketing Manager or administrator role required.' }, { status: 403 });
  const templateName = typeof body.templateName === 'string' ? body.templateName.trim() : '';
  const messageBody = typeof body.messageBody === 'string' ? body.messageBody.trim() : '';
  if (!/^[a-z0-9_]{2,100}$/.test(templateName) || !messageBody || messageBody.length > 1024) {
    return NextResponse.json({ success: false, error: 'A lowercase Meta template name and message body of at most 1,024 characters are required.' }, { status: 400 });
  }
  const day = Number(body.day || 3);
  if (!DEFAULT_FOLLOWUP_DAYS.includes(day)) return NextResponse.json({ success: false, error: 'Unsupported follow-up day.' }, { status: 400 });
  const variables = Array.isArray(body.variables) ? JSON.stringify(body.variables.slice(0, 20)) : JSON.stringify(['{{name}}']);
  const language = typeof body.language === 'string' && ['english', 'bangla', 'mixed'].includes(body.language) ? body.language : 'english';
  const metaLanguage = typeof body.metaLanguage === 'string' && /^[a-z]{2}_[A-Z]{2}$/.test(body.metaLanguage) ? body.metaLanguage : 'en_US';
  const metaTemplateName = typeof body.metaTemplateName === 'string' && /^[a-z0-9_]{2,100}$/.test(body.metaTemplateName.trim()) ? body.metaTemplateName.trim() : templateName;
  const existing = await db.whatsAppFollowUpTemplate.findUnique({ where: { templateName } });
  const data = {
    language,
    day,
    purpose: 'follow_up',
    messageBody,
    variables,
    metaTemplateName,
    metaLanguage,
    approvalStatus: 'pending',
    metaTemplateStatus: 'unknown',
    metaTemplateCheckedAt: null,
    metaTemplateCheckError: '',
    activeStatus: 'inactive',
  };
  const template = existing
    ? await db.whatsAppFollowUpTemplate.update({ where: { id: existing.id }, data })
    : await db.whatsAppFollowUpTemplate.create({ data: { templateName, ...data, createdBy: auth.userId } });

  let approval = await db.marketingApproval.findFirst({ where: { itemType: 'WhatsAppFollowUpTemplate', itemId: template.id, status: 'pending' } });
  if (!approval) approval = await db.marketingApproval.create({
    data: { itemType: 'WhatsAppFollowUpTemplate', itemId: template.id, title: `WhatsApp follow-up: ${template.templateName}`, description: 'Review the exact outbound copy before requesting Meta template approval.', status: 'pending', requestedById: auth.userId },
  });
  await db.auditLog.create({ data: { userId: auth.userId, action: 'WHATSAPP_TEMPLATE_SUBMITTED_FOR_APPROVAL', resource: 'WhatsAppFollowUpTemplate', resourceId: template.id, actorRole: auth.roles.join(','), details: JSON.stringify({ templateName: template.templateName, approvalId: approval.id }) } }).catch(() => {});
  return NextResponse.json({ success: true, data: template, approvalId: approval.id, message: 'Template remains inactive until separately approved by ALO and verified as approved by Meta.' }, { status: existing ? 200 : 201 });
});
