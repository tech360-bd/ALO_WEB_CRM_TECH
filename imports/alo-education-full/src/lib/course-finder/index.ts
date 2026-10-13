// ALO Education — Course Finder Search Engine
// Centralized search, eligibility, and facet service

import { db } from '@/lib/db'

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

export interface CourseSearchParams {
 country?: string
 subject?: string
 level?: string
 duration?: string
 intake?: string
 university?: string
 keyword?: string
 page?: number
 limit?: number
}

export interface UniversitySearchParams {
 country?: string
 name?: string
 studyLevel?: string
 subject?: string
 page?: number
 limit?: number
}

export interface StudentProfile {
 gpa?: string | number
 gpaScale?: number
 englishTest?: 'IELTS' | 'PTE' | 'TOEFL'
 englishScore?: number
 highestDegree?: string
 degreeClass?: string // e.g. '1st', '2:1', '2:2', '3rd'
 workExperienceYears?: number
 backlogs?: number
}

export type EligibilityStatus =
  | 'ELIGIBLE'
  | 'CONDITIONAL'
  | 'NOT_ELIGIBLE'
  | 'REQUIRES_REVIEW'
  | 'DATA_UNAVAILABLE'

export interface EligibilityResult {
 status: EligibilityStatus
 reasons: string[]
 requirements: {
   english: string
   academic: string
   gpa?: string
   additional?: string
 }
 matched?: boolean
 scoreBreakdown?: {
   gpa: boolean | null
   english: boolean | null
   academic: boolean | null
 }
}

export interface PaginatedResult<T> {
 results: T[]
 pagination: {
   page: number
   limit: number
   total: number
   totalPages: number
 }
 facets?: SearchFacets
}

export interface SearchFacets {
 countries: { slug: string; name: string; count: number }[]
 subjects: { value: string; count: number }[]
 levels: { value: string; count: number }[]
 intakes: { value: string; count: number }[]
 durations: { value: string; count: number }[]
 universities: { slug: string; name: string; count: number }[]
}

// ────────────────────────────────────────────────────────────
// PUBLIC FIELD SELECTIONS (NO commission fields ever)
// ────────────────────────────────────────────────────────────

export const PUBLIC_COURSE_FIELDS = {
  slug: true,
  name: true,
  countrySlug: true,
  city: true,
  campus: true,
  level: true,
  subject: true,
  discipline: true,
  studyArea: true,
  deliveryMode: true,
  degreeType: true,
  duration: true,
  intake: true,
  tuition: true,
  tuitionCurrency: true,
  applicationFee: true,
  deposit: true,
  scholarship: true,
  scholarshipAvailable: true,
  englishRequirement: true,
  academicRequirement: true,
  gpaRequirement: true,
  backlogPolicy: true,
  workExperience: true,
  portfolioRequired: true,
  interviewRequired: true,
  moiAccepted: true,
  overview: true,
  internship: true,
  placement: true,
  coop: true,
  visaNotes: true,
  deadline: true,
  matchScore: true,
  metaTitle: true,
  metaDescription: true,
} as const

export const PUBLIC_UNIVERSITY_FIELDS = {
  slug: true,
  name: true,
  countrySlug: true,
  city: true,
  state: true,
  ranking: true,
  rankingSource: true,
  studentsCount: true,
  logo: true,
  campusImage: true,
  overview: true,
  strengths: true,
  quickFacts: true,
  tuitionRange: true,
  scholarshipAvailable: true,
  popularSubjects: true,
  metaTitle: true,
  metaDescription: true,
} as const

// ────────────────────────────────────────────────────────────
// IN-MEMORY FACET CACHE (TTL: 5 minutes)
// ────────────────────────────────────────────────────────────

const facetCache = new Map<string, { data: unknown; expiresAt: number }>()
const FACET_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = facetCache.get(key)
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data as T
  }
  facetCache.delete(key)
  return null
}

function setCache(key: string, data: unknown): void {
  facetCache.set(key, { data, expiresAt: Date.now() + FACET_TTL_MS })
}

// ────────────────────────────────────────────────────────────
// SEARCH COURSES
// ────────────────────────────────────────────────────────────

export async function searchCourses(
  params: CourseSearchParams
): Promise<PaginatedResult<Record<string, unknown>>> {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(50, Math.max(1, params.limit || 12))
  const skip = (page - 1) * limit

  // Country + subject are minimum required
  if (!params.country && !params.subject) {
    return {
      results: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
      facets: {
        countries: [],
        subjects: [],
        levels: [],
        intakes: [],
        durations: [],
        universities: [],
      },
    }
  }

  const where: Record<string, unknown> = { approvalStatus: 'PUBLISHED' }

  if (params.country) {
    where.countrySlug = params.country
  }
  if (params.subject) {
    where.subject = { contains: params.subject }
  }
  if (params.level) {
    where.level = params.level
  }
  if (params.duration) {
    where.duration = { contains: params.duration }
  }
  if (params.intake) {
    where.intake = { contains: params.intake }
  }
  if (params.university) {
    where.universitySlug = params.university
  }
  if (params.keyword) {
    where.OR = [
      { name: { contains: params.keyword } },
      { subject: { contains: params.keyword } },
      { discipline: { contains: params.keyword } },
      { overview: { contains: params.keyword } },
    ]
  }

  const [courses, total] = await Promise.all([
    db.coursePage.findMany({
      where,
      select: {
        ...PUBLIC_COURSE_FIELDS,
        universitySlug: true,
        university: {
          select: {
            name: true,
            slug: true,
            city: true,
            logo: true,
            countrySlug: true,
            ranking: true,
          },
        },
      },
      orderBy: { matchScore: 'desc' },
      take: limit,
      skip,
    }),
    db.coursePage.count({ where }),
  ])

  // Build facets based on the base filters (without keyword/pagination)
  const facets = await buildCourseFacets(where, params.country, params.subject)

  return {
    results: courses as unknown as Record<string, unknown>[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    facets,
  }
}

// ────────────────────────────────────────────────────────────
// SEARCH UNIVERSITIES
// ────────────────────────────────────────────────────────────

export async function searchUniversities(
  params: UniversitySearchParams
): Promise<PaginatedResult<Record<string, unknown>>> {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(50, Math.max(1, params.limit || 12))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { approvalStatus: 'PUBLISHED' }

  if (params.country) {
    where.countrySlug = params.country
  }
  if (params.name) {
    where.name = { contains: params.name }
  }
  if (params.subject) {
    where.popularSubjects = { contains: params.subject }
  }
  if (params.studyLevel) {
    // For universities, studyLevel filters via their course offerings
    const matchingCourses = await db.coursePage.findMany({
      where: { level: params.studyLevel, approvalStatus: 'PUBLISHED' },
      select: { universitySlug: true },
      distinct: ['universitySlug'],
    })
    const slugs = matchingCourses.map((c) => c.universitySlug)
    if (slugs.length > 0) {
      where.slug = { in: slugs }
    }
  }

  const [universities, total] = await Promise.all([
    db.universityPage.findMany({
      where,
      select: {
        ...PUBLIC_UNIVERSITY_FIELDS,
        _count: {
          select: { courses: { where: { approvalStatus: 'PUBLISHED' } } },
        },
      },
      orderBy: { name: 'asc' },
      take: limit,
      skip,
    }),
    db.universityPage.count({ where }),
  ])

  return {
    results: universities as unknown as Record<string, unknown>[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ────────────────────────────────────────────────────────────
// CALCULATE ELIGIBILITY
// ────────────────────────────────────────────────────────────

export async function calculateEligibility(
  courseSlug: string,
  studentProfile?: StudentProfile
): Promise<EligibilityResult> {
  // Fetch course with safe fields
  const course = await db.coursePage.findFirst({
    where: { slug: courseSlug, approvalStatus: 'PUBLISHED' },
    select: {
      slug: true,
      name: true,
      englishRequirement: true,
      academicRequirement: true,
      gpaRequirement: true,
      level: true,
      subject: true,
      universitySlug: true,
      countrySlug: true,
    },
  })

  if (!course) {
    return {
      status: 'DATA_UNAVAILABLE',
      reasons: ['Course not found'],
      requirements: { english: 'N/A', academic: 'N/A' },
    }
  }

  // Fetch eligibility rule if it exists
  const rule = await db.courseEligibilityRule.findUnique({
    where: { courseSlug },
  })

  const requirements = {
    english: rule?.englishRequirement || course.englishRequirement || 'Not specified',
    academic: rule?.academicRequirement || course.academicRequirement || 'Not specified',
    gpa: rule?.minGpa || course.gpaRequirement || undefined,
    additional: rule?.additionalRequirement || undefined,
  }

  // No student profile → return general requirements
  if (!studentProfile) {
    return {
      status: 'DATA_UNAVAILABLE',
      reasons: [
        'Create a student profile to get a personalized eligibility assessment.',
        'The requirements below are general guidelines — actual eligibility may vary.',
      ],
      requirements,
    }
  }

  // With student profile, evaluate
  const reasons: string[] = []
  const scoreBreakdown: EligibilityResult['scoreBreakdown'] = {
    gpa: null,
    english: null,
    academic: null,
  }

  let eligibleCount = 0
  let totalChecks = 0

  // GPA check
  if (requirements.gpa) {
    totalChecks++
    const minGpa = parseFloat(requirements.gpa)
    if (studentProfile.gpa !== undefined && !isNaN(minGpa)) {
      const studentGpa = typeof studentProfile.gpa === 'string' ? parseFloat(studentProfile.gpa) : studentProfile.gpa
      if (!isNaN(studentGpa) && studentGpa >= minGpa) {
        scoreBreakdown.gpa = true
        eligibleCount++
      } else {
        scoreBreakdown.gpa = false
        reasons.push(`GPA: Your GPA (${studentProfile.gpa}) is below the minimum requirement (${requirements.gpa}).`)
      }
    } else {
      reasons.push(`GPA: Could not compare. Please ensure your GPA is provided.`)
    }
  }

  // English check
  if (studentProfile.englishTest && studentProfile.englishScore !== undefined) {
    totalChecks++
    const minIelts = rule?.minIelts ? parseFloat(rule.minIelts) : null
    const minPte = rule?.minPte ? parseFloat(rule.minPte) : null
    const minToefl = rule?.minToefl ? parseFloat(rule.minToefl) : null

    let passed = false
    switch (studentProfile.englishTest) {
      case 'IELTS':
        if (minIelts !== null && studentProfile.englishScore >= minIelts) passed = true
        else if (minIelts !== null) reasons.push(`IELTS: Your score (${studentProfile.englishScore}) is below the minimum (${minIelts}).`)
        else { passed = true } // No rule, assume ok
        break
      case 'PTE':
        if (minPte !== null && studentProfile.englishScore >= minPte) passed = true
        else if (minPte !== null) reasons.push(`PTE: Your score (${studentProfile.englishScore}) is below the minimum (${minPte}).`)
        else { passed = true }
        break
      case 'TOEFL':
        if (minToefl !== null && studentProfile.englishScore >= minToefl) passed = true
        else if (minToefl !== null) reasons.push(`TOEFL: Your score (${studentProfile.englishScore}) is below the minimum (${minToefl}).`)
        else { passed = true }
        break
    }

    if (passed) {
      scoreBreakdown.english = true
      eligibleCount++
    } else if (!reasons.some((r) => r.startsWith('IELTS:') || r.startsWith('PTE:') || r.startsWith('TOEFL:'))) {
      reasons.push(`English: No specific ${studentProfile.englishTest} requirement found. Verify with the university.`)
      scoreBreakdown.english = null
      totalChecks-- // Don't count if we can't evaluate
    } else {
      scoreBreakdown.english = false
    }
  } else {
    reasons.push('English: No English test score provided. This is typically required.')
  }

  // Academic check
  if (studentProfile.highestDegree || studentProfile.degreeClass) {
    totalChecks++
    // If there's a degree class, check against typical requirements
    const degreeOrder = ['3rd', '2:2', '2:1', '1st']
    if (studentProfile.degreeClass && requirements.academic) {
      const reqLower = requirements.academic.toLowerCase()
      let minClassIndex = -1

      if (reqLower.includes('1st') || reqLower.includes('first class')) minClassIndex = 3
      else if (reqLower.includes('2:1') || reqLower.includes('upper second')) minClassIndex = 2
      else if (reqLower.includes('2:2') || reqLower.includes('lower second')) minClassIndex = 1
      else if (reqLower.includes('3rd') || reqLower.includes('third class')) minClassIndex = 0

      const studentIndex = degreeOrder.indexOf(studentProfile.degreeClass)

      if (minClassIndex >= 0 && studentIndex >= 0) {
        if (studentIndex >= minClassIndex) {
          scoreBreakdown.academic = true
          eligibleCount++
        } else {
          scoreBreakdown.academic = false
          reasons.push(`Academic: Your degree classification (${studentProfile.degreeClass}) may not meet the requirement (${requirements.academic}).`)
        }
      } else {
        scoreBreakdown.academic = null
        reasons.push(`Academic: Could not automatically compare your qualification. Please review the requirement manually.`)
      }
    } else {
      scoreBreakdown.academic = null
      reasons.push(`Academic: Please provide your degree classification for a precise assessment.`)
    }
  }

  // Determine overall status
  let status: EligibilityStatus

  if (totalChecks === 0) {
    status = 'REQUIRES_REVIEW'
    if (reasons.length === 0) {
      reasons.push('Insufficient data to determine eligibility. Please complete your profile and try again.')
    }
  } else if (eligibleCount === totalChecks && reasons.length === 0) {
    status = 'ELIGIBLE'
  } else if (eligibleCount > 0) {
    status = 'CONDITIONAL'
  } else if (reasons.length > 0 && eligibleCount === 0) {
    status = 'NOT_ELIGIBLE'
  } else {
    status = 'REQUIRES_REVIEW'
  }

  if (status === 'ELIGIBLE') {
    reasons.push('Based on the information provided, you appear to meet the entry requirements for this course.')
  }

  if (rule?.eligibilityNotes) {
    reasons.push(rule.eligibilityNotes)
  }

  return {
    status,
    reasons,
    requirements,
    matched: eligibleCount > 0,
    scoreBreakdown,
  }
}

// ────────────────────────────────────────────────────────────
// GET COUNTRY GUIDE
// ────────────────────────────────────────────────────────────

export async function getCountryGuide(countrySlug: string) {
  const cacheKey = `guide:${countrySlug}`
  const cached = getCached<unknown>(cacheKey)
  if (cached) return cached

  const guide = await db.countryEducationGuide.findUnique({
    where: { countrySlug },
    include: {
      steps: {
        where: { isPublished: true },
        orderBy: { stepNumber: 'asc' },
      },
    },
  })

  if (guide) {
    setCache(cacheKey, guide)
  }

  return guide
}

// ────────────────────────────────────────────────────────────
// GET SEARCH FACETS
// ────────────────────────────────────────────────────────────

export async function getSearchFacets(): Promise<SearchFacets> {
  const cacheKey = 'global-facets'
  const cached = getCached<SearchFacets>(cacheKey)
  if (cached) return cached

  const [countries, subjects, levels, intakes, durations, universities] = await Promise.all([
    db.countryPage.findMany({
      where: { approvalStatus: 'PUBLISHED' },
      select: { slug: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.coursePage.findMany({
      where: { approvalStatus: 'PUBLISHED' },
      select: { subject: true },
      distinct: ['subject'],
      orderBy: { subject: 'asc' },
    }),
    db.coursePage.findMany({
      where: { approvalStatus: 'PUBLISHED' },
      select: { level: true },
      distinct: ['level'],
      orderBy: { level: 'asc' },
    }),
    db.coursePage.findMany({
      where: { approvalStatus: 'PUBLISHED' },
      select: { intake: true },
      distinct: ['intake'],
    }),
    db.coursePage.findMany({
      where: { approvalStatus: 'PUBLISHED' },
      select: { duration: true },
      distinct: ['duration'],
      orderBy: { duration: 'asc' },
    }),
    db.universityPage.findMany({
      where: { approvalStatus: 'PUBLISHED' },
      select: { slug: true, name: true, countrySlug: true },
      orderBy: { name: 'asc' },
    }),
  ])

  // Get course counts per country
  const countryCounts = await db.coursePage.groupBy({
    by: ['countrySlug'],
    where: { approvalStatus: 'PUBLISHED' },
    _count: { countrySlug: true },
  })
  const countMap = new Map(countryCounts.map((c) => [c.countrySlug, c._count.countrySlug]))

  // Get course counts per subject
  const subjectCounts = await db.coursePage.groupBy({
    by: ['subject'],
    where: { approvalStatus: 'PUBLISHED' },
    _count: { subject: true },
  })
  const subjectCountMap = new Map(subjectCounts.map((c) => [c.subject, c._count.subject]))

  // Get course counts per level
  const levelCounts = await db.coursePage.groupBy({
    by: ['level'],
    where: { approvalStatus: 'PUBLISHED' },
    _count: { level: true },
  })
  const levelCountMap = new Map(levelCounts.map((c) => [c.level, c._count.level]))

  // Get course counts per university
  const uniCounts = await db.coursePage.groupBy({
    by: ['universitySlug'],
    where: { approvalStatus: 'PUBLISHED' },
    _count: { universitySlug: true },
  })
  const uniCountMap = new Map(uniCounts.map((c) => [c.universitySlug, c._count.universitySlug]))

  // Normalize intakes (they can be comma-separated)
  const intakeSet = new Map<string, number>()
  for (const c of intakes) {
    const parts = c.intake.split(',').map((s) => s.trim()).filter(Boolean)
    for (const part of parts) {
      intakeSet.set(part, (intakeSet.get(part) || 0) + 1)
    }
  }

  const facets: SearchFacets = {
    countries: countries.map((c) => ({
      slug: c.slug,
      name: c.name,
      count: countMap.get(c.slug) || 0,
    })),
    subjects: subjects.map((s) => ({
      value: s.subject,
      count: subjectCountMap.get(s.subject) || 0,
    })),
    levels: levels.map((l) => ({
      value: l.level,
      count: levelCountMap.get(l.level) || 0,
    })),
    intakes: Array.from(intakeSet.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    durations: durations.map((d) => ({
      value: d.duration,
      count: 1, // Approximate — individual counts would be expensive
    })),
    universities: universities.map((u) => ({
      slug: u.slug,
      name: u.name,
      count: uniCountMap.get(u.slug) || 0,
    })),
  }

  setCache(cacheKey, facets)
  return facets
}

// ────────────────────────────────────────────────────────────
// INTERNAL: BUILD COURSE FACETS for a given filter context
// ────────────────────────────────────────────────────────────

async function buildCourseFacets(
  baseWhere: Record<string, unknown>,
  country?: string,
  subject?: string
): Promise<SearchFacets> {
  // Build facets scoped to the current country/subject context
  const facetWhere: Record<string, unknown> = { approvalStatus: 'PUBLISHED' }
  if (country) facetWhere.countrySlug = country

  const [countries, subjects, levels, intakes, durations, universities] = await Promise.all([
    // Countries: always from CountryPage
    db.countryPage.findMany({
      where: { approvalStatus: 'PUBLISHED' },
      select: { slug: true, name: true },
      orderBy: { name: 'asc' },
    }),
    // Subjects: scoped to country if set
    db.coursePage.findMany({
      where: facetWhere,
      select: { subject: true },
      distinct: ['subject'],
      orderBy: { subject: 'asc' },
    }),
    // Levels: scoped to country
    db.coursePage.findMany({
      where: facetWhere,
      select: { level: true },
      distinct: ['level'],
      orderBy: { level: 'asc' },
    }),
    // Intakes: scoped to country
    db.coursePage.findMany({
      where: facetWhere,
      select: { intake: true },
      distinct: ['intake'],
    }),
    // Durations: scoped
    db.coursePage.findMany({
      where: facetWhere,
      select: { duration: true },
      distinct: ['duration'],
      orderBy: { duration: 'asc' },
    }),
    // Universities: scoped to country
    db.universityPage.findMany({
      where: { ...facetWhere, approvalStatus: 'PUBLISHED' },
      select: { slug: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  // Counts
  const subjectWhere: Record<string, unknown> = { approvalStatus: 'PUBLISHED' }
  if (country) subjectWhere.countrySlug = country
  const subjectCounts = await db.coursePage.groupBy({
    by: ['subject'],
    where: subjectWhere,
    _count: { subject: true },
  })
  const subjectCountMap = new Map(subjectCounts.map((c) => [c.subject, c._count.subject]))

  const levelCounts = await db.coursePage.groupBy({
    by: ['level'],
    where: subjectWhere,
    _count: { level: true },
  })
  const levelCountMap = new Map(levelCounts.map((c) => [c.level, c._count.level]))

  const uniCountWhere: Record<string, unknown> = { approvalStatus: 'PUBLISHED' }
  if (country) uniCountWhere.countrySlug = country
  const uniCounts = await db.coursePage.groupBy({
    by: ['universitySlug'],
    where: uniCountWhere,
    _count: { universitySlug: true },
  })
  const uniCountMap = new Map(uniCounts.map((c) => [c.universitySlug, c._count.universitySlug]))

  const countryCounts = await db.coursePage.groupBy({
    by: ['countrySlug'],
    where: { approvalStatus: 'PUBLISHED' },
    _count: { countrySlug: true },
  })
  const countryCountMap = new Map(countryCounts.map((c) => [c.countrySlug, c._count.countrySlug]))

  // Normalize intakes
  const intakeSet = new Map<string, number>()
  for (const c of intakes) {
    const parts = c.intake.split(',').map((s) => s.trim()).filter(Boolean)
    for (const part of parts) {
      intakeSet.set(part, (intakeSet.get(part) || 0) + 1)
    }
  }

  return {
    countries: countries.map((c) => ({
      slug: c.slug,
      name: c.name,
      count: countryCountMap.get(c.slug) || 0,
    })),
    subjects: subjects.map((s) => ({
      value: s.subject,
      count: subjectCountMap.get(s.subject) || 0,
    })),
    levels: levels.map((l) => ({
      value: l.level,
      count: levelCountMap.get(l.level) || 0,
    })),
    intakes: Array.from(intakeSet.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    durations: durations.map((d) => ({ value: d.duration, count: 1 })),
    universities: universities.map((u) => ({
      slug: u.slug,
      name: u.name,
      count: uniCountMap.get(u.slug) || 0,
    })),
  }
}
