// ============================================================
// /api/admin/countries
// GET, POST, PUT, DELETE — Country Master Management & CSV Import API
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { COUNTRY_DESTINATIONS } from '@/lib/country-destinations-data';

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const countries = await db.country.findMany({
      include: {
        quickFacts: true,
        cities: true,
        sources: true,
        faqs: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Provide default rich list if DB table is fresh
    if (countries.length === 0) {
      const defaultList = Object.values(COUNTRY_DESTINATIONS).map((d) => ({
        id: d.slug,
        name: d.name,
        slug: d.slug,
        code: d.code,
        flag: d.flag,
        capital: d.capital,
        currency: d.currency,
        visaType: d.visaType,
        tuitionRange: d.tuitionRange,
        livingCost: d.livingCost,
        workRights: d.workRights,
        status: 'active',
        lastVerifiedAt: d.lastVerifiedAt,
      }));
      return NextResponse.json({ success: true, countries: defaultList });
    }

    return NextResponse.json({ success: true, countries });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const primaryRole = auth.roles[0] || auth.userType || '';
    if (primaryRole !== 'SUPER_ADMIN' && primaryRole !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, code, flag, capital, currency, heroTitle, heroSubtitle, overview, whyStudySummary, visaType, tuitionRange, livingCost, workRights, seoTitle, seoDescription } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: 'Name and slug are required' }, { status: 400 });
    }

    const country = await db.country.upsert({
      where: { slug: slug.toLowerCase().trim() },
      update: {
        name,
        code: code || '',
        countryCode: code || '',
        flag: flag || '🌐',
        capital: capital || '',
        currency: currency || '',
        heroTitle: heroTitle || '',
        heroSubtitle: heroSubtitle || '',
        overview: overview || '',
        whyStudySummary: whyStudySummary || '',
        visaType: visaType || '',
        tuitionRange: tuitionRange || '',
        livingCost: livingCost || '',
        workRights: workRights || '',
        seoTitle: seoTitle || '',
        seoDescription: seoDescription || '',
        lastVerifiedAt: new Date(),
      },
      create: {
        name,
        slug: slug.toLowerCase().trim(),
        code: code || '',
        countryCode: code || '',
        flag: flag || '🌐',
        capital: capital || '',
        currency: currency || '',
        heroTitle: heroTitle || '',
        heroSubtitle: heroSubtitle || '',
        overview: overview || '',
        whyStudySummary: whyStudySummary || '',
        visaType: visaType || '',
        tuitionRange: tuitionRange || '',
        livingCost: livingCost || '',
        workRights: workRights || '',
        seoTitle: seoTitle || '',
        seoDescription: seoDescription || '',
        lastVerifiedAt: new Date(),
      },
    });

    await logAuditAction(auth, 'SAVE_COUNTRY_DESTINATION', 'Country', country.id, { name, slug });

    return NextResponse.json({
      success: true,
      message: `Country ${name} saved successfully.`,
      country,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
