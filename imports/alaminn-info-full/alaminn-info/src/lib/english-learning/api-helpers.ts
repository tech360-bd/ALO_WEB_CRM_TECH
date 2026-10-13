/**
 * English Learning API helpers — shared request/response utilities for the
 * /api/v1/english-learning/* route family.
 * --------------------------------------------------------------------
 * Mirrors `src/lib/higher-study/api-helpers.ts` but for the English
 * Learning entity set. Provides:
 *  - `jsonResponse()` — standard `{ success, message, data, meta, errors }` envelope.
 *  - `parsePaginationParams()` — safe ?page, ?limit, ?sort, ?order parser.
 *  - `paginationSkipTake()` + `buildPaginationMeta()` — paired helpers.
 *  - `safeString()` + `slugify()` — input sanitisation.
 *  - `signReferralToken()` / `verifyReferralToken()` — HMAC-SHA256 tokens.
 *  - `generateReferralCode()` — short, URL-safe alphanumeric codes.
 *  - `getDeviceCategory()` + `hashIp()` — privacy-friendly client attribution.
 *  - `publicCourseSelect`, `publicLessonSelect`, `publicTestSelect`,
 *    `publicTutorSelect`, `publicResourceSelect` — Prisma whitelists that
 *    exclude internal audit columns from public API responses.
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
} from "@/lib/english-learning/constants";
import type {
  ApiResponse,
  PaginationParams,
  ReferralTokenPayload,
} from "@/lib/english-learning/types";

// ─── Standard JSON envelope ──────────────────────────────────────────

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

export function paginationSkipTake(params: PaginationParams): {
  skip: number;
  take: number;
} {
  return { skip: (params.page - 1) * params.limit, take: params.limit };
}

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

// ─── String helpers ──────────────────────────────────────────────────

export function safeString(s: string | null | undefined): string {
  if (s === null || s === undefined) return "";
  const trimmed = String(s).trim().replace(/\s+/g, " ");
  if (trimmed.length <= MAX_SAFE_STRING_LENGTH) return trimmed;
  return trimmed.slice(0, MAX_SAFE_STRING_LENGTH);
}

export function slugify(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Boolean / number parsing helpers ────────────────────────────────

export function boolParam(v: string | null): boolean | undefined {
  if (v === null) return undefined;
  const s = v.toLowerCase();
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return undefined;
}

export function numParam(v: string | null): number | undefined {
  if (v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

// ─── Referral token helpers ──────────────────────────────────────────

export function generateReferralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
  const bytes = crypto.randomBytes(REFERRAL_CODE_LENGTH);
  let out = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

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

export function getDeviceCategory(
  userAgent: string | null | undefined,
): "mobile" | "tablet" | "desktop" {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    return "tablet";
  }
  if (/mobi|iphone|ipod|android.*mobile|blackberry|opera mini/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

export function hashIp(ip: string | null | undefined, secret = ""): string {
  const clean = safeString(ip) || "unknown";
  return crypto
    .createHash("sha256")
    .update(`${clean}:${secret}`)
    .digest("hex")
    .slice(0, 16);
}

// ─── Public Prisma select objects ────────────────────────────────────

export const publicCourseSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  description: true,
  level: true,
  durationWeeks: true,
  hoursPerWeek: true,
  priceUsd: true,
  currency: true,
  isFeatured: true,
  isPublished: true,
  verificationStatus: true,
  publicationStatus: true,
  lastVerifiedAt: true,
  officialSourceUrl: true,
  metaTitle: true,
  metaDescription: true,
  keywords: true,
  tags: true,
  heroImageUrl: true,
  introVideoUrl: true,
  syllabus: true,
  prerequisites: true,
  targetAudience: true,
  learningOutcomes: true,
  certificationType: true,
  passScore: true,
  enrollmentCount: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EnglishLearningCourseSelect;

export const publicLessonSelect = {
  id: true,
  courseId: true,
  slug: true,
  title: true,
  summary: true,
  content: true,
  orderIndex: true,
  durationMinutes: true,
  lessonType: true,
  videoUrl: true,
  transcript: true,
  isFreePreview: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EnglishLearningLessonSelect;

export const publicTestSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  testType: true,
  level: true,
  durationMinutes: true,
  totalQuestions: true,
  passingScore: true,
  isPublished: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EnglishLearningPracticeTestSelect;

export const publicTutorSelect = {
  id: true,
  slug: true,
  name: true,
  bio: true,
  avatarUrl: true,
  specialties: true,
  qualifications: true,
  yearsExperience: true,
  hourlyRateUsd: true,
  currency: true,
  rating: true,
  reviewCount: true,
  isAvailable: true,
  isPublished: true,
  verificationStatus: true,
  lastVerifiedAt: true,
  officialProfileUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EnglishLearningTutorSelect;

export const publicResourceSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  description: true,
  resourceType: true,
  url: true,
  durationMinutes: true,
  readingTimeMinutes: true,
  level: true,
  isPublished: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
  authorName: true,
  sourceName: true,
} satisfies Prisma.EnglishLearningResourceSelect;

// ─── Where-clause search helper ──────────────────────────────────────

/**
 * Build a Prisma `where` clause for a free-text `q` query across the
 * given fields. Returns `{}` if `q` is empty.
 */
export function searchWhere(
  q: string | null,
  fields: string[],
): Record<string, unknown> {
  if (!q) return {};
  return {
    OR: fields.map((f) => ({ [f]: { contains: q } })),
  };
}
