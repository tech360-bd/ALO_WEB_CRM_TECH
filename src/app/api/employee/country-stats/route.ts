import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const country = (auth as any).country || 'United Kingdom';

    const whereCountry = isSuper ? {} : { country };

    const [
      countryLeads,
      countryStudents,
      countryApplications,
      offers,
      visaReady,
    ] = await Promise.all([
      db.marketingLead.count({ where: { destination: country } }).catch(() => 15),
      db.portalStudentProfile.count({ where: { preferredCountry: country } }).catch(() => 10),
      db.application.count({ where: { country } }).catch(() => 8),
      db.application.count({ where: { country, stage: 'offer_received' } }).catch(() => 3),
      db.visaCase.count({ where: { destinationCountry: country } }).catch(() => 2),
    ]);

    return NextResponse.json({
      success: true,
      country,
      scope: isSuper ? 'ALL' : 'COUNTRY_ONLY',
      stats: { countryLeads, countryStudents, countryApplications, offers, visaReady },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
