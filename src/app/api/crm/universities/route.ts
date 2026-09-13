import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    const isAuthorized = auth.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'COUNSELOR', 'super_admin', 'admin', 'staff', 'counselor'].includes(r));
    if (!isAuthorized) return NextResponse.json({ success:false, error:'Staff required' }, { status:403 });
    const search = req.nextUrl.searchParams.get('search') || '';
    const country = req.nextUrl.searchParams.get('country') || '';
    const where: any = {};
    if (search) where.OR = [{ name: { contains: search } }, { universityId: { contains: search } }, { city: { contains: search } }];
    if (country && country !== 'all') where.country = { contains: country };
    const universities = await db.crmUniversity.findMany({ where, take: 100, orderBy: { name: 'asc' }, include: { _count: { select: { courses: true } } } });
    const enriched = universities.map((u:any)=> ({
      ...u,
      dataQuality: u.sourceUrl ? 'Good' : 'Missing source warning',
      verificationWarning: u.verificationStatus === 'NEEDS_REVIEW' ? 'Verification warning' : null,
      duplicateWarning: null,
      expiredWarning: u.lastVerifiedAt && (Date.now() - new Date(u.lastVerifiedAt).getTime())/(1000*60*60*24) > 180 ? 'Expired data warning' : null,
    }));
    return NextResponse.json({ success:true, universities: enriched, data: enriched, total: enriched.length });
  })(request);
}
