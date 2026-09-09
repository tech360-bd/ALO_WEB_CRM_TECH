import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      preferredCountry,
      destination,
      preferredLevel,
      preferredSubject,
      intake,
      budget,
      englishTest,
      englishScore,
      message,
      service,
      source,
    } = body;

    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'Name, phone, and email are required.' },
        { status: 400 }
      );
    }

    const country = preferredCountry || destination || 'United Kingdom';
    const leadCode = `LEAD-${Date.now().toString(36).toUpperCase()}`;

    // 1. Create Lead in LeadForm (public web capture)
    const leadFormRecord = await db.leadForm.create({
      data: {
        name,
        phone,
        email,
        preferredCountry: country,
        preferredLevel: preferredLevel || 'Postgraduate',
        preferredSubject: preferredSubject || '',
        intake: intake || 'September 2026',
        budget: budget || '',
        englishTest: englishTest || 'IELTS',
        englishScore: englishScore || '',
        message: message || (service ? `Service requested: ${service}` : ''),
        source: source || 'public_website',
        status: 'pending',
      },
    }).catch(() => null);

    // 2. Create Lead in MarketingLead (CRM pipeline)
    const marketingLeadRecord = await db.marketingLead.create({
      data: {
        name,
        phone,
        email,
        destination: country,
        level: preferredLevel || 'Postgraduate',
        intake: intake || 'September 2026',
        budget: budget || '',
        ieltsScore: parseFloat(englishScore) || 0,
        source: source || 'website_inquiry',
        sourceDetail: `[Subject: ${preferredSubject || 'N/A'}] [Test: ${englishTest || 'N/A'}] ${message || ''}`,
        status: 'new',
        score: 75,
        hotLead: true,
        consent: true,
      },
    }).catch(() => null);

    // 3. Create Audit Log
    await db.crmAuditLog.create({
      data: {
        actorUserId: 'public_visitor',
        actorRole: 'GUEST',
        action: 'PUBLIC_LEAD_SUBMITTED',
        targetCollection: 'LeadForm',
        targetId: leadFormRecord?.id || marketingLeadRecord?.id || leadCode,
        afterData: JSON.stringify({ name, email, phone, country }),
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your study abroad consultation request has been submitted successfully.',
      leadId: leadFormRecord?.id || marketingLeadRecord?.id || leadCode,
      data: {
        name,
        email,
        phone,
        country,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to submit consultation inquiry.' },
      { status: 500 }
    );
  }
}
