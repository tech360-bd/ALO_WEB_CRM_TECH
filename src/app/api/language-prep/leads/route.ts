import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      countryId,
      countryName,
      universityId,
      universityName,
      courseId,
      courseName,
      testId,
      testName,
      currentScore,
      targetScore,
      intake,
      currentLevel,
      preferredFormat,
      preparationTime,
      source = 'language_prep',
      sourceSection = 'general',
      notes,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: 'Name and phone are required' }, { status: 400 });
    }

    // Validate no duplicate leads unnecessarily — check recent lead with same phone+test within 24h
    try {
      const recentLead = await (db as any).languagePrepLead?.findFirst?.({
        where: {
          phone,
          testName: testName || undefined,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (recentLead) {
        return NextResponse.json({
          success: true,
          leadId: recentLead.id,
          message: 'Lead already exists — our team will contact you shortly',
          isDuplicate: true,
        });
      }
    } catch (e) {
      console.warn('Duplicate lead check failed', e);
    }

    // Create language prep lead
    let lead: any = null;
    try {
      lead = await (db as any).languagePrepLead?.create?.({
        data: {
          name,
          phone,
          email: email || '',
          countryId: countryId || '',
          countryName: countryName || '',
          universityId: universityId || '',
          universityName: universityName || '',
          courseId: courseId || '',
          courseName: courseName || '',
          testId: testId || '',
          testName: testName || '',
          currentScore: currentScore || '',
          targetScore: targetScore || '',
          intake: intake || '',
          currentLevel: currentLevel || '',
          preferredFormat: preferredFormat || '',
          preparationTime: preparationTime || '',
          source,
          sourceSection,
          status: 'new',
          notes: notes || '',
        },
      });
    } catch (e) {
      console.warn('LanguagePrepLead create failed, falling back to LeadForm', e);
      // Fallback to existing LeadForm / MarketingLead
      try {
        lead = await db.leadForm.create({
          data: {
            name,
            phone,
            email: email || '',
            preferredCountry: countryName || '',
            preferredLevel: '',
            preferredSubject: courseName || '',
            intake: intake || '',
            englishTest: testName || '',
            englishScore: currentScore || '',
            message: notes || `Language Prep: ${testName} Target: ${targetScore} Source: ${sourceSection}`,
            source,
            sourceSection,
            status: 'new',
          },
        });
      } catch (e2) {
        console.warn('LeadForm fallback also failed', e2);
      }
    }

    // Also create CRM lead via existing public lead API logic if available — try to create marketing lead
    try {
      await db.marketingLead.create({
        data: {
          name,
          phone,
          email: email || '',
          destination: countryName || '',
          level: '',
          intake: intake || '',
          ieltsScore: parseFloat(currentScore) || 0,
          source,
          sourceDetail: sourceSection,
          status: 'new',
        },
      });
    } catch (e) {
      console.warn('MarketingLead create failed', e);
    }

    // Audit log
    try {
      await db.portalAuditLog.create({
        data: {
          actorUserId: 'public',
          action: 'LANGUAGE_PREP_LEAD_CREATED',
          entityType: 'LanguagePrepLead',
          entityId: lead?.id || 'unknown',
          ipAddress: req.headers.get('x-forwarded-for') || '',
          userAgent: req.headers.get('user-agent') || '',
          metadata: JSON.stringify({ name, phone, testName, source, sourceSection }),
        },
      });
    } catch (e) {
      console.warn('Audit log failed', e);
    }

    return NextResponse.json({
      success: true,
      leadId: lead?.id || 'created',
      message: 'Lead captured — our team will contact you shortly',
      data: lead,
    });
  } catch (error: any) {
    console.error('Language prep lead API error', error);
    return NextResponse.json({ success: false, error: 'Failed to capture lead' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'new';
    const source = searchParams.get('source') || 'language_prep';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    let leads: any[] = [];
    let total = 0;
    try {
      const where: any = { source };
      if (status) where.status = status;
      
      const [count, data] = await Promise.all([
        (db as any).languagePrepLead?.count?.({ where }) || 0,
        (db as any).languagePrepLead?.findMany?.({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }) || [],
      ]);
      total = count;
      leads = data;
    } catch (e) {
      console.warn('LanguagePrepLead fetch failed', e);
      // Fallback to LeadForm
      const where: any = { source };
      if (status) where.status = status;
      const [count, data] = await Promise.all([
        db.leadForm.count({ where }).catch(() => 0),
        db.leadForm.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }).catch(() => []),
      ]);
      total = count;
      leads = data;
    }

    return NextResponse.json({
      success: true,
      leads,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Language prep leads GET error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch leads' }, { status: 500 });
  }
}
