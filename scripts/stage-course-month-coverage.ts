import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { officialCourseStagingSchema, type OfficialCourseStagingDataset } from '../src/lib/course-month-coverage-schema';

const DEFAULT_FILE = 'data/official-source-audit/aston-ai-msc-2027-monthly-staging.json';
const fileArg = process.argv.find((arg) => arg.startsWith('--file='));
const inputFile = fileArg?.slice('--file='.length) || DEFAULT_FILE;
const stage = process.argv.includes('--stage');
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const canonicalUrl = (value: string) => {
  const url = new URL(value);
  url.hash = '';
  url.search = '';
  url.pathname = url.pathname.replace(/\/$/, '');
  return url.toString();
};
const domainMatches = (hostname: string, domain: string) => hostname === domain || hostname.endsWith(`.${domain}`);

async function readValidatedDataset(): Promise<OfficialCourseStagingDataset> {
  const raw = await readFile(inputFile, 'utf8');
  const parsed = officialCourseStagingSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error(`Staging dataset failed validation:\n${parsed.error.issues.map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n')}`);
  }
  return parsed.data;
}

async function stageDataset(dataset: OfficialCourseStagingDataset) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured in this process; no database writes were attempted.');
  }

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const universityCandidates = await prisma.crmUniversity.findMany({ where: { name: dataset.institution.name } });
    const universities = universityCandidates.filter((university) => {
      for (const candidate of [university.website, university.officialUrl]) {
        try {
          if (domainMatches(new URL(candidate).hostname, dataset.institution.officialDomain)) return true;
        } catch { /* ignore incomplete legacy URLs */ }
      }
      return false;
    });
    if (universities.length !== 1) {
      throw new Error(`Expected exactly one existing CRM university matching ${dataset.institution.name} and ${dataset.institution.officialDomain}; found ${universities.length}. No university/course will be created or changed.`);
    }
    const university = universities[0];

    const titleCandidates = await prisma.crmCourse.findMany({ where: { universityId: university.universityId, courseTitle: dataset.course.officialTitle } });
    const sourcePath = new URL(dataset.course.officialCourseUrl).pathname.replace(/\/(january|february|march|april|may|june|july|august|september|october|november|december)-20\d\d$/i, '');
    const courseCandidates = titleCandidates.filter((course) => {
      const urls = [course.officialUrl, course.sourceUrl].filter(Boolean);
      return urls.some((value) => {
        try {
          const url = new URL(value);
          return url.protocol === 'https:' && domainMatches(url.hostname, dataset.institution.officialDomain) && url.pathname.replace(/\/$/, '') === sourcePath;
        } catch { return false; }
      });
    });
    if (courseCandidates.length !== 1) {
      throw new Error(`Expected exactly one pre-existing CRM course matching the exact title and canonical official course URL; found ${courseCandidates.length}. No course will be created, guessed or merged automatically.`);
    }
    const course = courseCandidates[0];
    const sources = dataset.course.sources;
    const sharedFacts = {
      qualification: dataset.course.qualification,
      campus: dataset.course.campus,
      studyMode: dataset.course.studyMode,
      academicRequirements: dataset.course.academicRequirements,
      bangladeshRequirements: dataset.course.bangladeshAcademicRequirements,
      englishRequirements: JSON.stringify(dataset.course.englishRequirements),
      additionalRequirements: JSON.stringify({
        ...dataset.course.additionalRequirements,
        publishedFeeEvidenceNotAssignedTo2027Or2028: dataset.course.publishedFeeEvidence,
      }),
      internationalEligibility: dataset.course.internationalEligibility,
      sourceUrls: JSON.stringify(sources.map((source) => source.url)),
      sourcePublishedAt: dataset.course.sourcePublishedAt ? new Date(dataset.course.sourcePublishedAt) : null,
      collectedAt: new Date(dataset.collectedAt),
      lastVerifiedAt: new Date(dataset.course.lastVerifiedAt),
      confidence: dataset.course.confidence,
      evidenceText: JSON.stringify({ institutionScope: dataset.institution, course: dataset.course, sources }),
    };

    let created = 0;
    let restaged = 0;
    let unchanged = 0;
    let officialSourcesRegistered = 0;

    await prisma.$transaction(async (tx) => {
      for (const source of sources) {
        const section = source.type.toLowerCase().replaceAll('_', '-');
        const fingerprint = hash(`${canonicalUrl(source.url)}|COURSE|${course.courseId}|${section}`);
        const sourceName = `${university.name} — ${source.type.replaceAll('_', ' ')}`;
        const dataSection = section.slice(0, 191);
        const registered = await tx.officialSource.upsert({
          where: { sourceFingerprint: fingerprint },
          update: {},
          create: {
            sourceUrl: source.url,
            sourceFingerprint: fingerprint,
            sourceType: 'official_university',
            sourceTitle: sourceName,
            targetType: 'course',
            targetId: course.courseId,
            targetSlug: course.slug,
            dataSection,
            contentHash: '',
            verificationStatus: 'pending',
            entityType: 'COURSE',
            universitySlug: university.slug || null,
            courseSlug: course.slug || null,
            sourceName,
            category: source.type.includes('SCHOLARSHIP') ? 'SCHOLARSHIPS' : source.type.includes('ENGLISH') || source.type.includes('BANGLADESH') ? 'REQUIREMENTS' : 'CATALOGUE',
            priority: 1,
            monitoringEnabled: true,
            checkFrequencyDays: 7,
            status: 'ACTIVE',
          },
        });
        if (registered) officialSourcesRegistered += 1;
      }

      for (const month of dataset.course.months) {
        const input = {
          ...sharedFacts,
          calendarMonth: month.calendarMonth,
          availabilityStatus: month.availabilityStatus,
          startDate: month.startDate ? new Date(`${month.startDate}T00:00:00.000Z`) : null,
          applicationOpenDate: month.applicationOpenDate ? new Date(`${month.applicationOpenDate}T00:00:00.000Z`) : null,
          applicationCloseDate: month.applicationCloseDate ? new Date(`${month.applicationCloseDate}T00:00:00.000Z`) : null,
          internationalDeadline: month.internationalDeadline ? new Date(`${month.internationalDeadline}T00:00:00.000Z`) : null,
          tuitionAmount: month.tuitionAmount ?? null,
          tuitionCurrency: month.tuitionCurrency || '',
          feeAcademicYear: month.feeAcademicYear || '',
          feePeriod: month.feePeriod || '',
          feeStudentCategory: month.feeStudentCategory || '',
          applicationFeeAmount: month.applicationFeeAmount ?? null,
          depositAmount: month.depositAmount ?? null,
          scholarshipDetails: JSON.stringify(month.scholarshipDetails),
          feeStatus: month.feeStatus,
          deadlineStatus: month.deadlineStatus,
          scholarshipStatus: month.scholarshipStatus,
          fieldEvidence: JSON.stringify({ fieldStatuses: month.fieldStatuses, sources: sources.map((source) => ({ url: source.url, evidence: source.evidence })) }),
        };
        const payload = { courseId: course.courseId, campus: dataset.course.campus, studyMode: dataset.course.studyMode, ...input };
        const serialized = JSON.stringify(payload);
        const contentHash = hash(serialized);
        const existing = await tx.courseMonthCoverage.findFirst({
          where: { courseId: course.courseId, calendarMonth: month.calendarMonth, campus: dataset.course.campus, studyMode: dataset.course.studyMode },
        });
        if (existing?.approvalStatus === 'APPROVED') {
          if (existing.contentHash !== contentHash) {
            throw new Error(`Approved ${month.calendarMonth} record differs from this research package. It was left untouched; send the difference for a fresh reviewed change instead.`);
          }
          unchanged += 1;
          continue;
        }
        if (existing?.contentHash === contentHash) {
          unchanged += 1;
          continue;
        }

        const coverage = existing
          ? await tx.courseMonthCoverage.update({ where: { id: existing.id }, data: { ...input, contentHash, approvalStatus: 'PENDING', approvedBy: null, approvedAt: null, rejectedBy: null, rejectedAt: null } })
          : await tx.courseMonthCoverage.create({ data: { courseId: course.courseId, campus: dataset.course.campus, studyMode: dataset.course.studyMode, ...input, contentHash, approvalStatus: 'PENDING' } });
        const version = await tx.courseMonthCoverageVersion.count({ where: { coverageId: coverage.id } });
        await tx.courseMonthCoverageVersion.create({
          data: {
            coverageId: coverage.id,
            version: version + 1,
            action: existing ? 'RESTAGED' : 'STAGED',
            snapshot: JSON.stringify({ ...payload, contentHash, approvalStatus: 'PENDING' }),
            sourceHash: contentHash,
            actorId: 'official-source-import',
            notes: 'Evidence-backed staged research. Not published; requires Super Admin review.',
          },
        });
        if (existing) restaged += 1;
        else created += 1;
      }
      await tx.auditLog.create({
        data: {
          action: 'COURSE_MONTH_COVERAGE_STAGED',
          resource: 'CourseMonthCoverage',
          resourceId: course.courseId,
          details: JSON.stringify({ created, restaged, unchanged, officialSourcesRegistered, courseTitle: course.courseTitle, status: 'PENDING' }),
          actorRole: 'SYSTEM_IMPORT',
        },
      });
    }, { isolationLevel: 'Serializable' });

    return { university: university.name, course: course.courseTitle, created, restaged, unchanged, officialSourcesRegistered, published: 0, approvalRequired: created + restaged };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const dataset = await readValidatedDataset();
  if (!stage) {
    console.log(JSON.stringify({
      status: 'VALIDATED_DRY_RUN',
      inputFile,
      institution: dataset.institution.name,
      course: dataset.course.officialTitle,
      months: dataset.course.months.length,
      available: dataset.course.months.filter((month) => month.availabilityStatus === 'VERIFIED_AVAILABLE').map((month) => month.calendarMonth),
      notPublished: dataset.course.months.filter((month) => month.availabilityStatus === 'NOT_PUBLISHED').length,
      officialSources: dataset.course.sources.length,
      certifiedCatalogueComplete: dataset.institution.catalogueTraversalComplete,
      writesPerformed: 0,
      instruction: 'Pass --stage only after production/test DB backup, migration deployment, and exact CRM course match verification.',
    }, null, 2));
    return;
  }
  console.log(JSON.stringify({ status: 'STAGED_PENDING_APPROVAL', ...(await stageDataset(dataset)) }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
