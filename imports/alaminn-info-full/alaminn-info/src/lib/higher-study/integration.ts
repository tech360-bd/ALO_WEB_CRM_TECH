/**
 * Higher Study — ALO Education referral integration.
 * --------------------------------------------------------------------
 * The Higher Study platform on Alaminn.info routes warm student leads
 * to ALO Education (https://aloeducation.com) for actual application
 * processing. This module owns:
 *
 *  1. Building the verified referral URL — only safe public context is
 *     attached as query params. NEVER email, phone, name, address or
 *     any other PII (those are collected by ALO Education after the
 *     student consents on their own domain).
 *  2. Validating the referral context object — throws on any forbidden
 *     private field so a coding mistake can't leak PII in a URL.
 *  3. Persisting a referral audit record in the `HigherStudyReferral`
 *     table with consent tracking, IP hash, device category and a 24h
 *     expiry. Every handoff is auditable end-to-end.
 *  4. Marking the referral as `transferred` / `completed` when ALO
 *     Education reports back (server-to-server callback).
 *  5. Checking expiry (referrals are valid for 24 hours, after which
 *     they are marked `expired` and a new referral must be created).
 *
 * The signed referral token (built by `signReferralToken` in
 * `api-helpers.ts`) is the cryptographic link between the Alaminn.info
 * audit row and the ALO Education session — both sides verify it
 * against a shared secret.
 */

import {
  ALO_EDUCATION_REGISTER_URL,
  REFERRAL_TOKEN_TTL_MS,
  REFERRAL_SOURCE_MAP,
} from "@/lib/higher-study/constants";
import {
  generateReferralCode,
  signReferralToken,
} from "@/lib/higher-study/api-helpers";
import type {
  CreateReferralOptions,
  Referral,
  ReferralContext,
  ReferralType,
} from "@/lib/higher-study/types";
import { db } from "@/lib/db";

// ─── Referral URL builder ────────────────────────────────────────────

/** Options accepted by {@link buildAloEducationReferralUrl}. */
export interface AloEducationReferralUrlOptions {
  /** Referral type — drives which ALO Education form is shown. */
  referralType: ReferralType;
  /** Signed referral code (12-char) and signed token (verifiable by ALO). */
  referralCode: string;
  /** Signed referral token (HMAC-SHA256). */
  referralToken?: string;
  /** CRM attribution source (one of REFERRAL_SOURCES). */
  source?: string;
  /** Safe public context (validated by {@link validateReferralContext}). */
  context?: ReferralContext;
  /** Optional marketing campaign code. */
  campaignCode?: string;
  /** Override the destination URL (defaults to ALO_EDUCATION_REGISTER_URL). */
  baseUrl?: string;
}

/** Allowed keys on the public referral context (PII forbidden). */
const ALLOWED_CONTEXT_KEYS: ReadonlyArray<keyof ReferralContext> = [
  "countrySlug",
  "universitySlug",
  "courseSlug",
  "scholarshipSlug",
  "researchSlug",
  "supervisorSlug",
  "studyLevel",
  "intake",
  "campaignCode",
];

/** Forbidden keys whose presence will throw in {@link validateReferralContext}. */
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

/**
 * Build the verified ALO Education referral URL with safe query params.
 *
 * The URL points at {@link ALO_EDUCATION_REGISTER_URL} by default and
 * carries only public context: country / university / course / scholarship
 * / research / supervisor slugs, study level, intake, campaign code, the
 * short referral code and the signed referral token.
 *
 * NEVER pass email, phone, name or any PII — those are collected by ALO
 * Education after the student lands on their domain and consents there.
 * Use {@link validateReferralContext} first if the context came from an
 * untrusted source.
 */
export function buildAloEducationReferralUrl(
  opts: AloEducationReferralUrlOptions,
): string {
  const baseUrl = opts.baseUrl || ALO_EDUCATION_REGISTER_URL;
  const ctx = opts.context ?? {};

  // Defensive: validate even if the caller says it's already safe.
  validateReferralContext(ctx);

  const params = new URLSearchParams();
  params.set("source", opts.source || "ALAMINN_HIGHER_STUDY");
  params.set("referralType", opts.referralType);
  params.set("referralCode", opts.referralCode);
  if (opts.referralToken) params.set("referralToken", opts.referralToken);

  if (ctx.countrySlug) params.set("countrySlug", ctx.countrySlug);
  if (ctx.universitySlug) params.set("universitySlug", ctx.universitySlug);
  if (ctx.courseSlug) params.set("courseSlug", ctx.courseSlug);
  if (ctx.scholarshipSlug) params.set("scholarshipSlug", ctx.scholarshipSlug);
  if (ctx.researchSlug) params.set("researchSlug", ctx.researchSlug);
  if (ctx.supervisorSlug) params.set("supervisorSlug", ctx.supervisorSlug);
  if (ctx.studyLevel) params.set("studyLevel", ctx.studyLevel);
  if (ctx.intake) params.set("intake", ctx.intake);
  if (ctx.campaignCode || opts.campaignCode) {
    params.set("campaignCode", (ctx.campaignCode || opts.campaignCode)!);
  }

  return `${baseUrl}?${params.toString()}`;
}

// ─── Context validation ──────────────────────────────────────────────

/**
 * Validate that a referral context object contains only safe public
 * fields. Throws an `Error` with a descriptive message if any forbidden
 * (PII-bearing) key is present, or if an unknown key is encountered.
 *
 * This is a defensive guard — even if a coding mistake passes user
 * input straight into the context, this function will fail loudly
 * instead of leaking PII through a URL (which would be logged on
 * multiple servers and visible in browser history).
 */
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

  // Strings only — no nested objects that could smuggle extra data.
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

/** Options accepted by {@link createReferralRecord}. */

/**
 * Create a `HigherStudyReferral` DB record representing one handoff
 * from Alaminn.info Higher Study to ALO Education.
 *
 * - Generates a fresh 12-char referral code.
 * - Signs a referral token (HMAC-SHA256) valid for 24 hours.
 * - Stores the public context (validated, no PII), consent tracking,
 *   IP hash and device category.
 * - Sets `expiresAt = now + 24h` so expired referrals can be swept by
 *   a background job.
 *
 * Returns the persisted referral row plus the signed referral token so
 * the caller can include it in the redirect URL.
 */
export async function createReferralRecord(
  opts: CreateReferralOptions,
): Promise<{ referral: Referral; referralToken: string }> {
  const ctx = opts.context ?? {};
  validateReferralContext(ctx);

  // Resolve the referral source label (default to the hub source).
  const source =
    opts.source ||
    REFERRAL_SOURCE_MAP.ALAMINN_HIGHER_STUDY.value;

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
  const secret = process.env.HIGHER_STUDY_REFERRAL_SECRET || "alaminn-hs-dev";
  const referralToken = signReferralToken(
    { referralCode, referralType: opts.referralType },
    secret,
  );

  const now = new Date();
  const expiresAt = new Date(now.getTime() + REFERRAL_TOKEN_TTL_MS);

  const referral = (await db.higherStudyReferral.create({
    data: {
      referralCode,
      source,
      referralType: opts.referralType,
      targetUrl,
      countrySlug: ctx.countrySlug || null,
      universitySlug: ctx.universitySlug || null,
      courseSlug: ctx.courseSlug || null,
      scholarshipSlug: ctx.scholarshipSlug || null,
      researchSlug: ctx.researchSlug || null,
      supervisorSlug: ctx.supervisorSlug || null,
      studyLevel: ctx.studyLevel || null,
      intake: ctx.intake || null,
      campaignCode: ctx.campaignCode || opts.campaignCode || null,
      consentGiven: opts.consentGiven,
      consentVersion: opts.consentVersion || null,
      consentTimestamp: opts.consentGiven ? now : null,
      status: "created",
      expiresAt,
      ipHash: opts.ipHash || null,
      deviceCategory: opts.deviceCategory || null,
    },
  })) as unknown as Referral;

  return { referral, referralToken };
}

// ─── Status transitions ──────────────────────────────────────────────

/**
 * Mark a referral as `transferred` — i.e. the student was successfully
 * redirected to ALO Education. Sets `transferredAt` to `now`. Returns
 * the updated row, or `null` if the referral code was not found.
 */
export async function markReferralTransferred(
  referralCode: string,
): Promise<Referral | null> {
  const updated = await db.higherStudyReferral.updateMany({
    where: { referralCode },
    data: { status: "transferred", transferredAt: new Date() },
  });
  if (updated.count === 0) return null;
  const row = await db.higherStudyReferral.findUnique({
    where: { referralCode },
  });
  return (row as unknown as Referral) || null;
}

/**
 * Mark a referral as `completed` — i.e. ALO Education reports the
 * student has successfully registered and started an application. Sets
 * `completedAt` to `now`. Returns the updated row, or `null` if the
 * referral code was not found.
 */
export async function markReferralCompleted(
  referralCode: string,
): Promise<Referral | null> {
  const updated = await db.higherStudyReferral.updateMany({
    where: { referralCode },
    data: { status: "completed", completedAt: new Date() },
  });
  if (updated.count === 0) return null;
  const row = await db.higherStudyReferral.findUnique({
    where: { referralCode },
  });
  return (row as unknown as Referral) || null;
}

/**
 * Mark a referral as `failed` with a reason. Used by the server-to-server
 * callback when ALO Education reports that the handoff could not be
 * completed (e.g. invalid token, expired, server error). Returns the
 * updated row, or `null` if the referral code was not found.
 */
export async function markReferralFailed(
  referralCode: string,
  failureReason: string,
): Promise<Referral | null> {
  const updated = await db.higherStudyReferral.updateMany({
    where: { referralCode },
    data: { status: "failed", failureReason: failureReason.slice(0, 500) },
  });
  if (updated.count === 0) return null;
  const row = await db.higherStudyReferral.findUnique({
    where: { referralCode },
  });
  return (row as unknown as Referral) || null;
}

/**
 * Mark a referral as `expired` — called by the background sweeper job
 * when `expiresAt` is in the past and the referral has not transitioned
 * to `transferred` / `completed`. Returns the number of rows affected.
 */
export async function expireStaleReferrals(): Promise<number> {
  const result = await db.higherStudyReferral.updateMany({
    where: {
      status: { in: ["created", "transferred"] },
      expiresAt: { lt: new Date() },
    },
    data: { status: "expired" },
  });
  return result.count;
}

// ─── Expiry check ────────────────────────────────────────────────────

/**
 * Returns `true` if the referral has expired (i.e. `expiresAt` is in
 * the past). A referral that has already transitioned to a terminal
 * status (`completed` / `failed` / `expired`) is also treated as
 * expired so the caller can short-circuit further use.
 */
export function isReferralExpired(referral: Referral): boolean {
  if (
    referral.status === "completed" ||
    referral.status === "failed" ||
    referral.status === "expired"
  ) {
    return true;
  }
  if (!referral.expiresAt) return false;
  return referral.expiresAt.getTime() < Date.now();
}

// ─── Lookup ──────────────────────────────────────────────────────────

/**
 * Look up a referral by its referral code. Returns `null` if not found.
 * Useful for the server-to-server callback endpoint when ALO Education
 * posts back the outcome.
 */
export async function findReferralByCode(
  referralCode: string,
): Promise<Referral | null> {
  const row = await db.higherStudyReferral.findUnique({
    where: { referralCode },
  });
  return (row as unknown as Referral) || null;
}
