import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  In-memory cache (60-second TTL)                                    */
/* ------------------------------------------------------------------ */

const cache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const CACHE_TTL = 60000;

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: Record<string, unknown>) {
  cache.set(key, { data, timestamp: Date.now() });
}

/* ------------------------------------------------------------------ */
/*  Parse tuition string to number for max comparison                  */
/* ------------------------------------------------------------------ */

function parseTuition(tuition: string): number | null {
  if (!tuition) return null;
  // Extract first number from tuition string (e.g., "£15,000/year" → 15000)
  const match = tuition.replace(/[^0-9.]/g, '').match(/^([0-9]+(?:\.[0-9]+)?)/);
  return match ? parseFloat(match[1]) : null;
}

/* ------------------------------------------------------------------ */
/*  POST — Search courses with filters                                   */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      country,
      universitySlug,
      level,
      subject,
      intake,
      tuitionMax,
      scholarshipOnly,
      search,
      page = 1,
      limit = 20,
    } = body;

    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));

    // Build where clause
    const where: Record<string, unknown> = { approvalStatus: 'PUBLISHED' };

    if (typeof country === 'string' && country.trim()) {
      where.countrySlug = country.trim();
    }
    if (typeof universitySlug === 'string' && universitySlug.trim()) {
      where.universitySlug = universitySlug.trim();
    }
    if (typeof level === 'string' && level.trim()) {
      where.level = level.trim();
    }
    if (typeof subject === 'string' && subject.trim()) {
      where.subject = { contains: subject.trim() };
    }
    if (typeof intake === 'string' && intake.trim()) {
      where.intake = { contains: intake.trim() };
    }
    if (scholarshipOnly === true) {
      where.scholarshipAvailable = true;
    }
    if (typeof search === 'string' && search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { subject: { contains: search.trim() } },
        { discipline: { contains: search.trim() } },
        { university: { name: { contains: search.trim() } } },
      ];
    }

    // If tuitionMax is set, we need to fetch and filter manually
    // since tuition is stored as a string
    const hasTuitionMax = typeof tuitionMax === 'number' && tuitionMax > 0;

    // Cache key based on all filter params
    const cacheKey = `course-search:${JSON.stringify({ country, universitySlug, level, subject, intake, tuitionMax, scholarshipOnly, search, page: p, limit: l })}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch courses with university relation
    const [coursesRaw, totalRaw] = await Promise.all([
      db.coursePage.findMany({
        where,
        include: {
          university: {
            select: {
              name: true,
              slug: true,
              city: true,
              ranking: true,
              logo: true,
            },
          },
        },
        orderBy: { matchScore: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      db.coursePage.count({ where }),
    ]);

    // Apply tuitionMax filter in-memory if needed
    let courses = coursesRaw;
    let total = totalRaw;

    if (hasTuitionMax) {
      courses = coursesRaw.filter((c) => {
        const t = parseTuition(c.tuition);
        return t !== null && t <= tuitionMax;
      });
      // For accurate total with tuition filter, count from DB
      // Since we can't easily do this in SQL for string fields, we approximate
      total = courses.length;
    }

    // Fetch filter options (distinct values) for sidebar
    const [countries, levels, subjects, intakes] = await Promise.all([
      db.coursePage.findMany({
        where: { approvalStatus: 'PUBLISHED' },
        select: { countrySlug: true },
        distinct: ['countrySlug'],
      }),
      db.coursePage.findMany({
        where: { approvalStatus: 'PUBLISHED' },
        select: { level: true },
        distinct: ['level'],
      }),
      db.coursePage.findMany({
        where: { approvalStatus: 'PUBLISHED' },
        select: { subject: true },
        distinct: ['subject'],
      }),
      db.coursePage.findMany({
        where: { approvalStatus: 'PUBLISHED' },
        select: { intake: true },
        distinct: ['intake'],
      }),
    ]);

    const result = {
      courses,
      total,
      page: p,
      limit: l,
      filters: {
        countries: countries.map((c) => c.countrySlug).filter(Boolean).sort(),
        levels: levels.map((c) => c.level).filter(Boolean).sort(),
        subjects: subjects.map((c) => c.subject).filter(Boolean).sort(),
        intakes: intakes
          .flatMap((c) => (c.intake ? c.intake.split(',').map((s: string) => s.trim()) : []))
          .filter(Boolean)
          .sort()
          .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i),
      },
    };

    setCache(cacheKey, result as unknown as Record<string, unknown>);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching courses:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
