import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, parsePagination } from '@/lib/access-control';

const SEARCHABLE_TYPES = ['students', 'leads', 'applications', 'universities', 'courses'] as const;

type SearchableType = (typeof SEARCHABLE_TYPES)[number];

// ─── GET: Global search ─────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const sp = req.nextUrl.searchParams;
    const q = (sp.get('q') || '').trim();
    const type = sp.get('type') as SearchableType | null;
    const { page, limit, skip } = parsePagination(sp, 10);

    if (!q) {
      return NextResponse.json({ success: false, error: 'Search query (q) is required.' }, { status: 400 });
    }

    const types: SearchableType[] = type ? [type] : SEARCHABLE_TYPES;
    const results: Array<{ type: SearchableType; results: unknown[]; total: number }> = [];

    for (const t of types) {
      switch (t) {
        case 'students': {
          const where: Record<string, unknown> = {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' as const } },
              { email: { contains: q, mode: 'insensitive' as const } },
              { studentId: { contains: q, mode: 'insensitive' as const } },
            ],
          };
          // Students see only own
          if (auth.user.role === 'STUDENT') {
            (where.OR as Array<Record<string, unknown>>).push({ id: auth.user.id });
          }
          const [data, total] = await Promise.all([
            db.student.findMany({ where, take: limit, skip }),
            db.student.count({ where }),
          ]);
          results.push({ type: 'students', results: data, total });
          break;
        }

        case 'leads': {
          if (auth.user.role === 'STUDENT') break; // Students don't see leads
          const where = {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' as const } },
              { email: { contains: q, mode: 'insensitive' as const } },
              { phone: { contains: q, mode: 'insensitive' as const } },
              { leadId: { contains: q, mode: 'insensitive' as const } },
            ],
          };
          const [data, total] = await Promise.all([
            db.lead.findMany({ where, take: limit, skip }),
            db.lead.count({ where }),
          ]);
          results.push({ type: 'leads', results: data, total });
          break;
        }

        case 'applications': {
          const where: Record<string, unknown> = {
            OR: [
              { applicationId: { contains: q, mode: 'insensitive' as const } },
              { university: { contains: q, mode: 'insensitive' as const } },
              { course: { contains: q, mode: 'insensitive' as const } },
              { country: { contains: q, mode: 'insensitive' as const } },
            ],
          };
          if (auth.user.role === 'STUDENT') {
            const student = await db.student.findFirst({ where: { email: auth.user.email } });
            if (student) where.studentId = student.id;
          }
          const [data, total] = await Promise.all([
            db.application.findMany({ where, take: limit, skip }),
            db.application.count({ where }),
          ]);
          results.push({ type: 'applications', results: data, total });
          break;
        }

        case 'universities': {
          const where = {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { slug: { contains: q, mode: 'insensitive' as const } },
              { city: { contains: q, mode: 'insensitive' as const } },
            ],
          };
          const [data, total] = await Promise.all([
            db.universityPage.findMany({ where, take: limit, skip, select: { slug: true, name: true, city: true, countrySlug: true, logo: true } }),
            db.universityPage.count({ where }),
          ]);
          results.push({ type: 'universities', results: data, total });
          break;
        }

        case 'courses': {
          const where = {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { subject: { contains: q, mode: 'insensitive' as const } },
              { level: { contains: q, mode: 'insensitive' as const } },
            ],
          };
          const [data, total] = await Promise.all([
            db.coursePage.findMany({ where, take: limit, skip, select: { slug: true, name: true, level: true, subject: true, universitySlug: true, countrySlug: true } }),
            db.coursePage.count({ where }),
          ]);
          results.push({ type: 'courses', results: data, total });
          break;
        }
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Error in global search:', error);
    return NextResponse.json({ success: false, error: 'Search failed.' }, { status: 500 });
  }
}
