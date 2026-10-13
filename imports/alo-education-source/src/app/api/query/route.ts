import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/access-control';
import { Prisma } from '@prisma/client';

// ─── Validation ─────────────────────────────────────────────

const queryBodySchema = z.object({
  entity: z.enum(['students', 'leads', 'applications', 'universities', 'courses']),
  search: z.string().optional(),
  filters: z.record(z.unknown()).optional(),
  sort: z.object({ field: z.string(), direction: z.enum(['asc', 'desc']) }).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

type QueryBody = z.infer<typeof queryBodySchema>;

// ─── Helpers ────────────────────────────────────────────────

function buildSearchCondition(search: string, fields: string[]): Prisma.StringFilter {
  const terms = search.trim().split(/\s+/);
  if (terms.length === 1) {
    return { contains: terms[0], mode: 'insensitive' };
  }
  // Multi-word: match any term in any field
  // Prisma doesn't support OR at field-level easily, so use first term as contains
  return { contains: search.trim(), mode: 'insensitive' };
}

function buildStudentWhere(body: QueryBody): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = {};

  if (body.search) {
    where.OR = [
      { fullName: { contains: body.search, mode: 'insensitive' } },
      { email: { contains: body.search, mode: 'insensitive' } },
      { mobile: { contains: body.search } },
    ];
  }

  const f = body.filters;
  if (f) {
    if (f.status) where.status = f.status as string;
    if (f.studyDestination) where.studyDestination = { contains: f.studyDestination as string, mode: 'insensitive' };
    if (f.studyLevel) where.studyLevel = { contains: f.studyLevel as string, mode: 'insensitive' };
    if (f.intake) where.intake = { contains: f.intake as string, mode: 'insensitive' };
    if (f.nationality) where.nationality = f.nationality as string;
  }

  return where;
}

function buildLeadWhere(body: QueryBody): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};

  if (body.search) {
    where.OR = [
      { fullName: { contains: body.search, mode: 'insensitive' } },
      { email: { contains: body.search, mode: 'insensitive' } },
      { phone: { contains: body.search } },
    ];
  }

  const f = body.filters;
  if (f) {
    if (f.status) where.status = f.status as string;
    if (f.source) where.source = f.source as string;
    if (f.preferredCountry) where.preferredCountry = { contains: f.preferredCountry as string, mode: 'insensitive' };
  }

  return where;
}

function buildApplicationWhere(body: QueryBody): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = {};

  if (body.search) {
    where.OR = [
      { applicationId: { contains: body.search, mode: 'insensitive' } },
      { university: { contains: body.search, mode: 'insensitive' } },
      { course: { contains: body.search, mode: 'insensitive' } },
    ];
  }

  const f = body.filters;
  if (f) {
    if (f.stage) where.stage = f.stage as string;
    if (f.country) where.country = { contains: f.country as string, mode: 'insensitive' };
    if (f.intake) where.intake = { contains: f.intake as string, mode: 'insensitive' };
    if (f.studyLevel) where.studyLevel = { contains: f.studyLevel as string, mode: 'insensitive' };
    if (f.priority) where.priority = f.priority as string;
  }

  return where;
}

function buildUniversityWhere(body: QueryBody): Prisma.UniversityPageWhereInput {
  const where: Prisma.UniversityPageWhereInput = {};

  if (body.search) {
    where.OR = [
      { name: { contains: body.search, mode: 'insensitive' } },
      { city: { contains: body.search, mode: 'insensitive' } },
    ];
  }

  const f = body.filters;
  if (f) {
    if (f.countrySlug) where.countrySlug = f.countrySlug as string;
    if (f.status) where.approvalStatus = f.status as string;
    if (f.scholarshipAvailable === true) where.scholarshipAvailable = true;
  }

  return where;
}

function buildCourseWhere(body: QueryBody): Prisma.CoursePageWhereInput {
  const where: Prisma.CoursePageWhereInput = {};

  if (body.search) {
    where.OR = [
      { name: { contains: body.search, mode: 'insensitive' } },
      { subject: { contains: body.search, mode: 'insensitive' } },
    ];
  }

  const f = body.filters;
  if (f) {
    if (f.countrySlug) where.countrySlug = f.countrySlug as string;
    if (f.universitySlug) where.universitySlug = f.universitySlug as string;
    if (f.level) where.level = f.level as string;
    if (f.subject) where.subject = { contains: f.subject as string, mode: 'insensitive' };
  }

  return where;
}

// ─── Route Handler ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  // Parse & validate
  let body: QueryBody;
  try {
    const raw = await req.json();
    body = queryBodySchema.parse(raw);
  } catch (e: unknown) {
    const msg = e instanceof z.ZodError ? e.errors.map((err) => err.message).join(', ') : 'Invalid request body';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }

  const page = body.page ?? 1;
  const pageSize = body.pageSize ?? 25;
  const skip = (page - 1) * pageSize;

  // Build sort
  const sortField = body.sort?.field ?? 'createdAt';
  const sortDir = body.sort?.direction ?? 'desc';
  const orderBy: Record<string, string> = { [sortField]: sortDir };

  try {
    let data: unknown[];
    let total: number;

    switch (body.entity) {
      case 'students': {
        const where = buildStudentWhere(body);
        [data, total] = await Promise.all([
          db.student.findMany({ where, orderBy, skip, take: pageSize }),
          db.student.count({ where }),
        ]);
        break;
      }

      case 'leads': {
        const where = buildLeadWhere(body);
        [data, total] = await Promise.all([
          db.lead.findMany({ where, orderBy, skip, take: pageSize }),
          db.lead.count({ where }),
        ]);
        break;
      }

      case 'applications': {
        const where = buildApplicationWhere(body);
        [data, total] = await Promise.all([
          db.application.findMany({ where, orderBy, skip, take: pageSize }),
          db.application.count({ where }),
        ]);
        break;
      }

      case 'universities': {
        const where = buildUniversityWhere(body);
        [data, total] = await Promise.all([
          db.universityPage.findMany({ where, orderBy, skip, take: pageSize }),
          db.universityPage.count({ where }),
        ]);
        break;
      }

      case 'courses': {
        const where = buildCourseWhere(body);
        [data, total] = await Promise.all([
          db.coursePage.findMany({ where, orderBy, skip, take: pageSize }),
          db.coursePage.count({ where }),
        ]);
        break;
      }

      default: {
        return NextResponse.json({ success: false, error: `Unknown entity: ${body.entity}` }, { status: 400 });
      }
    }

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data,
      meta: { page, pageSize, total, totalPages },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Query failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
