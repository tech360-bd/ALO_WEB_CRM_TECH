import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

function cleanText(value: unknown, maxLength = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function safeHttpsUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function slugify(value: string): string {
  return value.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

function generatedUniversityId(name: string, country: string): string {
  const prefix = slugify(`${name}-${country}`).replace(/-/g, '').slice(0, 18).toUpperCase() || 'UNIVERSITY';
  return `UNI-${prefix}-${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

// POST /api/admin/universities/create — creates a private research record.
// The server owns IDs and creates drafts only; fact verification and publication
// are separate, auditable human-controlled transitions.
export async function POST(request: NextRequest) {
  return withAuth(async (_req, auth) => {
    const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toUpperCase()));
    if (!roles.has('SUPER_ADMIN') && !roles.has('ADMIN')) {
      return NextResponse.json({ success: false, error: 'Admin access is required.' }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      const parsed = await request.json();
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid body');
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false, error: 'A valid JSON university record is required.' }, { status: 400 });
    }

    const name = cleanText(body.name, 180);
    const country = cleanText(body.country, 120);
    const city = cleanText(body.city, 120);
    const website = safeHttpsUrl(body.website);
    const sourceUrl = safeHttpsUrl(body.sourceUrl || body.officialUrl || body.website);
    const description = cleanText(body.description || body.overview, 5000);
    if (!name || !country) return NextResponse.json({ success: false, error: 'University name and country are required.' }, { status: 400 });
    if ((body.website && !website) || (body.sourceUrl && !safeHttpsUrl(body.sourceUrl)) || (body.officialUrl && !safeHttpsUrl(body.officialUrl))) {
      return NextResponse.json({ success: false, error: 'University and source links must be valid HTTPS URLs.' }, { status: 400 });
    }
    if (description.length > 5000) return NextResponse.json({ success: false, error: 'Overview must be 5,000 characters or fewer.' }, { status: 400 });

    const normalizedName = name.replace(/\s+/g, ' ');
    const normalizedCountry = country.replace(/\s+/g, ' ');
    const possibleDuplicate = await db.crmUniversity.findFirst({
      where: { name: { equals: normalizedName }, country: { equals: normalizedCountry } },
      select: { id: true, universityId: true, name: true, country: true, slug: true },
    });
    if (possibleDuplicate) {
      return NextResponse.json({
        success: false,
        duplicateDetected: true,
        error: 'A university with this name and country already exists. Review the existing record instead of creating a duplicate.',
        existingUniversity: possibleDuplicate,
      }, { status: 409 });
    }

    const slug = slugify(cleanText(body.slug, 180) || `${normalizedName}-${normalizedCountry}`);
    if (!slug) return NextResponse.json({ success: false, error: 'A stable university page slug could not be generated.' }, { status: 400 });
    const slugCollision = await db.crmUniversity.findFirst({ where: { slug }, select: { id: true, universityId: true, name: true, country: true } });
    if (slugCollision) {
      return NextResponse.json({ success: false, duplicateDetected: true, error: 'That public slug is already assigned. Review the existing university record.', existingUniversity: slugCollision }, { status: 409 });
    }

    const universityId = generatedUniversityId(normalizedName, normalizedCountry);
    const rawRanking = body.ranking ?? body.worldRanking;
    const ranking = rawRanking === '' || rawRanking === null || rawRanking === undefined ? 0 : Number(rawRanking);
    const foundedRaw = body.founded;
    const founded = foundedRaw === '' || foundedRaw === null || foundedRaw === undefined ? 0 : Number(foundedRaw);
    if (!Number.isFinite(ranking) || ranking < 0 || !Number.isInteger(founded) || founded < 0 || (founded > 0 && founded > new Date().getFullYear())) {
      return NextResponse.json({ success: false, error: 'Ranking and founded year must be valid non-negative values.' }, { status: 400 });
    }
    const campuses = Array.isArray(body.campuses) ? body.campuses.map((item) => cleanText(item, 120)).filter(Boolean).slice(0, 30) : [];
      const lastVerifiedAt = '';

    try {
      const result = await db.$transaction(async (tx) => {
        const university = await tx.crmUniversity.create({
          data: {
            universityId,
            universityCode: universityId,
            name: normalizedName,
            slug,
            country: normalizedCountry,
            city,
            campusName: cleanText(body.campusName, 160),
            campuses: JSON.stringify(campuses),
            website,
            officialUrl: safeHttpsUrl(body.officialUrl) || website,
            officialInternationalAdmissionsUrl: safeHttpsUrl(body.officialInternationalAdmissionsUrl),
            officialCourseSearchUrl: safeHttpsUrl(body.officialCourseSearchUrl),
            officialTuitionFeeUrl: safeHttpsUrl(body.officialTuitionFeeUrl),
            officialScholarshipUrl: safeHttpsUrl(body.officialScholarshipUrl),
            sourceUrl,
            ranking: Math.round(ranking),
            worldRanking: Math.round(ranking),
            rankingSourceUrl: safeHttpsUrl(body.rankingSourceUrl),
            rankingYear: Number.isInteger(Number(body.rankingYear)) ? Number(body.rankingYear) : 0,
            rankingValue: cleanText(body.rankingValue, 80),
            rankingBand: cleanText(body.rankingBand, 80),
            type: cleanText(body.type, 80),
            founded,
            students: cleanText(body.students, 80),
            intlStudents: cleanText(body.intlStudents, 80),
            ieltsMin: Number.isFinite(Number(body.ieltsMin)) && Number(body.ieltsMin) > 0 ? Number(body.ieltsMin) : 0,
            tuitionRange: cleanText(body.tuitionRange, 160),
            scholarships: body.scholarships === true,
            description,
            overview: description,
            verificationStatus: 'RESEARCH_REQUIRED',
            publicationStatus: 'draft',
            lastVerifiedAt,
            status: 'inactive',
          },
        });
        await tx.crmAuditLog.create({
          data: {
            actorUserId: auth.userId,
            actorRole: auth.roles[0] || auth.userType,
            action: 'CREATE_UNIVERSITY_RESEARCH_DRAFT',
            targetCollection: 'CrmUniversity',
            targetId: university.id,
            afterData: JSON.stringify({ name: normalizedName, country: normalizedCountry, universityId, slug, sourceUrl }),
          },
        });
        return university;
      });

      return NextResponse.json({
        success: true,
        data: result,
        university: result,
        message: 'University research draft created. The generated ID is stable; verification and publication are still required.',
      }, { status: 201 });
    } catch (error) {
      console.error('[admin.universities.create] record creation failed', error instanceof Error ? error.message : 'unknown');
      return NextResponse.json({ success: false, error: 'University record could not be created.' }, { status: 503 });
    }
  })(request);
}

export async function GET(request: NextRequest) {
  return withAuth(async (_req, auth) => {
    const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toUpperCase()));
    if (!roles.has('SUPER_ADMIN') && !roles.has('ADMIN')) return NextResponse.json({ success: false, error: 'Admin access is required.' }, { status: 403 });
    return NextResponse.json({ success: true, message: 'POST creates an inactive research draft. IDs are assigned by the server; verification and publication require separate review.' });
  })(request);
}
