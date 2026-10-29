import { z } from 'zod';

export const AVAILABILITY_STATUSES = [
  'VERIFIED_AVAILABLE',
  'VERIFIED_NOT_OFFERED',
  'NOT_PUBLISHED',
  'VERIFICATION_PENDING',
  'SOURCE_UNAVAILABLE',
  'CONFLICT_REQUIRES_REVIEW',
] as const;

const optionalDate = z.string().date().nullable().optional();
const nullableMoney = z.number().finite().nonnegative().nullable().optional();
const safeOfficialUrl = z.string().url().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'www.aston.ac.uk';
  } catch {
    return false;
  }
}, 'Only HTTPS URLs on the verified official Aston University website are allowed.');

const monthSchema = z.object({
  calendarMonth: z.string().regex(/^2027-(0[1-9]|1[0-2])$|^2028-01$/),
  availabilityStatus: z.enum(AVAILABILITY_STATUSES),
  startDate: optionalDate,
  applicationOpenDate: optionalDate,
  applicationCloseDate: optionalDate,
  internationalDeadline: optionalDate,
  deadlineStatus: z.string().default('NOT_PUBLISHED'),
  feeStatus: z.string().default('NOT_PUBLISHED'),
  tuitionAmount: nullableMoney,
  tuitionCurrency: z.string().max(8).optional(),
  feeAcademicYear: z.string().max(32).optional(),
  feePeriod: z.string().max(64).optional(),
  feeStudentCategory: z.string().max(64).optional(),
  applicationFeeAmount: nullableMoney,
  depositAmount: nullableMoney,
  scholarshipStatus: z.string().default('NOT_PUBLISHED'),
  scholarshipDetails: z.array(z.record(z.string(), z.unknown())).default([]),
  fieldStatuses: z.record(z.string(), z.string()).default({}),
}).strict();

export const officialCourseStagingSchema = z.object({
  schemaVersion: z.literal(1),
  datasetStatus: z.literal('RESEARCHED_SUBSET_PENDING_CRM_MATCH_AND_SUPER_ADMIN_APPROVAL'),
  collectedAt: z.string().datetime({ offset: true }),
  institution: z.object({
    name: z.string().min(1),
    country: z.string().min(1),
    officialDomain: z.literal('aston.ac.uk'),
    officialWebsite: safeOfficialUrl,
    catalogueUrl: safeOfficialUrl,
    cataloguePageReportedCount: z.number().int().nonnegative(),
    catalogueTraversalComplete: z.literal(false),
    facultiesTraversed: z.number().int().nonnegative(),
    departmentsTraversed: z.number().int().nonnegative(),
    note: z.string().min(1),
  }),
  course: z.object({
    officialTitle: z.string().min(1),
    qualification: z.string().min(1),
    studyLevel: z.string().min(1),
    officialCourseUrl: safeOfficialUrl,
    catalogueSourceUrl: safeOfficialUrl,
    campus: z.string().min(1),
    studyMode: z.string().min(1),
    duration: z.string().min(1),
    internationalEligibility: z.string().min(1),
    sourcePublishedAt: z.string().datetime({ offset: true }).nullable(),
    lastVerifiedAt: z.string().datetime({ offset: true }),
    confidence: z.number().min(0).max(1),
    academicRequirements: z.string().min(1),
    bangladeshAcademicRequirements: z.string().min(1),
    englishRequirements: z.record(z.string(), z.unknown()),
    additionalRequirements: z.record(z.string(), z.unknown()),
    publishedFeeEvidence: z.record(z.string(), z.unknown()),
    sources: z.array(z.object({
      url: safeOfficialUrl,
      type: z.string().min(1),
      evidence: z.string().min(1),
      checkedAt: z.string().datetime({ offset: true }),
    }).strict()).min(1),
    months: z.array(monthSchema).length(13),
  }).strict(),
}).strict().superRefine((dataset, ctx) => {
  const expectedMonths = Array.from({ length: 13 }, (_, index) => {
    const date = new Date(Date.UTC(2027, index, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  });
  const actual = dataset.course.months.map((month) => month.calendarMonth);
  if (new Set(actual).size !== 13 || expectedMonths.some((month) => !actual.includes(month))) {
    ctx.addIssue({ code: 'custom', path: ['course', 'months'], message: 'Coverage must contain exactly one row for each month from 2027-01 through 2028-01.' });
  }

  const availableMonths = new Set(dataset.course.months.filter((m) => m.availabilityStatus === 'VERIFIED_AVAILABLE').map((m) => m.calendarMonth));
  for (const month of dataset.course.months) {
    if (month.availabilityStatus === 'VERIFIED_AVAILABLE' && !dataset.course.sources.some((s) => s.url === dataset.course.officialCourseUrl)) {
      ctx.addIssue({ code: 'custom', path: ['course', 'months'], message: 'Verified available intake requires the official course page as an evidence source.' });
    }
    if (month.availabilityStatus !== 'VERIFIED_AVAILABLE' && (month.startDate || month.applicationOpenDate || month.applicationCloseDate || month.internationalDeadline)) {
      ctx.addIssue({ code: 'custom', path: ['course', 'months'], message: `Dates cannot be asserted when ${month.calendarMonth} is not VERIFIED_AVAILABLE.` });
    }
  }
  if ([...availableMonths].sort().join(',') !== '2027-01,2027-04,2027-09') {
    ctx.addIssue({ code: 'custom', path: ['course', 'months'], message: 'The currently researched source supports only January, April and September 2027 starts.' });
  }

  const anyForwardDatedFees = dataset.course.months.some((month) => month.tuitionAmount !== null && month.tuitionAmount !== undefined);
  if (anyForwardDatedFees) {
    ctx.addIssue({ code: 'custom', path: ['course', 'months'], message: 'No 2027/28 tuition fee was verified; do not carry forward the published 2026/27 fee.' });
  }
});

export type OfficialCourseStagingDataset = z.infer<typeof officialCourseStagingSchema>;
