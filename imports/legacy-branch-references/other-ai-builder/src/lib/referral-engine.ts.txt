/**
 * Referral Engine
 *
 * Manages the student referral lifecycle:
 *   1. generateReferralCode      — AEFR-XXXXXX format
 *   2. createReferral            — issue a referral code to a student
 *   3. trackReferralUsage        — record when a code is used
 *   4. getReferralStats          — aggregate per-student referral metrics
 *
 * Schema dependency: uses the existing Referral model (referrerStudentId,
 * referralCode unique, status PENDING/QUALIFIED/CONSULTATION_DONE/
 * APPLICATION_SUBMITTED/ENROLLED/REWARDED).
 */

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ─── Constants ────────────────────────────────────────────────────

const REFERRAL_CODE_PREFIX = "AEFR";
const REFERRAL_CODE_LENGTH = 6; // 6-char alphanumeric (no ambiguous chars)
const REFERRAL_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I,O,0,1
const MAX_P2002_RETRIES = 5;

// ─── Types ────────────────────────────────────────────────────────

export interface CreateReferralInput {
  campaign?: string;
  source?: string; // WHATSAPP, MESSENGER, LINK, DIRECT
  rewardOffered?: string; // description of any reward (NOT a monetary value)
}

export interface TrackReferralUsageInput {
  referredName?: string;
  referredPhone?: string;
  referredEmail?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  pending: number;
  qualified: number;
  consultationDone: number;
  applicationSubmitted: number;
  enrolled: number;
  rewarded: number;
  conversionRate: number;
}

// ─── generateReferralCode ────────────────────────────────────────

/**
 * Generate a unique referral code in the AEFR-XXXXXX format.
 *
 * Uniqueness is enforced at the DB layer via @unique on Referral.referralCode.
 * Callers must handle P2002 collisions (createReferral does this internally).
 */
export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += REFERRAL_CODE_ALPHABET[Math.floor(Math.random() * REFERRAL_CODE_ALPHABET.length)];
  }
  return `${REFERRAL_CODE_PREFIX}-${code}`;
}

// ─── createReferral ──────────────────────────────────────────────

/**
 * Issue a new referral code for a student.
 *
 * The student (referrer) must already exist in the canonical Student table.
 * The referral code is unique; P2002 collisions are retried up to 5 times.
 */
export async function createReferral(
  referrerStudentId: string,
  input: CreateReferralInput = {}
): Promise<{ referralId: string; referralCode: string }> {
  if (!referrerStudentId) {
    throw new Error("createReferral: referrerStudentId is required");
  }

  const student = await db.student.findUnique({ where: { id: referrerStudentId } });
  if (!student) {
    throw new Error("createReferral: referrer student not found");
  }

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < MAX_P2002_RETRIES) {
    attempt++;
    const referralCode = generateReferralCode();
    try {
      const referral = await db.referral.create({
        data: {
          referralCode,
          referrerStudentId,
          referredName: null,
          referredPhone: null,
          referredEmail: null,
          status: "PENDING",
          campaign: input.campaign ?? null,
          source: input.source ?? null,
          rewardOffered: input.rewardOffered ?? null,
          rewardStatus: input.rewardOffered ? "PENDING" : null,
        },
      });
      return { referralId: referral.id, referralCode: referral.referralCode };
    } catch (err: unknown) {
      lastError = err;
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        continue;
      }
      throw err;
    }
  }

  throw new Error(
    `createReferral: failed after ${MAX_P2002_RETRIES} attempts. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

// ─── trackReferralUsage ──────────────────────────────────────────

/**
 * Record that a referral code was used (a new lead came in via the code).
 *
 * Steps:
 *   1. Look up the Referral by referralCode.
 *   2. If already linked to a Lead (referredLeadId set), return that lead ID.
 *   3. Otherwise create a new Lead from the referred person's contact info,
 *      link it to the Referral, set source="PARTNER_REFERRAL" + sourceDetail=code,
 *      and bump status to "QUALIFIED".
 *
 * Returns the (possibly newly created) Lead ID.
 */
export async function trackReferralUsage(
  referralCode: string,
  input: TrackReferralUsageInput = {}
): Promise<{ referralId: string; leadId: string; createdNewLead: boolean }> {
  if (!referralCode) throw new Error("trackReferralUsage: referralCode is required");

  const referral = await db.referral.findUnique({ where: { referralCode } });
  if (!referral) throw new Error(`trackReferralUsage: referral code ${referralCode} not found`);

  // Already linked?
  if (referral.referredLeadId) {
    return { referralId: referral.id, leadId: referral.referredLeadId, createdNewLead: false };
  }

  // Need at least one identifier for a new Lead
  const phone = input.referredPhone?.trim() || "N/A";
  const name = input.referredName?.trim() || "Referred by " + referral.referralCode;
  const email = input.referredEmail?.trim() || null;

  const lead = await db.lead.create({
    data: {
      leadId: `ALO-L-${Date.now().toString().slice(-6)}`,
      fullName: name,
      email,
      phone,
      source: "PARTNER_REFERRAL",
      sourceDetail: `Referral code: ${referralCode}`,
      status: "NEW",
      notes: `Referred by student ${referral.referrerStudentId} via code ${referralCode}`,
    },
  });

  await db.referral.update({
    where: { id: referral.id },
    data: {
      referredLeadId: lead.id,
      referredName: input.referredName ?? null,
      referredPhone: input.referredPhone ?? null,
      referredEmail: input.referredEmail ?? null,
      status: "QUALIFIED",
      qualifiedAt: new Date(),
    },
  });

  return { referralId: referral.id, leadId: lead.id, createdNewLead: true };
}

// ─── getReferralStats ────────────────────────────────────────────

/**
 * Aggregate referral metrics for a single student (the referrer).
 */
export async function getReferralStats(studentId: string): Promise<ReferralStats> {
  if (!studentId) throw new Error("getReferralStats: studentId is required");

  const where = { referrerStudentId: studentId };
  const [
    totalReferrals,
    pending,
    qualified,
    consultationDone,
    applicationSubmitted,
    enrolled,
    rewarded,
  ] = await Promise.all([
    db.referral.count({ where }),
    db.referral.count({ where: { ...where, status: "PENDING" } }),
    db.referral.count({ where: { ...where, status: "QUALIFIED" } }),
    db.referral.count({ where: { ...where, status: "CONSULTATION_DONE" } }),
    db.referral.count({ where: { ...where, status: "APPLICATION_SUBMITTED" } }),
    db.referral.count({ where: { ...where, status: "ENROLLED" } }),
    db.referral.count({ where: { ...where, status: "REWARDED" } }),
  ]);

  const conversionRate = totalReferrals > 0 ? Math.round((enrolled / totalReferrals) * 100) : 0;

  return {
    totalReferrals,
    pending,
    qualified,
    consultationDone,
    applicationSubmitted,
    enrolled,
    rewarded,
    conversionRate,
  };
}
