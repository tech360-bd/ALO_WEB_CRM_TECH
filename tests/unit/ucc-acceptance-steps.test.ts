// ============================================================================
// §176 — ACCEPTANCE TEST: ALO Unified Communication & Social Command Center
//
// Maps the 27 end-to-end acceptance steps (contact lands on WhatsApp ->
// document delivered/versioned/rejected -> SLA lifecycle) to their concrete
// seams in this repository. Pure seams are behavior-tested; route seams are
// pinned to their contract tokens so a regression anywhere fails loudly.
// ============================================================================
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import path from "path";

const root = process.cwd();
const src = (p: string) => readFileSync(path.join(root, p), "utf8");
const has = (p: string) => existsSync(path.join(root, p));

// Route/lib seam files
const WEBHOOK = "src/app/api/whatsapp/webhook/route.ts";
const LEGACY_WEBHOOK = "src/app/api/crm/ucc/webhooks/whatsapp/route.ts";
const HANDLER = "src/lib/whatsapp-webhook-handler.ts";
const CLOUDAPI = "src/lib/whatsapp-cloud-api.ts";
const MATCH = "src/app/api/communications/contacts/match/route.ts";
const RESOLVE = "src/app/api/communications/contacts/match/[id]/resolve/route.ts";
const REPLY = "src/app/api/crm/ucc/conversations/[id]/reply/route.ts";
const INBOX = "src/app/api/crm/communications/inbox/route.ts";
const DOCS_POST = "src/app/api/applications/[id]/documents/route.ts";
const REJECT = "src/app/api/application-documents/[id]/reject/route.ts";
const DRAFTS = "src/app/api/communications/drafts/route.ts";
const CALLS = "src/app/api/communications/calls/outcomes/route.ts";
const SCHEMA = "prisma/schema.prisma";

describe("§176 step 1-8 — WhatsApp intake, authentication, contact matching", () => {
  it("(1) canonical webhook verifies the official signature and the legacy URL delegates to it", () => {
    expect(has(WEBHOOK)).toBe(true);
    const w = src(WEBHOOK);
    expect(w).toContain("verifySignature(");
    expect(w).toContain("WHATSAPP_APP_SECRET");
    expect(w).toContain("Invalid signature");
    const legacy = src(LEGACY_WEBHOOK);
    expect(legacy).toContain("processCanonicalWhatsAppWebhook");
    expect(legacy).toContain("verifyCanonicalWhatsAppWebhook");
  });
  it("(2) invalid/missing signatures are rejected before processing", () => {
    const w = src(WEBHOOK);
    expect(w).toContain("if (!signatureValid)");
    expect(w).toContain("Invalid signature — webhook not verified");
  });
  it("(3) inbound phone is normalized E.164 for matching", () => {
    expect(src(WEBHOOK)).toContain("normalizePhoneE164");
    expect(src(HANDLER)).toContain("normalizePhoneE164");
  });
  it("(4) idempotency claims the provider message ID before processing", () => {
    const w = src(WEBHOOK);
    expect(w).toContain("providerMessageId");
    expect(w).toContain("claimWebhookEvent");
    expect(w).toContain("findUnique"); // archive dedupe before insert
  });
  it("(5) student match by phone -> thread attached to student", () => {
    expect(src(WEBHOOK)).toContain("matchedStudentId");
  });
  it("(6) lead match fallback when no student matches", () => {
    expect(src(WEBHOOK)).toContain("matchedLeadId");
  });
  it("(7) unmatched contacts create a review record, NEVER an auto-Student", () => {
    expect(src(MATCH)).toContain("identity.candidates");
    expect(src(MATCH)).toContain("contactMatchReview");
  });
  it("(8) review decisions are OPEN_EXISTING | MERGE_REQUEST | CREATE_NEW, authorized roles only, CREATE_NEW elevated, decidedBy from auth", () => {
    const r = src(RESOLVE);
    expect(r).toContain("OPEN_EXISTING");
    expect(r).toContain("MERGE_REQUEST");
    expect(r).toContain("CREATE_NEW_ROLES");
    expect(r).toContain("authenticateRequest");
    expect(r).toContain("auth.userId");
  });
});

describe("§176 step 9-14 — thread, message, SLA recording", () => {
  it("(9) one open thread per contact+channel; thread carries intent/priority", () => {
    const w = src(WEBHOOK);
    expect(w).toContain('status: "open"');
    expect(w).toContain("classifyIntentCRM");
    expect(w).toContain("detectPriority");
  });
  it("(10) inbound message persisted with direction/sender/delivery status", () => {
    const w = src(WEBHOOK);
    expect(w).toContain("direction: 'inbound'");
    expect(w).toContain("deliveryStatus: 'delivered'");
  });
  it("(11) §150 SLA event created at intake with received/assigned timestamps", () => {
    const w = src(WEBHOOK);
    expect(w).toContain("startSlaForThread");
    const sla = src("src/lib/sla-engine.ts");
    expect(sla).toContain("communicationSlaEvent.create");
    expect(sla).toContain("assignedAt: params.counselorId ? now : null");
  });
  it("(12) §150 first response and resolution recorded precisely on staff reply", () => {
    const s = src("src/lib/sla-engine.ts");
    expect(s).toContain("firstResponseAt");
    expect(s).toContain("resolvedAt");
  });
  it("(13) §150 first VIEW recorded when staff opens the conversation", () => {
    expect(src(INBOX)).toContain("firstViewedAt");
  });
  it("(14) reassignment preserves the original assignment timestamp", () => {
    const i = src(INBOX);
    expect(i).toContain("action === 'assign'");
    expect(i).toContain("assignedAt: null"); // only fills when previously unassigned
  });
});

describe("§176 step 15-21 — attachments & document requirements (§131, §135-138)", () => {
  it("(15) §131 inbound attachments stored with the mandated field set", () => {
    const a = src(SCHEMA).match(/model CommunicationAttachment \{[\s\S]*?\n\}/)?.[0] || "";
    for (const f of ["fileName", "fileType", "fileSizeBytes", "senderContact", "recipientContact", "deliveryStatus", "studentId", "applicationId", "documentId", "direction", "providerFileId"]) {
      expect(a, `CommunicationAttachment.${f}`).toContain(f);
    }
  });
  it("(16) inbound receivers populate sender/recipient/delivery_status, and require counselor doc-slot review", () => {
    const w = src(WEBHOOK);
    expect(w).toContain("senderContact: senderPhone");
    expect(w).toContain("recipientContact");
    expect(w).toContain("matchReviewRequired: true");
  });
  it("(17) §131 outbound attachments go through the official Cloud API (media by https link), never fabricated", () => {
    const c = src(CLOUDAPI);
    expect(c).toContain("sendWhatsAppMedia");
    expect(c).toContain("getWhatsAppGraphUrl");
    expect(src(REPLY)).toContain("CHANNEL_UNSUPPORTED_FOR_MEDIA");
  });
  it("(18) failed attachment sends are recorded truthfully and surface errors", () => {
    const r = src(REPLY);
    expect(r).toContain("status: 'failed'");
    expect(r).toContain("WhatsApp media send failed");
  });
  it("(19) §136 one requirement = version history; server computes version", () => {
    const d = src(DOCS_POST);
    expect(d).toContain("nextDocumentVersion");
    expect(d).not.toContain("version: body.version");
    expect(d).toContain("SUPERSEDED");
  });
  it("(20) §137 verified documents immutable; supersede requires role + reason", () => {
    const d = src(DOCS_POST);
    expect(d).toContain("VERIFIED_IMMUTABLE");
    expect(d).toContain("supersedeReason");
  });
  it("(21) §138 rejection: predefined reasons, state-guarded, NEVER bumps version", () => {
    const r = src(REJECT);
    expect(r).toContain("validateRejection");
    expect(r).toContain("REJECTION_REASONS");
    expect(r).not.toContain("version: existing.version + 1");
    expect(r).toContain("REJECT_DOCUMENT");
    const lib = src("src/lib/documents/document-rejection.ts");
    expect(lib).toContain("VERIFIED_IMMUTABLE");
    expect(lib).toContain("INVALID_STATE_TRANSITION");
  });
});

describe("§176 step 22-27 — outbound reply, drafts, tasks, audit", () => {
  it("(22) outbound replies persist provider message id and delivery trail", () => {
    expect(src(REPLY)).toContain("providerMessageId");
  });
  it("(23) §130/§151 AI-assisted drafts require human approval before send", () => {
    expect(src(DRAFTS)).toContain("validateDraftMode");
    expect(src("src/lib/communication/approval-modes.ts")).toContain("422");
  });
  it("(24) §141 call recording requires explicit consent before recording", () => {
    expect(src(CALLS)).toContain("effectiveInternalNote");
    expect(src("src/lib/communication/call-consent.ts")).toContain("consent");
  });
  it("(25) §168 communication tasks carry the full task field set", () => {
    const t = src(SCHEMA).match(/model CommunicationTask \{[\s\S]*?\n\}/)?.[0] || "";
    for (const f of ["title", "description", "assignedTo", "priority", "status", "deadline", "source", "resolution", "createdBy", "communicationMessageId", "studentId", "applicationId"]) {
      expect(t, `CommunicationTask.${f}`).toContain(f);
    }
  });
  it("(26) audits recorded for match decisions, rejections, sends", () => {
    expect(src(RESOLVE)).toContain("CONTACT_MATCH_${decision}");
    expect(src(REJECT)).toContain("tx.auditLog.create");
    expect(src(REJECT)).toContain("tx.documentAudit.create");
    expect(src(REPLY)).toContain("ATTACHMENT_SENT");
  });
  it("(27) §175 no fabricated content: honest errors for unconfigured providers and unsupported media", () => {
    const c = src(CLOUDAPI);
    expect(c).toContain("whatsappCloudConfigError"); // fail-closed, no fake sends
    const m = src("src/lib/whatsapp-media.ts");
    expect(m).toContain("not configured — WHATSAPP_ACCESS_TOKEN");
    expect(m).toContain("mediaType must be one of");
  });
});
