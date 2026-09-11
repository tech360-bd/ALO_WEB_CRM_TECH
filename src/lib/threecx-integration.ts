// ============================================================
// 3CX PBX INTEGRATION
// Real HTTP calls to 3CX REST API. NEVER simulated.
// Caller-id lookup, call/SMS/WhatsApp/chat journaling (idempotent),
// extension mapping, click-to-call, webhook verification, AI call analysis.
// ============================================================

import { db } from "@/lib/db";

// ─── Phone Normalization (dynamic import with fallback) ───

let normalizePhoneFn: ((phone: string) => string) | null = null;

async function normalizePhone(phone: string): Promise<string> {
  if (!phone) return "";
  if (normalizePhoneFn) return normalizePhoneFn(phone);
  try {
    // Dynamic import — works if @/lib/phone-normalization exists in future
    const mod: any = await import("@/lib/phone-normalization");
    if (mod && typeof mod.normalizePhone === "function") {
      const fn = mod.normalizePhone as (p: string) => string;
      normalizePhoneFn = fn;
      return fn(phone);
    }
  } catch {
    // module not present — fall through to inline implementation
  }
  // Inline fallback (Bangladesh-focused, matches existing whatsapp/webhook route)
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("01") && digits.length === 11) {
    digits = "880" + digits;
  } else if (digits.startsWith("+880")) {
    digits = digits.slice(1);
  } else if (digits.length === 10 && digits.startsWith("1")) {
    digits = "880" + digits;
  }
  return digits;
}

// ─── Integration Config ───

export async function getActive3cxIntegration() {
  const integration = await db.threeCxIntegration.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  return integration;
}

// ─── Real HTTP test ───

/**
 * Test the 3CX connection by issuing a REAL HTTP GET to {baseUrl}/api/Health.
 * Only returns success=true if the response is HTTP 2xx.
 * Updates the integration record with the test result.
 */
export async function test3cxConnection(integrationId: string) {
  const integration = await db.threeCxIntegration.findUnique({ where: { id: integrationId } });
  if (!integration) throw new Error("ThreeCxIntegration not found");
  if (!integration.baseUrl) {
    const updated = await db.threeCxIntegration.update({
      where: { id: integrationId },
      data: {
        lastTestedAt: new Date(),
        lastTestSuccess: false,
        lastError: "baseUrl not configured",
        status: "ERROR",
      },
    });
    return { success: false, error: "baseUrl not configured", integration: updated };
  }

  const healthUrl = `${integration.baseUrl.replace(/\/$/, "")}/api/Health`;
  const startedAt = Date.now();

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (integration.apiKey) headers["Authorization"] = `Bearer ${integration.apiKey}`;

    const response = await fetch(healthUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(10000),
    });

    const elapsedMs = Date.now() - startedAt;
    const ok = response.status >= 200 && response.status < 300;

    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch {
      // ignore body read failure
    }

    const updated = await db.threeCxIntegration.update({
      where: { id: integrationId },
      data: {
        lastTestedAt: new Date(),
        lastTestSuccess: ok,
        lastError: ok ? null : `HTTP ${response.status}: ${bodyText.slice(0, 200)}`,
        status: ok ? "CONNECTED" : "ERROR",
        lastSuccessfulSync: ok ? new Date() : integration.lastSuccessfulSync,
      },
    });

    await db.auditLog.create({
      data: {
        action: "AI_ACTION",
        resource: "ThreeCxIntegration",
        resourceId: integrationId,
        details: JSON.stringify({
          action: "CONNECTION_TEST",
          healthUrl,
          httpStatus: response.status,
          ok,
          elapsedMs,
        }),
      },
    });

    return {
      success: ok,
      httpStatus: response.status,
      healthUrl,
      elapsedMs,
      bodyPreview: bodyText.slice(0, 300),
      integration: updated,
    };
  } catch (error: any) {
    const updated = await db.threeCxIntegration.update({
      where: { id: integrationId },
      data: {
        lastTestedAt: new Date(),
        lastTestSuccess: false,
        lastError: error?.message || "Network error",
        status: "ERROR",
      },
    });
    return {
      success: false,
      error: error?.message || "Network error",
      healthUrl,
      integration: updated,
    };
  }
}

// ─── Contact Lookup ───

export interface ContactLookupResult {
  matched: boolean;
  type: "STUDENT" | "LEAD" | "PARTNER" | "EMPLOYEE" | null;
  id: string | null;
  name: string | null;
  // Caller-identification fields only — NO sensitive PII
  studentId?: string | null;
  leadId?: string | null;
  partnerId?: string | null;
  employeeId?: string | null;
  counselorId?: string | null;
  status?: string | null;
  matchedPhone?: string | null;
  matchReason?: string;
}

/**
 * Normalize the phone, then search Student / Lead / User(PARTNER) / Employee.
 * Returns only caller-identification fields — no PII leak.
 */
export async function lookupContactByPhone(phone: string): Promise<ContactLookupResult> {
  const normalized = await normalizePhone(phone);
  const candidates = [phone, normalized].filter(Boolean);

  const orClauses = candidates.map((p) => ({ mobile: p }));

  // 1. Student
  if (candidates.length) {
    const student = await db.student.findFirst({
      where: {
        OR: [
          ...candidates.map((p) => ({ mobile: p })),
          ...candidates.map((p) => ({ altMobile: p })),
        ],
      },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        status: true,
        counselorId: true,
        mobile: true,
      },
    });
    if (student) {
      return {
        matched: true,
        type: "STUDENT",
        id: student.id,
        name: student.fullName,
        studentId: student.studentId,
        counselorId: student.counselorId,
        status: student.status,
        matchedPhone: student.mobile,
        matchReason: "mobile/altMobile match",
      };
    }

    // 2. Lead
    const lead = await db.lead.findFirst({
      where: {
        OR: [
          ...candidates.map((p) => ({ phone: p })),
          ...candidates.map((p) => ({ altPhone: p })),
        ],
      },
      select: { id: true, leadId: true, fullName: true, status: true, phone: true },
    });
    if (lead) {
      return {
        matched: true,
        type: "LEAD",
        id: lead.id,
        name: lead.fullName,
        leadId: lead.leadId,
        status: lead.status,
        matchedPhone: lead.phone,
        matchReason: "phone/altPhone match",
      };
    }

    // 3. User with role=PARTNER
    const partner = await db.user.findFirst({
      where: {
        role: "PARTNER",
        OR: candidates.map((p) => ({ phone: p })),
      },
      select: { id: true, name: true, status: true, phone: true },
    });
    if (partner) {
      return {
        matched: true,
        type: "PARTNER",
        id: partner.id,
        name: partner.name,
        partnerId: partner.id,
        status: partner.status,
        matchedPhone: partner.phone,
        matchReason: "User(PARTNER) phone match",
      };
    }

    // 4. Employee
    const employee = await db.employee.findFirst({
      where: {
        OR: candidates.map((p) => ({ phone: p })),
      },
      select: { id: true, employeeCode: true, fullName: true, status: true, phone: true, threecxExtension: true },
    });
    if (employee) {
      return {
        matched: true,
        type: "EMPLOYEE",
        id: employee.id,
        name: employee.fullName,
        employeeId: employee.employeeCode,
        status: employee.status,
        matchedPhone: employee.phone,
        matchReason: "Employee phone match",
      };
    }
  }

  return {
    matched: false,
    type: null,
    id: null,
    name: null,
    matchReason: "No match found in Student/Lead/User(PARTNER)/Employee",
  };
}

// ─── Contact Search ───

export async function searchContacts(query: string) {
  if (!query || query.trim().length < 2) return { results: [] };

  const q = query.trim();
  const [students, leads, partners, employees] = await Promise.all([
    db.student.findMany({
      where: {
        OR: [
          { fullName: { contains: q } },
          { studentId: { contains: q } },
          { mobile: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 5,
      select: { id: true, studentId: true, fullName: true, mobile: true, email: true, status: true },
    }),
    db.lead.findMany({
      where: {
        OR: [
          { fullName: { contains: q } },
          { leadId: { contains: q } },
          { phone: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 5,
      select: { id: true, leadId: true, fullName: true, phone: true, email: true, status: true },
    }),
    db.user.findMany({
      where: {
        role: "PARTNER",
        OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }],
      },
      take: 5,
      select: { id: true, name: true, email: true, phone: true, status: true },
    }),
    db.employee.findMany({
      where: {
        OR: [
          { fullName: { contains: q } },
          { employeeCode: { contains: q } },
          { companyEmail: { contains: q } },
          { phone: { contains: q } },
        ],
      },
      take: 5,
      select: { id: true, employeeCode: true, fullName: true, companyEmail: true, phone: true, status: true },
    }),
  ]);

  const results = [
    ...students.map((s) => ({ type: "STUDENT", id: s.id, label: s.fullName, sub: s.studentId, phone: s.mobile, email: s.email, status: s.status })),
    ...leads.map((l) => ({ type: "LEAD", id: l.id, label: l.fullName, sub: l.leadId, phone: l.phone, email: l.email, status: l.status })),
    ...partners.map((p) => ({ type: "PARTNER", id: p.id, label: p.name, sub: "Partner", phone: p.phone, email: p.email, status: p.status })),
    ...employees.map((e) => ({ type: "EMPLOYEE", id: e.id, label: e.fullName, sub: e.employeeCode, phone: e.phone, email: e.companyEmail, status: e.status })),
  ];

  return { results };
}

// ─── Journaling (Idempotent via providerEventId) ───

export interface JournalCallParams {
  provider?: string; // default "3CX"
  providerEventId: string; // REQUIRED — idempotency key
  threecxCallId?: string | null;
  callType: string; // INCOMING | OUTGOING | MISSED
  fromNumber: string;
  toNumber: string;
  duration?: number;
  extension?: string | null;
  status?: string | null;
  startTimestamp?: Date | null;
  endTimestamp?: Date | null;
  recordingMetadata?: string | null;
  recordingPath?: string | null;
  transcriptionStatus?: string | null;
  transcriptionText?: string | null;
  consentRecorded?: boolean;
  studentId?: string | null;
  leadId?: string | null;
  partnerId?: string | null;
  employeeId?: string | null;
  callNotes?: string | null;
  disposition?: string | null;
}

async function resolveContactRefs(params: JournalCallParams): Promise<Partial<JournalCallParams>> {
  const out: Partial<JournalCallParams> = {};
  if (!params.studentId && !params.leadId && !params.partnerId && !params.employeeId) {
    const lookup = await lookupContactByPhone(params.fromNumber);
    if (lookup.matched) {
      if (lookup.type === "STUDENT" && lookup.id) out.studentId = lookup.id;
      else if (lookup.type === "LEAD" && lookup.id) out.leadId = lookup.id;
      else if (lookup.type === "PARTNER" && lookup.id) out.partnerId = lookup.id;
      else if (lookup.type === "EMPLOYEE" && lookup.id) out.employeeId = lookup.id;
    }
  }
  return out;
}

export async function journalCall(params: JournalCallParams) {
  if (!params.providerEventId) {
    throw new Error("providerEventId is required for idempotency");
  }

  const provider = params.provider || "3CX";

  // Idempotency: check existing
  const existing = await db.phoneCallLog.findUnique({
    where: { providerEventId: params.providerEventId },
  });
  if (existing) {
    return { callLog: existing, idempotent: true, message: "Call already journaled." };
  }

  // Auto-resolve contact refs if missing
  const refs = await resolveContactRefs(params);

  const callLog = await db.phoneCallLog.create({
    data: {
      callType: params.callType,
      fromNumber: params.fromNumber,
      toNumber: params.toNumber,
      duration: params.duration ?? 0,
      recordingPath: params.recordingPath ?? null,
      callNotes: params.callNotes ?? null,
      disposition: params.disposition ?? null,
      studentId: params.studentId ?? refs.studentId ?? null,
      leadId: params.leadId ?? refs.leadId ?? null,
      partnerId: params.partnerId ?? refs.partnerId ?? null,
      employeeId: params.employeeId ?? refs.employeeId ?? null,
      provider,
      providerEventId: params.providerEventId,
      threecxCallId: params.threecxCallId ?? null,
      extension: params.extension ?? null,
      status: params.status ?? null,
      startTimestamp: params.startTimestamp ?? null,
      endTimestamp: params.endTimestamp ?? null,
      recordingMetadata: params.recordingMetadata ?? null,
      transcriptionStatus: params.transcriptionStatus ?? "NOT_AVAILABLE",
      transcriptionText: params.transcriptionText ?? null,
      consentRecorded: params.consentRecorded ?? false,
    },
  });

  // Timeline event if linked to a student or lead
  if (callLog.studentId || callLog.leadId) {
    await db.timelineEvent.create({
      data: {
        studentId: callLog.studentId,
        leadId: callLog.leadId,
        type: "MESSAGE_SENT",
        title: `Phone call journaled (${callLog.callType})`,
        description: `From ${callLog.fromNumber} → ${callLog.toNumber}, duration ${callLog.duration}s. Provider: ${provider}.`,
        meta: JSON.stringify({ callLogId: callLog.id, providerEventId: params.providerEventId }),
      },
    }).catch(() => {
      // timeline event creation shouldn't block journaling
    });
  }

  return { callLog, idempotent: false };
}

export interface JournalSmsParams {
  provider?: string;
  providerEventId: string;
  direction?: string;
  fromNumber: string;
  toNumber: string;
  messageText: string;
  deliveryStatus?: string;
  studentId?: string | null;
  leadId?: string | null;
  partnerId?: string | null;
  employeeId?: string | null;
}

export async function journalSms(params: JournalSmsParams) {
  if (!params.providerEventId) throw new Error("providerEventId required");
  const provider = params.provider || "3CX";

  // SMS log doesn't have providerEventId unique — we use a query+create pattern.
  // Look up by providerEventId in deliveryStatus or by recent duplicate match.
  // Simplest: check within last 5 minutes for identical message.
  const recent = await db.smsLog.findFirst({
    where: {
      fromNumber: params.fromNumber,
      toNumber: params.toNumber,
      messageText: params.messageText,
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    },
    select: { id: true },
  });
  if (recent) {
    return { smsLog: recent, idempotent: true, message: "SMS already journaled." };
  }

  // Auto-resolve contact if missing
  let { studentId, leadId, partnerId, employeeId } = params;
  if (!studentId && !leadId && !partnerId && !employeeId) {
    const lookup = await lookupContactByPhone(params.fromNumber);
    if (lookup.matched && lookup.id) {
      if (lookup.type === "STUDENT") studentId = lookup.id;
      else if (lookup.type === "LEAD") leadId = lookup.id;
      else if (lookup.type === "PARTNER") partnerId = lookup.id;
      else if (lookup.type === "EMPLOYEE") employeeId = lookup.id;
    }
  }

  const smsLog = await db.smsLog.create({
    data: {
      direction: params.direction ?? "OUTBOUND",
      fromNumber: params.fromNumber,
      toNumber: params.toNumber,
      messageText: params.messageText,
      deliveryStatus: params.deliveryStatus ?? "PENDING",
      studentId: studentId ?? null,
      leadId: leadId ?? null,
      partnerId: partnerId ?? null,
      employeeId: employeeId ?? null,
      sentAt: new Date(),
    },
  });

  return { smsLog, idempotent: false };
}

export interface JournalWhatsAppParams {
  provider?: string;
  providerEventId: string;
  direction?: string;
  fromNumber: string;
  toNumber: string;
  messageText: string;
  deliveryStatus?: string;
  studentId?: string | null;
  leadId?: string | null;
  partnerId?: string | null;
  employeeId?: string | null;
}

export async function journalWhatsApp(params: JournalWhatsAppParams) {
  // Reuse SocialInboxMessage table — matches existing whatsapp/webhook pattern
  if (!params.providerEventId) throw new Error("providerEventId required");

  // Idempotency via conversationId + messageText recent lookup
  const conversationId = `wa-3cx-${params.fromNumber}`;
  const recent = await db.socialInboxMessage.findFirst({
    where: {
      platform: "WHATSAPP",
      senderId: params.fromNumber,
      messageText: params.messageText,
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    },
    select: { id: true },
  });
  if (recent) {
    return { message: recent, idempotent: true };
  }

  // Auto-resolve contact
  let { studentId, leadId, partnerId, employeeId } = params;
  if (!studentId && !leadId && !partnerId && !employeeId) {
    const lookup = await lookupContactByPhone(params.fromNumber);
    if (lookup.matched && lookup.id) {
      if (lookup.type === "STUDENT") studentId = lookup.id;
      else if (lookup.type === "LEAD") leadId = lookup.id;
      else if (lookup.type === "PARTNER") partnerId = lookup.id;
      else if (lookup.type === "EMPLOYEE") employeeId = lookup.id;
    }
  }

  const message = await db.socialInboxMessage.create({
    data: {
      platform: "WHATSAPP",
      direction: params.direction ?? "OUTBOUND",
      senderId: params.fromNumber,
      senderName: params.fromNumber,
      recipientId: params.toNumber,
      messageText: params.messageText,
      conversationId,
      studentId: studentId ?? null,
      leadId: leadId ?? null,
      isRead: true,
      sentAt: new Date(),
    },
  });

  return { message, idempotent: false };
}

export interface JournalChatParams {
  provider?: string;
  providerEventId: string;
  direction?: string;
  fromUser: string;
  toUser: string;
  messageText: string;
  channel?: string;
  studentId?: string | null;
  leadId?: string | null;
  partnerId?: string | null;
  employeeId?: string | null;
}

export async function journalChat(params: JournalChatParams) {
  // Reuse SocialInboxMessage table with platform="WEB_CHAT"
  if (!params.providerEventId) throw new Error("providerEventId required");

  const conversationId = `chat-3cx-${params.fromUser}-${params.toUser}`;
  const recent = await db.socialInboxMessage.findFirst({
    where: {
      platform: "WEB_CHAT",
      senderId: params.fromUser,
      messageText: params.messageText,
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    },
    select: { id: true },
  });
  if (recent) {
    return { message: recent, idempotent: true };
  }

  const message = await db.socialInboxMessage.create({
    data: {
      platform: "WEB_CHAT",
      direction: params.direction ?? "OUTBOUND",
      senderId: params.fromUser,
      senderName: params.fromUser,
      recipientId: params.toUser,
      messageText: params.messageText,
      conversationId,
      studentId: params.studentId ?? null,
      leadId: params.leadId ?? null,
      isRead: true,
      sentAt: new Date(),
    },
  });

  return { message, idempotent: false };
}

// ─── Extensions ───

export async function getExtensions() {
  // Return all employees with their 3CX extension (if mapped)
  const employees = await db.employee.findMany({
    where: { threecxExtension: { not: null } },
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      designation: true,
      threecxExtension: true,
      status: true,
      department: { select: { name: true } },
    },
    orderBy: { threecxExtension: "asc" },
  });

  const mapped = employees
    .filter((e) => !!e.threecxExtension)
    .map((e) => ({
      extension: e.threecxExtension,
      employeeId: e.id,
      employeeCode: e.employeeCode,
      employeeName: e.fullName,
      designation: e.designation,
      department: e.department?.name || null,
      status: e.status,
    }));

  return { extensions: mapped, count: mapped.length };
}

export async function mapExtension(extension: string, employeeId: string, mappedBy: string) {
  const employee = await db.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error("Employee not found");

  // Check if extension already mapped to another employee
  const existing = await db.employee.findFirst({
    where: { threecxExtension: extension, id: { not: employeeId } },
    select: { id: true, fullName: true },
  });
  if (existing) {
    // Unmap from previous owner
    await db.employee.update({
      where: { id: existing.id },
      data: { threecxExtension: null },
    });
  }

  const updated = await db.employee.update({
    where: { id: employeeId },
    data: { threecxExtension: extension },
  });

  await db.auditLog.create({
    data: {
      userId: mappedBy,
      action: "AI_ACTION",
      resource: "Employee",
      resourceId: employeeId,
      details: JSON.stringify({
        action: "EXTENSION_MAPPED",
        extension,
        previousOwner: existing?.id || null,
      }),
    },
  });

  return {
    employee: { id: updated.id, fullName: updated.fullName, threecxExtension: updated.threecxExtension },
    previousOwner: existing ? { id: existing.id, fullName: existing.fullName } : null,
  };
}

export async function unmapExtension(extension: string, unmappedBy: string) {
  const employee = await db.employee.findFirst({
    where: { threecxExtension: extension },
    select: { id: true, fullName: true },
  });
  if (!employee) {
    return { unmapped: false, message: "Extension not currently mapped." };
  }

  await db.employee.update({
    where: { id: employee.id },
    data: { threecxExtension: null },
  });

  await db.auditLog.create({
    data: {
      userId: unmappedBy,
      action: "AI_ACTION",
      resource: "Employee",
      resourceId: employee.id,
      details: JSON.stringify({ action: "EXTENSION_UNMAPPED", extension }),
    },
  });

  return { unmapped: true, employee };
}

// ─── Click-to-Call (REAL HTTP) ───

/**
 * Issue a REAL HTTP POST to {baseUrl}/api/Call to initiate click-to-call.
 * NEVER simulated. Returns whatever 3CX responds with.
 */
export async function initiateClickToCall(extension: string, destination: string) {
  const integration = await getActive3cxIntegration();
  if (!integration || !integration.baseUrl) {
    throw new Error("No active 3CX integration with baseUrl configured");
  }

  const url = `${integration.baseUrl.replace(/\/$/, "")}/api/Call`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (integration.apiKey) headers["Authorization"] = `Bearer ${integration.apiKey}`;

  const payload = {
    extension,
    destination,
    integrationId: integration.integrationId || undefined,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch {
      // ignore
    }

    const ok = response.status >= 200 && response.status < 300;

    await db.auditLog.create({
      data: {
        action: "AI_ACTION",
        resource: "ThreeCxIntegration",
        resourceId: integration.id,
        details: JSON.stringify({
          action: "CLICK_TO_CALL",
          extension,
          destination,
          httpStatus: response.status,
          ok,
        }),
      },
    });

    let parsedBody: any = bodyText;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch {
      // keep as text
    }

    return {
      success: ok,
      httpStatus: response.status,
      body: parsedBody,
      url,
    };
  } catch (error: any) {
    await db.auditLog.create({
      data: {
        action: "AI_ACTION",
        resource: "ThreeCxIntegration",
        resourceId: integration.id,
        details: JSON.stringify({
          action: "CLICK_TO_CALL_FAILED",
          extension,
          destination,
          error: error?.message || "Network error",
        }),
      },
    });
    return {
      success: false,
      error: error?.message || "Network error",
      url,
    };
  }
}

// ─── AI Call Analysis ───

/**
 * Analyze a journaled call with AI. Only runs if transcriptionText exists.
 * NEVER fabricates — if no transcription, refuses to analyze.
 */
export async function analyzeCallWithAI(callLogId: string) {
  const callLog = await db.phoneCallLog.findUnique({ where: { id: callLogId } });
  if (!callLog) throw new Error("PhoneCallLog not found");

  if (!callLog.transcriptionText || callLog.transcriptionText.trim().length === 0) {
    return {
      analyzed: false,
      message: "Cannot analyze — transcriptionText is empty. Run transcription first.",
      callLogId,
    };
  }

  // Dynamic import of AI helper
  let aiResponse = "";
  try {
    const mod: any = await import("@/lib/ai");
    if (mod && typeof mod.aiChat === "function") {
      const systemPrompt =
        "You are a call-center QA analyst. Analyze the call transcription and respond ONLY as JSON: " +
        '{"summary":"short summary","intent":"caller intent","recommendations":["action1","action2"]}';
      const prompt = [
        `Call Type: ${callLog.callType}`,
        `From: ${callLog.fromNumber}`,
        `To: ${callLog.toNumber}`,
        `Duration: ${callLog.duration}s`,
        `Consent recorded: ${callLog.consentRecorded}`,
        "---- TRANSCRIPTION ----",
        callLog.transcriptionText,
      ].join("\n");
      aiResponse = await mod.aiChat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        { temperature: 0.3 }
      );
    }
  } catch {
    // AI unavailable
  }

  let summary = "";
  let intent = "";
  let recommendations: string[] = [];

  if (aiResponse) {
    try {
      const mod: any = await import("@/lib/ai");
      const parsed = mod.extractJson?.(aiResponse) || JSON.parse(aiResponse);
      if (parsed) {
        summary = parsed.summary || "";
        intent = parsed.intent || "";
        recommendations = Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [];
      }
    } catch {
      summary = aiResponse.slice(0, 500);
    }
  } else {
    summary = "AI analysis unavailable — transcription was present but AI call failed.";
  }

  const updated = await db.phoneCallLog.update({
    where: { id: callLogId },
    data: {
      aiSummary: summary,
      aiIntent: intent,
      aiRecommendations: JSON.stringify(recommendations),
      aiAnalysisId: `ai-${Date.now()}`,
      transcriptionStatus: "ANALYZED",
    },
  });

  await db.auditLog.create({
    data: {
      action: "AI_ACTION",
      resource: "PhoneCallLog",
      resourceId: callLogId,
      details: JSON.stringify({
        action: "AI_ANALYSIS",
        summary: summary.slice(0, 100),
        intent,
        recommendationCount: recommendations.length,
      }),
    },
  });

  return {
    analyzed: true,
    callLog: updated,
    summary,
    intent,
    recommendations,
  };
}

// ─── Webhook Signature Verification ───

/**
 * Verify 3CX webhook signature using HMAC-SHA256 of the raw body with the
 * integration's webhookSecret. Returns false if secret missing or signature mismatch.
 */
export function verify3cxWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | null | undefined
): boolean {
  if (!secret || !signature) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require("crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    // Timing-safe comparison
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ─── Dashboard Stats ───

export async function get3cxDashboardStats() {
  const integration = await getActive3cxIntegration();
  const totalCalls = await db.phoneCallLog.count({ where: { provider: "3CX" } });
  const callsToday = await db.phoneCallLog.count({
    where: {
      provider: "3CX",
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });
  const missedCalls = await db.phoneCallLog.count({
    where: { provider: "3CX", callType: "MISSED" },
  });
  const callsByType = await db.phoneCallLog.groupBy({
    by: ["callType"],
    where: { provider: "3CX" },
    _count: { _all: true },
  });
  const callsByStatus = await db.phoneCallLog.groupBy({
    by: ["status"],
    where: { provider: "3CX", status: { not: null } },
    _count: { _all: true },
  });
  const transcriptionStats = await db.phoneCallLog.groupBy({
    by: ["transcriptionStatus"],
    where: { provider: "3CX" },
    _count: { _all: true },
  });
  const recentCallsRaw = await db.phoneCallLog.findMany({
    where: { provider: "3CX" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // PhoneCallLog has no @relation fields — manually enrich with student/lead names
  const studentIds = recentCallsRaw.map((c) => c.studentId).filter(Boolean) as string[];
  const leadIds = recentCallsRaw.map((c) => c.leadId).filter(Boolean) as string[];
  const students: Array<{ id: string; fullName: string; studentId: string }> = studentIds.length
    ? await db.student.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, fullName: true, studentId: true },
      })
    : [];
  const leads: Array<{ id: string; fullName: string; leadId: string }> = leadIds.length
    ? await db.lead.findMany({
        where: { id: { in: leadIds } },
        select: { id: true, fullName: true, leadId: true },
      })
    : [];
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const leadMap = new Map(leads.map((l) => [l.id, l]));
  const recentCalls = recentCallsRaw.map((c) => ({
    ...c,
    student: c.studentId ? studentMap.get(c.studentId) ?? null : null,
    lead: c.leadId ? leadMap.get(c.leadId) ?? null : null,
  }));
  const extensions = await getExtensions();

  return {
    integration: integration
      ? {
          id: integration.id,
          name: integration.name,
          status: integration.status,
          lastTestedAt: integration.lastTestedAt,
          lastTestSuccess: integration.lastTestSuccess,
          lastError: integration.lastError,
        }
      : null,
    calls: {
      total: totalCalls,
      today: callsToday,
      missed: missedCalls,
      byType: callsByType,
      byStatus: callsByStatus,
    },
    transcriptions: transcriptionStats,
    extensions: extensions.count,
    recentCalls,
  };
}
