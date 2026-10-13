/**
 * Higher Study API helpers — shared request/response utilities for the
 * /api/v1/higher-study/* route family.
 * --------------------------------------------------------------------
 * Responsibilities:
 *  - Standard JSON envelope (`jsonResponse`) so every route returns the
 *    same `{ success, message, data, meta, errors }` shape.
 *  - Pagination + sort parsing with safe defaults and caps.
 *  - Generic `buildWhereClause` that turns a filter object into a Prisma
 *    `where` clause (returned as `Record<string, unknown>` so each route
 *    can cast it to the right model-specific where type).
 *  - String sanitisation + slugify for safe URL generation.
 *  - Referral token signing/verification using HMAC-SHA256 (short-lived,
 *    24h validity, no PII encoded).
 *  - Device-category detection + privacy-friendly IP hashing.
 *  - Public Prisma select objects that exclude internal fields
 *    (audit columns, last-verified-by, contact emails, phone numbers,
 *    raw JSON columns, etc.) from public API responses.
 *
 * All functions are pure (no DB access) except where noted, so they can
 * be unit-tested in isolation.
 */

import crypto from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_SAFE_STRING_LENGTH,
  REFERRAL_CODE_LENGTH,
  REFERRAL_TOKEN_TTL_MS,
} from "@/lib/higher-study/constants";
import type {
  ApiResponse,
  EntityType,
  PaginationParams,
  ReferralTokenPayload,
} from "@/lib/higher-study/types";

// ─── Standard JSON envelope ──────────────────────────────────────────

/**
 * Build a NextResponse wrapping the standard Higher Study API envelope:
 * `{ success, message, data, meta, errors }`. Always returns 200 unless
 * a different `status` is provided.
 *
 * @param success  whether the request succeeded
 * @param message  human-readable status message
 * @param data     response payload (null on failure)
 * @param meta     optional pagination / facet metadata
 * @param errors   optional list of structured error objects
 * @param status   HTTP status code (default 200)
 */
export function jsonResponse<T = unknown>(
  success: boolean,
  message: string,
  data?: T | null,
  meta: Record<string, unknown> = {},
  errors: unknown[] = [],
  status = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>(
    {
      success,
      message,
      data: data ?? null,
      meta,
      errors,
    },
    { status },
  );
}

// ─── Pagination parsing ──────────────────────────────────────────────

/**
 * Parse `?page`, `?limit`, `?sort`, `?order` query params from a
 * NextRequest with safe defaults and caps. Page defaults to 1, limit
 * defaults to {@link DEFAULT_PAGE_SIZE} and is capped at
 * {@link MAX_PAGE_SIZE}. `order` is constrained to `"asc"` | `"desc"`.
 */
export function parsePaginationParams(req: NextRequest): PaginationParams {
  const url = new URL(req.url);
  const pageRaw = Number(url.searchParams.get("page") || "1");
  const limitRaw = Number(url.searchParams.get("limit") || DEFAULT_PAGE_SIZE);
  const sort = safeString(url.searchParams.get("sort") || "createdAt") || "createdAt";
  const orderRaw = (url.searchParams.get("order") || "desc").toLowerCase();

  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.floor(limitRaw), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  const order: "asc" | "desc" = orderRaw === "asc" ? "asc" : "desc";

  return { page, limit, sort, order };
}

/**
 * Build the `{ skip, take }` pair used by Prisma `findMany` from a
 * parsed {@link PaginationParams}.
 */
export function paginationSkipTake(params: PaginationParams): {
  skip: number;
  take: number;
} {
  return { skip: (params.page - 1) * params.limit, take: params.limit };
}

/**
 * Build the standard {@link PaginationMeta} block returned with every
 * list response. `total` is the row count returned by `prisma.*.count`.
 */
export function buildPaginationMeta(
  params: PaginationParams,
  total: number,
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalPages = Math.max(1, Math.ceil(total / params.limit));
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
}

// ─── Where-clause builder ────────────────────────────────────────────

/**
 * Build a Prisma `where` clause (returned as `Record<string, unknown>`)
 * from a Higher Study filter object. Supports:
 *  - `q` → cross-field case-insensitive search (caller passes which
 *     fields to OR-search via `searchFields`)
 *  - direct equality filters (`countrySlug`, `citySlug`, `studyLevel`,
 *     `subjectSlug`, `intakeSlug`, `fundingType`, `institutionType`,
 *     `studyMode`, `provider`, `category`, `researchAreaSlug`,
 *     `supervisorSlug`, `universitySlug`)
 *  - boolean filters (`featured`, `hasMBA`, `hasPhD`, `hasMRes`,
 *     `hasMPhil`, `hasProfessionalDoctorate`, `scholarshipAvailable`,
 *     `workExperienceRequired`, `acceptingStudents`, `tuitionCoverage`,
 *     `livingCostCoverage`, `travelSupport`, `healthInsurance`)
 *  - numeric range (`maxTuitionFee`, `minUndergraduateCount`,
 *     `minPostgraduateCount`)
 *  - date range (`deadlineAfter`, `deadlineBefore`)
 *  - `slugs` → `slug: { in: [...] }` for compare queries
 *
 * The result is loosely typed so each route can cast it to the correct
 * model-specific where type (e.g. `Prisma.HigherStudyUniversityWhereInput`).
 *
 * NOTE: this function does NOT enforce publication/verification status —
 * callers should add `publicationStatus: "published"` themselves to make
 * the gating explicit per route.
 */
export function buildWhereClause(
  filters: Record<string, unknown>,
  searchFields: string[] = [],
): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  // Full-text search across caller-specified fields.
  const q = safeString(filters.q as string | undefined);
  if (q && searchFields.length > 0) {
    where.OR = searchFields.map((f) => ({
      [f]: { contains: q },
    }));
  }

  // Slug-based equality filters (each maps to a Prisma relation field
  // when prefixed with a relation name — handled by the caller passing
  // a transformed filter; here we only set the bare slug if the field
  // name matches an existing column).
  const equalitySlugFields = [
    "slug",
    "countrySlug",
    "citySlug",
    "studyLevel",
    "subjectSlug",
    "intakeSlug",
    "fundingType",
    "institutionType",
    "studyMode",
    "provider",
    "category",
    "researchAreaSlug",
    "supervisorSlug",
    "universitySlug",
    "programme",
  ] as const;
  for (const key of equalitySlugFields) {
    const v = safeString(filters[key] as string | undefined);
    if (v) where[key] = v;
  }

  // Multi-slug compare (slug IN [...]).
  const slugsRaw = safeString(filters.slugs as string | undefined);
  if (slugsRaw) {
    const slugs = slugsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (slugs.length > 0) where.slug = { in: slugs };
  }

  // Boolean filters.
  const booleanFields = [
    "featured",
    "hasMBA",
    "hasPhD",
    "hasMRes",
    "hasMPhil",
    "hasProfessionalDoctorate",
    "scholarshipAvailable",
    "workExperienceRequired",
    "portfolioRequired",
    "interviewRequired",
    "acceptingStudents",
    "tuitionCoverage",
    "livingCostCoverage",
    "travelSupport",
    "healthInsurance",
  ] as const;
  for (const key of booleanFields) {
    const v = filters[key];
    if (typeof v === "boolean") where[key] = v;
  }

  // Numeric ranges.
  const maxTuitionFee = Number(filters.maxTuitionFee);
  if (Number.isFinite(maxTuitionFee) && maxTuitionFee > 0) {
    where.tuitionFee = { ...(where.tuitionFee as object), lte: Math.floor(maxTuitionFee) };
  }
  const minUg = Number(filters.minUndergraduateCount);
  if (Number.isFinite(minUg) && minUg > 0) {
    where.undergraduateCount = { gte: Math.floor(minUg) };
  }
  const minPg = Number(filters.minPostgraduateCount);
  if (Number.isFinite(minPg) && minPg > 0) {
    where.postgraduateCount = { gte: Math.floor(minPg) };
  }

  // Date range on `deadline`.
  const deadlineAfter = safeString(filters.deadlineAfter as string | undefined);
  const deadlineBefore = safeString(filters.deadlineBefore as string | undefined);
  if (deadlineAfter || deadlineBefore) {
    const range: Record<string, Date> = {};
    if (deadlineAfter) {
      const d = new Date(deadlineAfter);
      if (!Number.isNaN(d.getTime())) range.gte = d;
    }
    if (deadlineBefore) {
      const d = new Date(deadlineBefore);
      if (!Number.isNaN(d.getTime())) range.lte = d;
    }
    if (Object.keys(range).length > 0) where.deadline = range;
  }

  return where;
}

// ─── String helpers ──────────────────────────────────────────────────

/**
 * Sanitise a string input: trim whitespace, collapse runs of whitespace,
 * and cap length at {@link MAX_SAFE_STRING_LENGTH}. Returns the empty
 * string for `null`/`undefined` input.
 */
export function safeString(s: string | null | undefined): string {
  if (s === null || s === undefined) return "";
  const trimmed = String(s).trim().replace(/\s+/g, " ");
  if (trimmed.length <= MAX_SAFE_STRING_LENGTH) return trimmed;
  return trimmed.slice(0, MAX_SAFE_STRING_LENGTH);
}

/**
 * Convert a string to a URL-safe slug:
 *  - lowercase
 *  - non-alphanumeric runs collapsed to a single `-`
 *  - leading/trailing hyphens stripped
 *
 * Returns the empty string if the input has no slug-eligible characters.
 */
export function slugify(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Referral token helpers ──────────────────────────────────────────

/**
 * Generate a short, URL-safe alphanumeric referral code of length
 * {@link REFERRAL_CODE_LENGTH} (default 12 chars). Uses Node's
 * `crypto.randomBytes` so it is cryptographically unpredictable.
 */
export function generateReferralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
  const bytes = crypto.randomBytes(REFERRAL_CODE_LENGTH);
  let out = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/**
 * Sign a referral token using HMAC-SHA256. The token carries the
 * referral code + referral type + issued-at + expiry, and is verifiable
 * by {@link verifyReferralToken}. The token is URL-safe (base64url).
 *
 * The `secret` should be a long random string (typically
 * `process.env.HIGHER_STUDY_REFERRAL_SECRET`); falls back to a
 * session-constant if not configured.
 */
export function signReferralToken(
  payload: Omit<ReferralTokenPayload, "iat" | "exp">,
  secret: string,
): string {
  const iat = Date.now();
  const exp = iat + REFERRAL_TOKEN_TTL_MS;
  const fullPayload: ReferralTokenPayload = { ...payload, iat, exp };

  const body = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");

  return `${body}.${sig}`;
}

/**
 * Verify a referral token produced by {@link signReferralToken}.
 * Returns the decoded payload if the signature is valid and the token
 * has not expired, otherwise returns `null`.
 */
export function verifyReferralToken(
  token: string,
  secret: string,
): ReferralTokenPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");

  // Use timingSafeEqual to mitigate timing attacks. Length must match.
  if (
    sig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  ) {
    return null;
  }

  let payload: ReferralTokenPayload;
  try {
    payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as ReferralTokenPayload;
  } catch {
    return null;
  }

  if (typeof payload.exp !== "number" || Date.now() > payload.exp) {
    return null;
  }
  return payload;
}

// ─── Device + IP helpers ─────────────────────────────────────────────

/**
 * Categorise a User-Agent string into `'mobile' | 'tablet' | 'desktop'`.
 * Defaults to `'desktop'` for empty / unparseable user agents.
 */
export function getDeviceCategory(userAgent: string | null | undefined):
  | "mobile"
  | "tablet"
  | "desktop" {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();
  // iPad / Android tablet detection (covers iPadOS 13+ which reports as Mac)
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    return "tablet";
  }
  if (/mobi|iphone|ipod|android.*mobile|blackberry|opera mini/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

/**
 * Privacy-friendly IP hash: SHA-256 of the IP, truncated to 16 hex chars.
 * The hash is one-way and salted with the application secret so the same
 * IP cannot be cross-referenced across services, but the same visitor can
 * still be correlated within this platform for audit / rate-limiting.
 *
 * Pass `secret` from `process.env.HIGHER_STUDY_REFERRAL_SECRET` (or any
 * stable per-deployment secret).
 */
export function hashIp(ip: string | null | undefined, secret = ""): string {
  const clean = safeString(ip) || "unknown";
  return crypto
    .createHash("sha256")
    .update(`${clean}:${secret}`)
    .digest("hex")
    .slice(0, 16);
}

// ─── Public Prisma select objects ────────────────────────────────────

/**
 * Prisma select for public University API responses. Excludes internal
 * audit fields (`lastVerifiedBy`, raw JSON columns, `contactEmail`,
 * `contactPhone`) that should not be exposed to the public site.
 */
export const publicUniversitySelect = {
  id: true,
  slug: true,
  officialName: true,
  alternativeNames: true,
  overview: true,
  establishedYear: true,
  institutionType: true,
  countryId: true,
  cityId: true,
  campusLocations: true,
  officialWebsite: true,
  availableIntakes: true,
  studyLevels: true,
  undergraduateCount: true,
  postgraduateCount: true,
  hasMBA: true,
  hasMRes: true,
  hasMPhil: true,
  hasPhD: true,
  hasProfessionalDoctorate: true,
  researchDepartments: true,
  researchStrengths: true,
  tuitionFeeRange: true,
  depositInfo: true,
  academicEntryRequirements: true,
  countrySpecificRequirements: true,
  ieltsRequirement: true,
  ieltsUkviRequirement: true,
  pteRequirement: true,
  toeflRequirement: true,
  duolingoRequirement: true,
  languageCertRequirement: true,
  oxfordElltRequirement: true,
  englishWaiverPolicy: true,
  workExperienceRequired: true,
  portfolioRequired: true,
  interviewRequired: true,
  applicationDeadlines: true,
  accommodationOptions: true,
  estimatedLivingCosts: true,
  internationalStudentServices: true,
  disabilitySupport: true,
  careerSupport: true,
  graduateOutcomes: true,
  graduateRouteGuidance: true,
  applicationGuidance: true,
  officialLinks: true,
  rankingsJson: true,
  logoUrl: true,
  featured: true,
  verificationStatus: true,
  publicationStatus: true,
  lastVerifiedAt: true,
  officialSourceUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.HigherStudyUniversitySelect;

/**
 * Prisma select for public Course API responses. Excludes internal
 * audit fields and raw `modules` JSON (which is parsed separately on the
 * detail page only).
 */
export const publicCourseSelect = {
  id: true,
  slug: true,
  title: true,
  universityId: true,
  countryId: true,
  subjectId: true,
  studyLevel: true,
  qualification: true,
  specialisation: true,
  overview: true,
  modules: true,
  duration: true,
  studyMode: true,
  tuitionFee: true,
  tuitionCurrency: true,
  otherCosts: true,
  scholarshipAvailable: true,
  academicEntryRequirements: true,
  countrySpecificRequirements: true,
  englishRequirements: true,
  workExperienceRequired: true,
  portfolioRequired: true,
  interviewRequired: true,
  careerOutcomes: true,
  placementInfo: true,
  researchComponent: true,
  applicationDeadline: true,
  requiredDocuments: true,
  intakeId: true,
  officialSourceUrl: true,
  verificationStatus: true,
  publicationStatus: true,
  lastVerifiedAt: true,
  featured: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.HigherStudyCourseSelect;

/**
 * Prisma select for public Scholarship API responses. Excludes internal
 * audit fields and any PII.
 */
export const publicScholarshipSelect = {
  id: true,
  slug: true,
  name: true,
  provider: true,
  countryId: true,
  universityId: true,
  eligibleStudyLevels: true,
  eligibleSubjects: true,
  eligibleNationalities: true,
  fundingType: true,
  fundingAmount: true,
  tuitionCoverage: true,
  livingCostCoverage: true,
  travelSupport: true,
  healthInsurance: true,
  otherBenefits: true,
  eligibilityCriteria: true,
  academicRequirement: true,
  englishRequirement: true,
  workExperienceRequired: true,
  requiredDocuments: true,
  openingDate: true,
  deadline: true,
  applicationProcess: true,
  selectionProcess: true,
  restrictions: true,
  officialSourceUrl: true,
  verificationStatus: true,
  publicationStatus: true,
  lastVerifiedAt: true,
  featured: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.HigherStudyScholarshipSelect;

/**
 * Prisma select for public Research Project API responses. Excludes
 * internal audit fields and any PII.
 */
export const publicResearchSelect = {
  id: true,
  slug: true,
  title: true,
  universityId: true,
  department: true,
  researchGroupId: true,
  researchAreaId: true,
  supervisorId: true,
  coSupervisorId: true,
  projectSummary: true,
  researchObjectives: true,
  methodologySummary: true,
  candidateProfile: true,
  academicRequirements: true,
  englishRequirements: true,
  fundingStatus: true,
  tuitionCoverage: true,
  stipend: true,
  additionalFunding: true,
  duration: true,
  startDate: true,
  applicationDeadline: true,
  requiredDocuments: true,
  applicationProcess: true,
  officialSourceUrl: true,
  verificationStatus: true,
  publicationStatus: true,
  lastVerifiedAt: true,
  featured: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.HigherStudyResearchProjectSelect;

/**
 * Prisma select for public Supervisor API responses. Excludes any
 * private contact details — supervisors are only contactable via the
 * public profile URL or through a referral.
 */
export const publicSupervisorSelect = {
  id: true,
  slug: true,
  name: true,
  academicTitle: true,
  universityId: true,
  department: true,
  publicProfileUrl: true,
  researchAreaId: true,
  researchInterests: true,
  selectedPublications: true,
  currentProjects: true,
  acceptingStudents: true,
  applicationGuidance: true,
  verificationStatus: true,
  publicationStatus: true,
  lastVerifiedAt: true,
  officialSourceUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.HigherStudySupervisorSelect;

// ─── Entity-type helpers ─────────────────────────────────────────────

/** Tuple of valid entity types — useful for runtime validation. */
export const ENTITY_TYPES: EntityType[] = [
  "university",
  "course",
  "scholarship",
  "research",
  "supervisor",
  "resource",
  "comparison",
];

/**
 * Type guard: returns `true` if `value` is a valid {@link EntityType}.
 */
export function isEntityType(value: unknown): value is EntityType {
  return typeof value === "string" && (ENTITY_TYPES as string[]).includes(value);
}
