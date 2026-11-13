import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMonitoringViewer } from '@/lib/university-monitoring-auth';
import { publicCourseWhere, publicUniversityWhere, publicIntakeWhere, publicCrmScholarshipWhere } from '@/lib/public-catalog';
import { parseIntakePeriodToken } from '@/lib/course-finder/intake-window';

/** Knowledge Center reads the same approved public catalogue as Course Finder. */
export async function GET(req: NextRequest) {
  const guard = await requireMonitoringViewer(req);
  if (!guard.ok) return guard.response;
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  const limitRaw = req.nextUrl.searchParams.get('limit') || '20';
  if (q.length < 2 || q.length > 500) return NextResponse.json({ error: 'Query must contain 2–500 characters' }, { status: 400 });
  if (!/^\d+$/.test(limitRaw) || Number(limitRaw) < 1 || Number(limitRaw) > 50) return NextResponse.json({ error: 'limit must be an integer from 1 to 50' }, { status: 400 });
  const limit = Number(limitRaw);
  const periodText = q.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+20\d{2}\b/i)?.[0];
  const period = periodText ? parseIntakePeriodToken(periodText) : null;
  const terms = q.replace(periodText || /$^/, '').replace(/\b(which|universities|university|courses|course|offer|offers|have|has|the|in|for|intake|tuition|application|documents|requirements|what|is|are)\b/gi, ' ').replace(/[?.,:;!]/g, ' ').replace(/\s+/g, ' ').trim();
  const programme = /\bmres\b|master of research/i.test(q) ? ['MRes', 'Master of Research']
    : /top[ -]?up|final.year.entry/i.test(q) ? ['top-up', 'top up', 'final-year entry'] : null;
  const courseText = programme || (terms ? [terms] : []);
  const country = /\bUK\b/i.test(q) ? 'United Kingdom' : /\bCanada\b/i.test(q) ? 'Canada' : null;
  const courseWhere = { AND: [publicCourseWhere(), ...(country ? [{ country }] : []), ...(courseText.length ? [{ OR: courseText.flatMap((term) => [{ courseTitle: { contains: term } }, { subjectArea: { contains: term } }, { qualification: { contains: term } }, { description: { contains: term } }]) }] : []),
        ...(period ? [{ intakeFees: { some: { ...publicIntakeWhere(), intakeYear: period.year, OR: [{ intakeMonth: String(period.month) }, { intakeMonth: String(period.month).padStart(2, '0') }, { intakeMonth: new Date(Date.UTC(2027, period.month - 1, 1)).toLocaleString('en', { month: 'long', timeZone: 'UTC' }) }, { intakeMonth: new Date(Date.UTC(2027, period.month - 1, 1)).toLocaleString('en', { month: 'short', timeZone: 'UTC' }) }] } } }] : []),
      ] };
  try {
    const [universities, courses, scholarships] = await Promise.all([
      db.crmUniversity.findMany({ where: { AND: [publicUniversityWhere(), ...(country ? [{ country }] : []), ...((period || programme) ? [{ courses: { some: courseWhere } }] : []), ...(terms && !period && !programme ? [{ OR: [{ name: { contains: terms } }, { overview: { contains: terms } }, { country: { contains: terms } }] }] : [])] }, take: limit,
        select: { universityId: true, slug: true, name: true, country: true, city: true, overview: true, sourceUrl: true, officialUrl: true, lastVerifiedAt: true } }),
      db.crmCourse.findMany({ where: courseWhere, take: limit, select: { courseId: true, slug: true, courseTitle: true, studyLevel: true, qualification: true, subjectArea: true, country: true, durationMonths: true, tuitionFee: true, currency: true, deadline: true, sourceUrl: true, officialUrl: true, lastVerifiedAt: true, university: { select: { name: true, slug: true } }, intakeFees: { where: publicIntakeWhere(), select: { intakeMonth: true, intakeYear: true, applicationDeadline: true, yearlyTuition: true, tuitionCurrency: true } } } }),
      db.crmScholarship.findMany({ where: { AND: [publicCrmScholarshipWhere(), { university: { is: publicUniversityWhere() } }, ...(terms ? [{ scholarshipName: { contains: terms } }] : [])] }, take: limit,
        select: { id: true, scholarshipName: true, scholarshipAmount: true, scholarshipCurrency: true, deadline: true, officialScholarshipUrl: true, lastCheckedAt: true, university: { select: { name: true, slug: true } } } }),
    ]);
    return NextResponse.json({ query: q, results: { universities: universities.length, courses: courses.length, scholarships: scholarships.length, countries: 0, exams: 0, total: universities.length + courses.length + scholarships.length }, universities, courses, scholarships, countries: [], exams: [],
      safetyNotice: 'Results use the same published, verified, source-linked catalogue rules as Course Finder. Detected changes and crawler candidates are excluded. Missing results are not evidence that a programme does not exist.' });
  } catch {
    return NextResponse.json({ success: false, error: 'Approved catalogue search is temporarily unavailable.' }, { status: 503 });
  }
}
