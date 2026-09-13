import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    const isAuthorized = auth.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'COUNSELOR', 'super_admin', 'admin', 'staff', 'counselor'].includes(r));
    if (!isAuthorized) return NextResponse.json({ success:false, error:'Staff required' }, { status:403 });
    const search = req.nextUrl.searchParams.get('search') || '';
    const where: any = {};
    if (search) where.OR = [{ courseTitle: { contains: search } }, { courseId: { contains: search } }, { subjectArea: { contains: search } }];
    const courses = await db.crmCourse.findMany({ where, take: 100, orderBy: { courseTitle: 'asc' }, include: { university: { select: { name: true, country: true } }, intakeFees: { take:1 }, requirements: { take:1 } } });
    const enriched = courses.map((c:any)=> ({
      ...c,
      dataQuality: c.sourceUrl ? 'Good' : 'Missing source warning',
      verificationWarning: c.verificationStatus === 'NEEDS_REVIEW' ? 'Verification warning' : null,
      duplicateWarning: null,
      expiredWarning: c.lastVerifiedAt && (Date.now() - new Date(c.lastVerifiedAt).getTime())/(1000*60*60*24) > 180 ? 'Expired data warning' : null,
    }));
    return NextResponse.json({ success:true, courses: enriched, data: enriched, total: enriched.length });
  })(request);
}
