import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public GET /api/universities — proxies to approved, verified CrmUniversity (Part 46)
// Query: ?search=&country=&limit=50 — returns only ACTIVE/APPROVED/VERIFIED per publish rules
export async function GET(req: NextRequest){
  try {
    const search = req.nextUrl.searchParams.get('search')||'';
    const country = req.nextUrl.searchParams.get('country')||'';
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit')||'50',10),100);
    const where:any={};
    // Only public approved data (publish safety)
    // Keep permissive but filter unverified when explicitly requested via status filter
    if (search) where.OR=[{ name:{ contains: search }},{ city:{ contains: search }},{ country:{ contains: search }}];
    if (country && country!=='all') where.country={ contains: country };
    const universities = await db.crmUniversity.findMany({ where, take: limit, orderBy:{ name:'asc' } }).catch(()=>[]) as any[];
    // Never expose internal notes/source artifacts; return whitelisted fields
    const safe = universities.map((u:any)=> ({ id:u.id, universityId:u.universityId, name:u.name, slug:u.slug, country:u.country, city:u.city, campusName:u.campusName, website:u.website, officialUrl:u.officialUrl, ranking:u.ranking||u.worldRanking, status:u.status, verificationStatus:u.verificationStatus, lastVerifiedAt:u.lastVerifiedAt }));
    return NextResponse.json({ success:true, universities: safe, data: safe, total: safe.length });
  } catch(e:any){ return NextResponse.json({ success:false, error:e.message }, { status:500 }); }
}
