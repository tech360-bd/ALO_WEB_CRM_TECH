/**
 * POST /api/v1/higher-study/alerts
 * --------------------------------------------------------------------
 * Creates a deadline alert subscription for a Higher Study entity.
 *
 * Body: `{ entityType, entitySlug, entityName, deadlineDate, alertChannel,
 *         email?, whatsapp?, sessionId?, consentGiven }`
 *
 * Validates:
 *   - consentGiven must be true
 *   - if alertChannel=whatsapp, whatsapp must be provided
 *   - if alertChannel=email, email must be provided and valid
 *   - entityType must be one of: scholarship | research | course | event
 *
 * Auth: anonymous (sessionId) OR authenticated (signed session cookie).
 * Rate limit: 10 req/min per IP.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  safeString,
  hashIp,
} from "@/lib/higher-study/api-helpers";
import { rateLimit } from "@/lib/higher-study/rate-limit";
import { resolveCaller } from "../_lib/caller";

export const dynamic = "force-dynamic";

const VALID_ENTITY_TYPES = new Set(["scholarship", "research", "course", "event"]);
const VALID_CHANNELS = new Set(["email", "in-app", "whatsapp"]);

export async function POST(req: NextRequest) {
  const ip = hashIp(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown",
    process.env.HIGHER_STUDY_REFERRAL_SECRET ?? "alaminn-hs",
  );
  if (rateLimit(ip, 10)) {
    return jsonResponse(
      false,
      "Too many alert subscriptions. Please try again later.",
      null,
      {},
      ["rate_limited"],
      429,
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse(false, "Invalid request body.", null, {}, ["invalid_body"], 400);
    }

    const ctx = resolveCaller(req, body as Record<string, unknown>);
    if (!ctx.userId && !ctx.sessionId) {
      return jsonResponse(
        false,
        "Either an authenticated session or a sessionId is required.",
        null,
        {},
        ["caller_required"],
        400,
      );
    }

    const entityType = safeString((body as Record<string, unknown>).entityType as string);
    const entitySlug = safeString((body as Record<string, unknown>).entitySlug as string);
    const entityName = safeString((body as Record<string, unknown>).entityName as string);
    const alertChannel = safeString((body as Record<string, unknown>).alertChannel as string) || "email";
    const email = safeString((body as Record<string, unknown>).email as string).toLowerCase();
    const whatsapp = safeString((body as Record<string, unknown>).whatsapp as string);
    const consentGiven = (body as Record<string, unknown>).consentGiven === true;
    const deadlineRaw = safeString((body as Record<string, unknown>).deadlineDate as string);

    const errors: string[] = [];
    if (!entityType || !VALID_ENTITY_TYPES.has(entityType)) errors.push("entityType_invalid");
    if (!entitySlug) errors.push("entitySlug_required");
    if (!entityName) errors.push("entityName_required");
    if (!alertChannel || !VALID_CHANNELS.has(alertChannel)) errors.push("alertChannel_invalid");
    if (!consentGiven) errors.push("consent_required");
    if (alertChannel === "email" && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      errors.push("email_invalid");
    }
    if (alertChannel === "whatsapp" && !whatsapp) errors.push("whatsapp_required");
    if (!deadlineRaw) errors.push("deadlineDate_required");
    else {
      const d = new Date(deadlineRaw);
      if (Number.isNaN(d.getTime())) errors.push("deadlineDate_invalid");
      else if (d.getTime() < Date.now()) errors.push("deadlineDate_past");
    }
    if (errors.length > 0) {
      return jsonResponse(false, "Validation failed.", null, {}, errors, 400);
    }

    const deadlineDate = new Date(deadlineRaw);
    const alert = await db.higherStudyAlert.create({
      data: {
        userId: ctx.userId,
        sessionId: ctx.sessionId,
        email: email || null,
        whatsapp: whatsapp || null,
        entityType,
        entitySlug,
        entityName,
        deadlineDate,
        alertChannel,
        consentGiven: true,
        consentTimestamp: new Date(),
        status: "active",
      },
    });

    return jsonResponse(true, "Alert subscription created.", alert);
  } catch (err) {
    console.error("[higher-study/alerts POST] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
