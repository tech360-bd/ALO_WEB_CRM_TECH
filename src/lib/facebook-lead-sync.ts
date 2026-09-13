/**
 * Facebook Lead Sync
 *
 * Verifies webhook signatures, exchanges page access tokens, normalizes
 * FB lead field_data, and ingests leads into the CRM (Lead + Student +
 * TimelineEvent + Task + FacebookLeadRaw).
 *
 * Flow:
 *   verifyFacebookSignature → exchangePageAccessToken → processFacebookLead
 *     1. Upsert FacebookLeadRaw (leadgenId @unique).
 *     2. Normalize field_data (full_name/first_name/last_name/email/
 *        phone_number/country/course/study_level; BD phone via normalizePhone).
 *     3. Dedup by email/phone against existing Lead.
 *     4. Create Lead (source=FACEBOOK) + Student + TimelineEvent.
 *     5. Trigger scoreLead + autoAssignCounselor + createFollowUpTask.
 *     6. Create Task (FOLLOW_UP).
 *     7. Update FacebookLeadRaw.matchedLeadId + processingStatus=CONVERTED.
 *     8. AuditLog.
 *
 * Models touched: FacebookIntegration, FacebookLeadRaw, Lead, Student,
 * TimelineEvent, Task, AuditLog.
 */

import crypto from "node:crypto";
import { db } from "@/lib/db";
import { normalizePhone, phoneVariants } from "@/lib/phone-normalization";
import {
  scoreLead,
  autoAssignCounselor,
  createFollowUpTask,
} from "@/lib/crm-automation";

// ─── Signature verification ─────────────────────────────────────

/**
 * Verify the X-Hub-Signature-256 header sent by Meta webhooks.
 * `appSecret` may be passed explicitly (per-page integration secret).
 * Falls back to process.env.FACEBOOK_APP_SECRET.
 *
 * Returns false on missing signature or mismatch.
 */
export function verifyFacebookSignature(
  rawBody: string,
  signature: string | null | undefined,
  appSecret?: string
): boolean {
  const secret = appSecret || process.env.FACEBOOK_APP_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[facebook-lead-sync] FACEBOOK_APP_SECRET not set — signature verification skipped (dev mode)."
      );
      return true;
    }
    console.error(
      "[facebook-lead-sync] FACEBOOK_APP_SECRET is required in production — rejecting webhook."
    );
    return false;
  }
  if (!signature || !signature.startsWith("sha256=")) return false;

  const expected = signature.slice("sha256=".length);
  const computed = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ─── Page access token exchange ─────────────────────────────────

export interface PageAccessTokenResult {
  pageAccessToken: string | null;
  pageName?: string | null;
  error?: string;
  raw?: Record<string, unknown>;
}

/**
 * Exchange a user access token for a long-lived page access token.
 *
 * Endpoint: GET /{pageId}?fields=access_token,name&access_token=...
 */
export async function exchangePageAccessToken(
  userAccessToken: string,
  pageId: string
): Promise<PageAccessTokenResult> {
  const url = `https://graph.facebook.com/v18.0/${pageId}?fields=access_token,name&access_token=${encodeURIComponent(
    userAccessToken
  )}`;
  try {
    const resp = await fetch(url, { method: "GET" });
    const json: any = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return {
        pageAccessToken: null,
        error: json?.error?.message ?? `HTTP ${resp.status}`,
        raw: json,
      };
    }
    return {
      pageAccessToken: json.access_token ?? null,
      pageName: json.name ?? null,
      raw: json,
    };
  } catch (err: any) {
    return {
      pageAccessToken: null,
      error: err?.message ?? String(err),
    };
  }
}

// ─── Field normalization ────────────────────────────────────────

export interface NormalizedLeadData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;            // normalized (8801XXXXXXXXX for BD)
  country?: string;
  course?: string;
  studyLevel?: string;
  raw: Record<string, string>;
}

/**
 * Convert Facebook Lead Ads `field_data` array → flat normalized object.
 *
 * Maps these FB field names:
 *   - full_name / first_name / last_name / email
 *   - phone_number  (BD phone via normalizePhone → 8801XXXXXXXXX)
 *   - country
 *   - course
 *   - study_level
 *
 * Unknown fields are kept in `raw`.
 */
export function normalizeLeadFieldData(
  fieldData: Array<{ name: string; values: string[] }> | Record<string, unknown> | null | undefined,
  pageId?: string,
  formName?: string
): NormalizedLeadData {
  const flat: Record<string, string> = {};

  if (Array.isArray(fieldData)) {
    // Standard FB Lead Ads shape: [{ name, values: [v1, ...] }]
    for (const f of fieldData) {
      if (!f || !f.name) continue;
      const v = Array.isArray(f.values) ? f.values[0] : (f.values as any);
      if (typeof v === "string") {
        flat[f.name.toLowerCase()] = v;
      }
    }
  } else if (fieldData && typeof fieldData === "object") {
    // Alternate shape: { field_name: value }
    for (const [k, v] of Object.entries(fieldData)) {
      if (typeof v === "string") flat[k.toLowerCase()] = v;
      else if (Array.isArray(v) && typeof v[0] === "string") flat[k.toLowerCase()] = v[0];
    }
  }

  const fullName =
    flat["full_name"] ||
    flat["fullname"] ||
    flat["name"] ||
    [flat["first_name"], flat["last_name"]].filter(Boolean).join(" ") ||
    undefined;

  const firstName = flat["first_name"] || flat["firstname"] || undefined;
  const lastName = flat["last_name"] || flat["lastname"] || undefined;

  const email = flat["email"] || flat["email_address"] || undefined;

  const rawPhone = flat["phone_number"] || flat["phone"] || flat["mobile"] || flat["mobile_number"];
  const phone = rawPhone ? normalizePhone(rawPhone) : undefined;

  const country = flat["country"] || flat["destination_country"] || flat["preferred_country"] || undefined;
  const course = flat["course"] || flat["preferred_course"] || flat["subject"] || undefined;
  const studyLevel = flat["study_level"] || flat["level"] || flat["degree"] || undefined;

  const out: NormalizedLeadData = {
    raw: { ...flat, _pageId: pageId ?? "", _formName: formName ?? "" },
  };
  if (fullName) out.fullName = fullName;
  if (firstName) out.firstName = firstName;
  if (lastName) out.lastName = lastName;
  if (email) out.email = email.toLowerCase();
  if (phone) out.phone = phone;
  if (country) out.country = country;
  if (course) out.course = course;
  if (studyLevel) out.studyLevel = studyLevel;
  return out;
}

// ─── Lead processing ────────────────────────────────────────────

export interface ProcessFacebookLeadResult {
  leadId: string | null;
  studentId: string | null;
  counselorId: string | null;
  facebookLeadRawId: string;
  processingStatus: "CONVERTED" | "DUPLICATE" | "FAILED";
  duplicateOfLeadId?: string | null;
  error?: string;
}

/**
 * Process a Facebook leadgen submission end-to-end:
 *
 *   1. Upsert FacebookLeadRaw (leadgenId @unique, P2002 → fetch existing).
 *   2. Normalize field_data.
 *   3. Dedup by email/phone against existing Lead.
 *   4. Create Lead (source=FACEBOOK) + Student + TimelineEvent.
 *   5. scoreLead + autoAssignCounselor + createFollowUpTask.
 *   6. Create Task (FOLLOW_UP) for assigned counselor.
 *   7. Update FacebookLeadRaw.matchedLeadId + processingStatus=CONVERTED.
 *   8. AuditLog.
 */
export async function processFacebookLead(
  leadgenId: string,
  pageId: string,
  fieldData: Array<{ name: string; values: string[] }> | Record<string, unknown>,
  formId?: string,
  formName?: string
): Promise<ProcessFacebookLeadResult> {
  if (!leadgenId || !pageId) {
    return {
      leadId: null,
      studentId: null,
      counselorId: null,
      facebookLeadRawId: "",
      processingStatus: "FAILED",
      error: "Missing leadgenId or pageId",
    };
  }

  const normalized = normalizeLeadFieldData(fieldData as any, pageId, formName);
  const fieldDataJson = JSON.stringify(fieldData);
  const normalizedJson = JSON.stringify(normalized);

  // 1) Upsert FacebookLeadRaw
  let fbLeadRawId: string;
  try {
    const created = await db.facebookLeadRaw.create({
      data: {
        pageId,
        leadgenId,
        formId: formId ?? null,
        formName: formName ?? null,
        fieldData: fieldDataJson,
        normalizedData: normalizedJson,
        processingStatus: "PROCESSING",
        receivedAt: new Date(),
      },
    });
    fbLeadRawId = created.id;
  } catch (err: any) {
    if (err?.code === "P2002") {
      // Already ingested — fetch existing + return
      const existing = await db.facebookLeadRaw.findUnique({
        where: { leadgenId },
        select: { id: true, matchedLeadId: true, processingStatus: true },
      });
      if (existing) {
        return {
          leadId: existing.matchedLeadId,
          studentId: null,
          counselorId: null,
          facebookLeadRawId: existing.id,
          processingStatus: existing.processingStatus === "CONVERTED" ? "CONVERTED" : "DUPLICATE",
          duplicateOfLeadId: existing.matchedLeadId,
          error: "Lead already ingested",
        };
      }
    }
    throw err;
  }

  // 2) Dedup by email / phone
  let duplicateOfLeadId: string | null = null;
  if (normalized.email || normalized.phone) {
    const orClauses: any[] = [];
    if (normalized.email) orClauses.push({ email: normalized.email });
    if (normalized.phone) {
      for (const v of phoneVariants(normalized.phone)) {
        orClauses.push({ phone: v });
      }
    }
    try {
      const existing = await db.lead.findFirst({
        where: { OR: orClauses },
        select: { id: true },
      });
      if (existing) duplicateOfLeadId = existing.id;
    } catch (err) {
      console.error("[facebook-lead-sync] dedup query failed:", err);
    }
  }

  if (duplicateOfLeadId) {
    await db.facebookLeadRaw.update({
      where: { id: fbLeadRawId },
      data: {
        matchedLeadId: duplicateOfLeadId,
        processingStatus: "DUPLICATE",
        processedAt: new Date(),
      },
    }).catch(() => {});

    await db.auditLog.create({
      data: {
        action: "DATA_IMPORT",
        resource: "FacebookLeadRaw",
        resourceId: fbLeadRawId,
        details: JSON.stringify({
          leadgenId,
          pageId,
          duplicateOfLeadId,
          normalized,
        }),
      },
    }).catch(() => {});

    return {
      leadId: duplicateOfLeadId,
      studentId: null,
      counselorId: null,
      facebookLeadRawId: fbLeadRawId,
      processingStatus: "DUPLICATE",
      duplicateOfLeadId,
    };
  }

  // 3) Create Lead + Student + TimelineEvent
  const leadIdCode = `ALO-L-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  const fullName = normalized.fullName || normalized.firstName || "Facebook Lead";
  const studentCode = `ALO-S-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

  let leadId: string | null = null;
  let studentId: string | null = null;

  try {
    // Create Lead first
    const lead = await db.lead.create({
      data: {
        leadId: leadIdCode,
        fullName,
        email: normalized.email ?? null,
        phone: normalized.phone ?? "unknown",
        source: "FACEBOOK",
        sourceDetail: `Facebook Lead Ads (${formName ?? formId ?? pageId})`,
        preferredCountry: normalized.country ?? null,
        preferredCourse: normalized.course ?? null,
        preferredLevel: normalized.studyLevel ?? null,
        rawSubmission: JSON.stringify({ fieldData, normalized, pageId, formId, formName, leadgenId }),
        status: "NEW",
      },
    });
    leadId = lead.id;

    // Create Student (origin = this lead)
    const firstName = normalized.firstName || fullName.split(" ")[0] || "Facebook";
    const lastName = normalized.lastName || fullName.split(" ").slice(1).join(" ") || "Lead";
    const student = await db.student.create({
      data: {
        studentId: studentCode,
        leadId: lead.id,
        firstName,
        lastName,
        fullName,
        email: normalized.email ?? `${leadIdCode.toLowerCase()}@facebook-lead.local`,
        mobile: normalized.phone ?? "unknown",
        nationality: normalized.country ?? "Unknown",
        countryOfBirth: normalized.country ?? "Unknown",
        studyDestination: normalized.country ?? null,
        programTitle: normalized.course ?? null,
        studyLevel: normalized.studyLevel ?? null,
        status: "ACTIVE",
      },
    });
    studentId = student.id;

    // Link lead → student
    await db.lead.update({
      where: { id: lead.id },
      data: { studentId: student.id },
    });

    // TimelineEvent
    await db.timelineEvent.create({
      data: {
        leadId: lead.id,
        studentId: student.id,
        type: "LEAD_CREATED",
        title: "Facebook Lead ingested",
        description: `Lead from Facebook form "${formName ?? formId ?? pageId}"`,
        meta: JSON.stringify({
          source: "FACEBOOK",
          pageId,
          leadgenId,
          formId: formId ?? null,
          formName: formName ?? null,
          normalized,
        }),
      },
    }).catch((err) => {
      console.error("[facebook-lead-sync] timeline event failed:", err);
    });
  } catch (err) {
    console.error("[facebook-lead-sync] lead/student creation failed:", err);
    await db.facebookLeadRaw.update({
      where: { id: fbLeadRawId },
      data: {
        processingStatus: "FAILED",
        errorMessage: err instanceof Error ? err.message : String(err),
        processedAt: new Date(),
      },
    }).catch(() => {});

    return {
      leadId: null,
      studentId: null,
      counselorId: null,
      facebookLeadRawId: fbLeadRawId,
      processingStatus: "FAILED",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // The database transaction above must produce a lead before any automation
  // can run. Keep the invariant explicit so nullable failure state never reaches
  // downstream services.
  if (!leadId) {
    return {
      leadId: null,
      studentId,
      counselorId: null,
      facebookLeadRawId: fbLeadRawId,
      processingStatus: "FAILED",
      error: "Lead creation did not return an identifier",
    };
  }

  // 4) Automation hooks (best-effort — failures don't fail the sync)
  let counselorId: string | null = null;
  try {
    await scoreLead(leadId);
  } catch (err) {
    console.error("[facebook-lead-sync] scoreLead failed:", err);
  }
  try {
    const assignment = await autoAssignCounselor(leadId);
    counselorId = assignment.counselorId;
  } catch (err) {
    console.error("[facebook-lead-sync] autoAssignCounselor failed:", err);
  }
  try {
    await createFollowUpTask(leadId, 1);
  } catch (err) {
    console.error("[facebook-lead-sync] createFollowUpTask failed:", err);
  }

  // 5) Create FOLLOW_UP Task for the assigned counselor
  if (counselorId) {
    try {
      await db.task.create({
        data: {
          title: `Follow up: ${fullName} (Facebook lead)`,
          description: `Facebook lead from page ${pageId}. Reach out within 30 minutes per SLA.`,
          assigneeId: counselorId,
          studentId: studentId ?? undefined,
          type: "FOLLOW_UP",
          priority: "HIGH",
          status: "PENDING",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    } catch (err) {
      console.error("[facebook-lead-sync] FOLLOW_UP task creation failed:", err);
    }
  }

  // 6) Update FacebookLeadRaw
  try {
    await db.facebookLeadRaw.update({
      where: { id: fbLeadRawId },
      data: {
        matchedLeadId: leadId,
        assignedCounselorId: counselorId,
        processingStatus: "CONVERTED",
        processedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[facebook-lead-sync] fbLeadRaw update failed:", err);
  }

  // 7) AuditLog
  try {
    await db.auditLog.create({
      data: {
        action: "DATA_IMPORT",
        resource: "FacebookLeadRaw",
        resourceId: fbLeadRawId,
        details: JSON.stringify({
          action: "FACEBOOK_LEAD_CONVERTED",
          leadgenId,
          pageId,
          leadId,
          studentId,
          counselorId,
          normalized,
        }),
      },
    });
  } catch (err) {
    console.error("[facebook-lead-sync] audit log failed:", err);
  }

  return {
    leadId,
    studentId,
    counselorId,
    facebookLeadRawId: fbLeadRawId,
    processingStatus: "CONVERTED",
  };
}
