import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { seedFollowUpTemplates, DEFAULT_FOLLOWUP_DAYS } from '@/lib/whatsapp-followup-engine';

export const GET = withAuth(async (req, auth) => {
  try {
    await seedFollowUpTemplates();

    const { searchParams } = new URL(req.url);
    const day = searchParams.get('day');
    const language = searchParams.get('language');
    const active = searchParams.get('active') || 'active';

    const where: any = {};
    if (day) where.day = parseInt(day);
    if (language) where.language = language;
    if (active) where.activeStatus = active;

    const templates = await db.whatsAppFollowUpTemplate.findMany({
      where,
      orderBy: { day: 'asc' },
    });

    return NextResponse.json({
      success: true,
      templates,
      defaultSchedule: DEFAULT_FOLLOWUP_DAYS,
      variables: ['{{name}}','{{student_code}}','{{portal_link}}','{{counselor_name}}','{{branch_name}}','{{country}}','{{intake}}'],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, auth) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('admin') || auth.roles.includes('marketing');
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Admin or Marketing role required' }, { status: 403 });
    }

    const body = await req.json();
    const { templateName, language, day, purpose, messageBody, variables, metaTemplateName, approvalStatus, activeStatus } = body;

    if (!templateName || !messageBody) {
      return NextResponse.json({ success: false, error: 'templateName and messageBody required' }, { status: 400 });
    }

    const template = await db.whatsAppFollowUpTemplate.upsert({
      where: { templateName },
      update: {
        language: language || 'english',
        day: day || 3,
        purpose: purpose || 'follow_up',
        messageBody,
        variables: variables || JSON.stringify(['{{name}}','{{student_code}}','{{portal_link}}','{{counselor_name}}','{{branch_name}}','{{country}}','{{intake}}']),
        metaTemplateName: metaTemplateName || '',
        approvalStatus: approvalStatus || 'pending',
        activeStatus: activeStatus || 'active',
      },
      create: {
        templateName,
        language: language || 'english',
        day: day || 3,
        purpose: purpose || 'follow_up',
        messageBody,
        variables: variables || JSON.stringify(['{{name}}','{{student_code}}','{{portal_link}}','{{counselor_name}}','{{branch_name}}','{{country}}','{{intake}}']),
        metaTemplateName: metaTemplateName || '',
        approvalStatus: approvalStatus || 'pending',
        activeStatus: activeStatus || 'active',
        createdBy: auth.userId,
      },
    });

    await db.aloAuditLog.create({
      data: {
        actorType: auth.roles[0] || 'admin',
        actorName: auth.name || auth.userId,
        action: 'FOLLOWUP_TEMPLATE_UPSERT',
        resource: 'WhatsAppFollowUpTemplate',
        resourceId: template.id,
        details: JSON.stringify({ templateName, day }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
