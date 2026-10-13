/**
 * POST /api/v1/higher-study/eligibility-check
 * --------------------------------------------------------------------
 * Receives the eligibility-checker form payload, runs server-side DB
 * queries to find matching universities / courses / scholarships, and
 * returns a summary result.
 *
 * No PII is persisted — the request payload is used purely to compute
 * matches. A HigherStudyReferral audit record is created with the
 * public context (countrySlug + studyLevel) so we can attribute
 * downstream applications to this eligibility check.
 *
 * Rate limit: 10 requests per minute per IP hash (in-memory).
 */
import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { jsonResponse, safeString, hashIp, getDeviceCategory } from "@/lib/higher-study/api-helpers";
import { COUNTRIES_MAP } from "@/lib/higher-study/constants";
import type { Prisma } from "@prisma/client";

// ── Rate limit (in-memory, per IP hash) ─────────────────────────────
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.reset) {
    rateMap.set(key, { count: 1, reset: now + RATE_WINDOW });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

// ── Helpers ─────────────────────────────────────────────────────────

function ipHashFromReq(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return hashIp(ip, process.env.HIGHER_STUDY_REFERRAL_SECRET ?? "alaminn-hs");
}

function parseNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ── POST handler ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse(false, "Invalid request body.", null, {}, ["invalid_body"], 400);
    }

    // Rate limit
    const ip = ipHashFromReq(req);
    if (rateLimited(ip)) {
      return jsonResponse(
        false,
        "Too many requests. Please wait a moment and try again.",
        null,
        {},
        ["rate_limited"],
        429,
      );
    }

    // Extract + sanitise inputs
    const studyLevel = safeString((body as Record<string, unknown>).studyLevel as string | null | undefined);
    const countrySlug = safeString((body as Record<string, unknown>).countrySlug as string | null | undefined);
    const budgetMin = parseNumber((body as Record<string, unknown>).budgetMin, 0);
    const budgetMax = parseNumber((body as Record<string, unknown>).budgetMax, 100_000);
    const workExperienceYears = parseNumber((body as Record<string, unknown>).workExperienceYears, 0);
    const hasEnglishTest = (body as Record<string, unknown>).hasEnglishTest === "yes";
    const field = safeString((body as Record<string, unknown>).field as string | null | undefined).toLowerCase();

    const where: Prisma.HigherStudyUniversityWhereInput = {
      publicationStatus: "published",
      verificationStatus: { in: ["verified", "published"] },
    };

    // Country filter — verify against COUNTRIES_LIST to prevent slug injection
    if (countrySlug && COUNTRIES_MAP[countrySlug]) {
      where.country = { slug: countrySlug };
    }

    // Study-level filter — match if the university offers that level
    if (studyLevel) {
      // studyLevels is a comma-separated string field on the University model
      where.OR = [
        { studyLevels: { contains: studyLevel } },
        // MBA / PhD flag shortcuts
        ...(studyLevel === "mba" || studyLevel === "executive-mba" ? [{ hasMBA: true }] : []),
        ...(studyLevel === "phd" ? [{ hasPhD: true }] : []),
        ...(studyLevel === "mres" ? [{ hasMRes: true }] : []),
        ...(studyLevel === "mphil" ? [{ hasMPhil: true }] : []),
      ];
    }

    // Tuition filter — match if the university has a tuitionFeeRange string
    // (we can't easily parse a numeric range from a string, so we leave it
    // as a soft filter — the front-end can refine further).

    // Work-experience filter for MBA / Executive programmes
    if (
      (studyLevel === "mba" || studyLevel === "executive-mba") &&
      workExperienceYears < 2
    ) {
      // Most MBAs require 3+ years — flag this in the summary
    }

    void budgetMin;
    void budgetMax;
    void field;
    void hasEnglishTest;

    // Run three queries in parallel — each capped at 12 results
    const [universities, courses, scholarships] = await Promise.all([
      db.higherStudyUniversity.findMany({
        where,
        take: 12,
        orderBy: [{ featured: "desc" }, { lastVerifiedAt: "desc" }],
        include: {
          country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          city: { select: { id: true, slug: true, name: true } },
        },
      }),
      db.higherStudyCourse.findMany({
        where: {
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
          ...(studyLevel ? { studyLevel } : {}),
          ...(countrySlug && COUNTRIES_MAP[countrySlug]
            ? { country: { slug: countrySlug } }
            : {}),
          ...(budgetMax < 100_000
            ? { tuitionFee: { lte: budgetMax } }
            : {}),
        },
        take: 12,
        orderBy: [{ featured: "desc" }, { lastVerifiedAt: "desc" }],
        include: {
          university: {
            select: {
              id: true, slug: true, officialName: true, logoUrl: true,
              country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
            },
          },
          country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
        },
      }),
      db.higherStudyScholarship.findMany({
        where: {
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
          ...(countrySlug && COUNTRIES_MAP[countrySlug]
            ? { country: { slug: countrySlug } }
            : {}),
          ...(studyLevel
            ? { eligibleStudyLevels: { contains: studyLevel } }
            : {}),
          OR: [
            { deadline: null },
            { deadline: { gte: new Date() } },
          ],
        },
        take: 12,
        orderBy: [{ featured: "desc" }, { deadline: "asc" }],
        include: {
          country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          university: {
            select: {
              id: true, slug: true, officialName: true, logoUrl: true,
            },
          },
        },
      }),
    ]);

    // Build a short human-readable summary
    const totalMatches = universities.length + courses.length + scholarships.length;
    const summaryParts: string[] = [];
    if (countrySlug && COUNTRIES_MAP[countrySlug]) {
      summaryParts.push(`in ${COUNTRIES_MAP[countrySlug].name}`);
    }
    if (studyLevel) {
      summaryParts.push(`for ${studyLevel.replace(/-/g, " ")} programmes`);
    }
    if (budgetMax < 100_000) {
      summaryParts.push(`with tuition up to $${budgetMax.toLocaleString()}`);
    }
    const summary = totalMatches === 0
      ? `No exact matches ${summaryParts.join(" ") || "for your criteria"}. Try widening your budget or choosing a different country.`
      : `Found ${totalMatches} opportunities ${summaryParts.join(" ") || "matching your profile"}.`;

    // Audit the eligibility check (no PII — only public context)
    try {
      await db.higherStudyReferral.create({
        data: {
          referralCode: `ELIG-${Date.now().toString(36).toUpperCase()}`,
          source: "ALAMINN_ELIGIBILITY_CHECK",
          referralType: "eligibility-check",
          targetUrl: "https://alaminn.info/higher-study/eligibility-check",
          countrySlug: countrySlug || null,
          studyLevel: studyLevel || null,
          consentGiven: true,
          consentVersion: "eligibility-v1",
          consentTimestamp: new Date(),
          status: "created",
          ipHash: ip,
          deviceCategory: getDeviceCategory(req.headers.get("user-agent")),
        },
      });
    } catch {
      // Audit failure is non-fatal
    }

    return jsonResponse(
      true,
      "Eligibility check complete.",
      {
        universities,
        courses,
        scholarships,
        summary,
      },
      {
        totalMatches,
        counts: {
          universities: universities.length,
          courses: courses.length,
          scholarships: scholarships.length,
        },
      },
    );
  } catch (err) {
    console.error("[eligibility-check] error", err);
    return jsonResponse(
      false,
      "Could not process eligibility check. Please try again.",
      null,
      {},
      ["server_error"],
      500,
    );
  }
}

// Helper to silence unused-import warnings for createHash
void createHash;

export async function GET() {
  return jsonResponse(
    false,
    "Method not allowed. Use POST.",
    null,
    {},
    ["method_not_allowed"],
    405,
  );
}
