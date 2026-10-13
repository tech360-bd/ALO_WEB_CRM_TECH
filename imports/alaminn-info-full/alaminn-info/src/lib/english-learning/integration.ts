/**
 * English Learning — ALO Education referral integration.
 * --------------------------------------------------------------------
 * Mirrors `src/lib/higher-study/integration.ts`. The English Learning
 * platform routes warm student leads (course packages, tutor bookings,
 * mock-test bundles) to ALO Education for actual enrollment + payment
 * processing. This module owns:
 *
 *  1. Building the verified referral URL — only safe public context is
 *     attached as query params. NEVER email, phone, name, address or
 *     any other PII (those are collected by ALO Education after the
 *     student consents on their own domain).
 *  2. Validating the referral context object — throws on any forbidden
 *     private field so a coding mistake can't leak PII in a URL.
 *  3. Persisting a referral audit record in the
 *     `EnglishLearningReferral` table with consent tracking, IP hash,
 *     device category, signed token and source entity reference.
 *  4. Marking the referral as `transferred` / `completed` / `failed`.
 *
 * The signed referral token (built by `signReferralToken` in
 * `api-helpers.ts`) is the cryptographic link between the Alaminn.info
 * audit row and the ALO Education session — both sides verify it
 * against a shared secret (`ENGLISH_LEARNING_REFERRAL_SECRET` env var
 * or a dev fallback).
 */

import {
  ALO_EDUCATION_ENGLISH_REFERRAL_URL,
  REFERRAL_TOKEN_TTL_MS,
  REFERRAL_SOURCES,
} from "@/lib/english-learning/constants";
import {
  generateReferralCode,
  signReferralToken,
} from "@/lib/english-learning/api-helpers";
import type {
  CreateReferralOptions,
  Referral,
  ReferralContext,
  ReferralType,
} from "@/lib/english-learning/types";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// ─── Referral URL builder ────────────────────────────────────────────

export interface AloEducationReferralUrlOptions {
  referralType: ReferralType;
  referralCode: string;
  referralToken?: string;
  source?: string;
  context?: ReferralContext;
  campaignCode?: string;
  baseUrl?: string;
}

/** Allowed keys on the public referral context (PII forbidden). */
const ALLOWED_CONTEXT_KEYS: ReadonlyArray<keyof ReferralContext> = [
  "courseSlug",
  "tutorSlug",
  "testSlug",
  "level",
  "campaignCode",
];

/** Forbidden keys whose presence will throw in validateReferralContext. */
const FORBIDDEN_KEYS = new Set([
  "email",
  "phone",
  "whatsapp",
  "name",
  "fullName",
  "firstName",
  "lastName",
  "address",
  "street",
  "city",
  "postcode",
  "zip",
  "dob",
  "dateOfBirth",
  "nationalId",
  "passport",
  "passportNumber",
  "gender",
  "salary",
  "income",
  "password",
  "token",
  "sessionToken",
  "accessToken",
  "refreshToken",
  "ssn",
  "nationalInsuranceNumber",
  "bankAccount",
  "cardNumber",
  "cvv",
]);

export function buildAloEducationReferralUrl(
  opts: AloEducationReferralUrlOptions,
): string {
  const baseUrl = opts.baseUrl || ALO_EDUCATION_ENGLISH_REFERRAL_URL;
  const ctx = opts.context ?? {};

  // Defensive: validate even if the caller says it's already safe.
  validateReferralContext(ctx);

  const params = new URLSearchParams();
  params.set("source", opts.source || "ALAMINN_ENGLISH_LEARNING");
  params.set("referralType", opts.referralType);
  params.set("referralCode", opts.referralCode);
  if (opts.referralToken) params.set("referralToken", opts.referralToken);

  if (ctx.courseSlug) params.set("courseSlug", ctx.courseSlug);
  if (ctx.tutorSlug) params.set("tutorSlug", ctx.tutorSlug);
  if (ctx.testSlug) params.set("testSlug", ctx.testSlug);
  if (ctx.level) params.set("level", ctx.level);
  if (ctx.campaignCode || opts.campaignCode) {
    params.set("campaignCode", (ctx.campaignCode || opts.campaignCode)!);
  }

  return `${baseUrl}?${params.toString()}`;
}

// ─── Context validation ──────────────────────────────────────────────

export function validateReferralContext(ctx: ReferralContext): void {
  if (!ctx || typeof ctx !== "object") return;

  const keys = Object.keys(ctx);
  for (const key of keys) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new Error(
        `Referral context contains forbidden PII field: "${key}". Refusing to attach to URL.`,
      );
    }
    if (!ALLOWED_CONTEXT_KEYS.includes(key as keyof ReferralContext)) {
      throw new Error(
        `Referral context contains unknown field: "${key}". Only public context slugs are allowed.`,
      );
    }
  }

  for (const key of keys) {
    const v = (ctx as Record<string, unknown>)[key];
    if (v !== undefined && v !== null && typeof v !== "string") {
      throw new Error(
        `Referral context field "${key}" must be a string, got ${typeof v}.`,
      );
    }
  }
}

// ─── Referral record persistence ─────────────────────────────────────

/**
 * Create an `EnglishLearningReferral` DB record representing one handoff
 * from Alaminn.info English Learning to ALO Education.
 *
 * - Generates a fresh 12-char referral code.
 * - Signs a referral token (HMAC-SHA256) valid for 24 hours.
 * - Stores the public context (validated, no PII), consent tracking,
 *   IP hash, source entity reference.
 *
 * Returns the persisted referral row plus the signed referral token so
 * the caller can include it in the redirect URL.
 */
export async function createReferralRecord(
  opts: CreateReferralOptions,
): Promise<{ referral: Referral; referralToken: string }> {
  const ctx = opts.context ?? {};
  validateReferralContext(ctx);

  // Resolve the referral source label (default to first source for the type).
  const source =
    opts.source ||
    REFERRAL_SOURCES.find((r) => r.referralType === opts.referralType)?.value ||
    "ALAMINN_ENGLISH_LEARNING";

  // Build the ALO Education target URL.
  const referralCode = generateReferralCode();
  const targetUrl = buildAloEducationReferralUrl({
    referralType: opts.referralType,
    referralCode,
    source,
    context: ctx,
    campaignCode: opts.campaignCode,
  });

  // Sign the referral token now — both sides verify with the shared secret.
  const secret =
    process.env.ENGLISH_LEARNING_REFERRAL_SECRET || "alaminn-el-dev";
  const referralToken = signReferralToken(
    { referralCode, referralType: opts.referralType },
    secret,
  );

  const now = new Date();

  const referral = (await db.englishLearningReferral.create({
    data: {
      referralCode,
      referralType: opts.referralType,
      sourceEntityId: opts.sourceEntityId || null,
      sourceEntityType: opts.sourceEntityType || null,
      targetUrl,
      status: "created",
      ipHash: opts.ipHash || null,
      userAgent: opts.userAgent ? opts.userAgent.slice(0, 500) : null,
      notes: buildNotesObject(opts, ctx, source, now) as Prisma.InputJsonValue,
    },
  })) as unknown as Referral;

  return { referral, referralToken };
}

// ─── Status transitions ──────────────────────────────────────────────

export async function markReferralTransferred(
  referralCode: string,
): Promise<Referral | null> {
  const updated = await db.englishLearningReferral.updateMany({
    where: { referralCode },
    data: { status: "transferred" },
  });
  if (updated.count === 0) return null;
  const row = await db.englishLearningReferral.findUnique({
    where: { referralCode },
  });
  return (row as unknown as Referral) || null;
}

export async function markReferralCompleted(
  referralCode: string,
): Promise<Referral | null> {
  const updated = await db.englishLearningReferral.updateMany({
    where: { referralCode },
    data: { status: "completed", completedAt: new Date() },
  });
  if (updated.count === 0) return null;
  const row = await db.englishLearningReferral.findUnique({
    where: { referralCode },
  });
  return (row as unknown as Referral) || null;
}

export async function markReferralFailed(
  referralCode: string,
  failureReason: string,
): Promise<Referral | null> {
  const updated = await db.englishLearningReferral.updateMany({
    where: { referralCode },
    data: { status: "failed" },
  });
  if (updated.count === 0) return null;
  // Record the failure reason inside the notes JSON (no separate column).
  const existing = await db.englishLearningReferral.findUnique({
    where: { referralCode },
  });
  if (existing) {
    await db.englishLearningReferral.update({
      where: { referralCode },
      data: {
        notes: {
          ...(existing.notes as Record<string, unknown> | null),
          failureReason: failureReason.slice(0, 500),
        },
      },
    });
  }
  return (existing as unknown as Referral) || null;
}

// ─── Expiry check ────────────────────────────────────────────────────

/**
 * Returns `true` if the referral has expired (i.e. created more than
 * REFERRAL_TOKEN_TTL_MS ago and hasn't reached a terminal status).
 */
export function isReferralExpired(referral: Referral): boolean {
  if (
    referral.status === "completed" ||
    referral.status === "failed" ||
    referral.status === "expired"
  ) {
    return true;
  }
  return referral.createdAt.getTime() + REFERRAL_TOKEN_TTL_MS < Date.now();
}

// ─── Lookup ──────────────────────────────────────────────────────────

export async function findReferralByCode(
  referralCode: string,
): Promise<Referral | null> {
  const row = await db.englishLearningReferral.findUnique({
    where: { referralCode },
  });
  return (row as unknown as Referral) || null;
}

// ─── JSON helper ─────────────────────────────────────────────────────

/**
 * Build the JSON `notes` object for a referral record. The value is
 * passed through `JSON.parse(JSON.stringify(...))` to strip any class
 * instances / functions and produce a plain JSON-compatible value that
 * Prisma's Json column accepts.
 */
function buildNotesObject(
  opts: CreateReferralOptions,
  ctx: ReferralContext,
  source: string,
  now: Date,
): Record<string, unknown> {
  const obj = opts.consentGiven
    ? {
        consentGiven: true,
        consentVersion:
          opts.consentVersion || "english-learning-consent-v1",
        consentTimestamp: now.toISOString(),
        context: ctx,
        source,
      }
    : { source, context: ctx };
  return JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
}

/**
 * Sweep referrals older than 24h that haven't transitioned out of
 * `created` / `transferred`. Returns the number of rows marked expired.
 */
export async function expireStaleReferrals(): Promise<number> {
  const cutoff = new Date(Date.now() - REFERRAL_TOKEN_TTL_MS);
  const result = await db.englishLearningReferral.updateMany({
    where: {
      status: { in: ["created", "transferred"] },
      createdAt: { lt: cutoff },
    },
    data: { status: "expired" },
  });
  return result.count;
}
