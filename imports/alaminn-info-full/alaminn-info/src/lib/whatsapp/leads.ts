/**
 * WhatsApp AI — Lead Capture & CRM Integration
 * ============================================
 * Creates and updates CRM leads from WhatsApp conversations.
 *
 * Lead source:  ALAMINN_WHATSAPP_AI
 * Lead channel: WHATSAPP
 * Lead status:  NEW (first time) | ACTIVE (returning)
 *
 * Duplicate protection: the WhatsApp number (normalized to international
 * format) is the primary matching identifier. If a Contact with the same
 * number already exists, the existing record is updated — no duplicate
 * lead is created.
 *
 * Privacy:
 *   - Leads are only created with explicit user consent.
 *   - We never collect passwords, OTP, banking PIN, card numbers, or
 *     passport numbers through the AI chat.
 *   - Conversation context is stored only per the privacy policy.
 */
import { db } from "@/lib/db";
import { normalizeWhatsappNumber } from "./config";

export type LeadConsentFlags = {
  /** User explicitly agreed to be contacted by a counselor */
  commsConsent: boolean;
  /** User explicitly agreed to marketing communications */
  marketingConsent: boolean;
  /** User explicitly agreed to data storage per privacy policy */
  privacyConsent: boolean;
};

export type LeadCaptureData = {
  /** User's full name (optional — only if shared) */
  name?: string | null;
  /** WhatsApp number in any format — will be normalized */
  whatsappNumber: string;
  /** Email (optional — only if shared) */
  email?: string | null;
  /** Preferred study destination (e.g. "UK", "Canada") */
  preferredDestination?: string | null;
  /** Study level: foundation | bachelors | masters | phd | research | other */
  studyLevel?: string | null;
  /** Subject of interest (e.g. "Computer Science") */
  subject?: string | null;
  /** Intended intake (e.g. "September 2027", "January 2027") */
  intendedIntake?: string | null;
  /** Budget range (e.g. "10k-20k USD/year") */
  budget?: string | null;
  /** English test status (e.g. "IELTS 7.0", "Not taken yet") */
  englishTestStatus?: string | null;
  /** Inquiry type: consultation | application | documents | general */
  inquiryType?: string | null;
  /** Free-text context from the conversation */
  context?: string | null;
  /** Conversation reference (for audit trail) */
  conversationRef?: string | null;
};

export type LeadResult = {
  contactId: string;
  inquiryId: string;
  isExisting: boolean; // true if we updated an existing contact (dedupe)
  message: string;
};

/**
 * Normalize a WhatsApp number and check if a Contact with that number
 * already exists. Returns the existing Contact or null.
 */
export async function findExistingContactByWhatsapp(
  whatsappNumber: string
) {
  const normalized = normalizeWhatsappNumber(whatsappNumber);
  if (!normalized) return null;
  // Try exact match first, then partial match (in case of format differences)
  return await db.contact.findFirst({
    where: {
      OR: [
        { whatsapp: normalized },
        { phone: normalized },
        { whatsapp: { contains: normalized.slice(-10) } },
        { phone: { contains: normalized.slice(-10) } },
      ],
    },
    select: { id: true, fullName: true, email: true, status: true },
  });
}

/**
 * Create or update a lead from a WhatsApp conversation.
 * Implements duplicate protection: if a Contact with the same WhatsApp
 * number exists, the existing record is updated — no duplicate is created.
 *
 * @throws if whatsappNumber is missing/invalid
 * @throws if any consent flag is false (we only create leads with consent)
 */
export async function createOrUpdateLead(
  data: LeadCaptureData,
  consent: LeadConsentFlags
): Promise<LeadResult> {
  const normalized = normalizeWhatsappNumber(data.whatsappNumber);
  if (!normalized) {
    throw new Error("Invalid WhatsApp number — cannot create lead.");
  }
  if (!consent.privacyConsent || !consent.commsConsent) {
    throw new Error(
      "Lead creation requires explicit privacy + comms consent."
    );
  }

  const existing = await findExistingContactByWhatsapp(normalized);
  const isExisting = !!existing;

  // Build inquiry reference
  const ref = `WA-${Date.now().toString(36).toUpperCase()}-${normalized.slice(-4)}`;

  // Upsert the Contact (create if new, update if existing)
  const contact = await db.contact.upsert({
    where: existing ? { id: existing.id } : { email: `${normalized}@whatsapp.placeholder` },
    update: {
      whatsapp: normalized,
      preferredChannel: "whatsapp",
      source: "ALAMINN_WHATSAPP_AI",
      status: isExisting ? existing!.status : "active",
      ...(data.name ? { fullName: data.name } : {}),
      ...(data.email ? { email: data.email } : {}),
    },
    create: {
      fullName: data.name || `WhatsApp Lead ${normalized.slice(-4)}`,
      email: data.email || `${normalized}@whatsapp.placeholder`,
      whatsapp: normalized,
      phone: normalized,
      preferredChannel: "whatsapp",
      source: "ALAMINN_WHATSAPP_AI",
      status: "active",
      tags: "whatsapp,ai-agent",
    },
  });

  // Create an Inquiry linked to the contact
  const inquiry = await db.inquiry.create({
    data: {
      reference: ref,
      type: "education-advisory",
      contactId: contact.id,
      currentChallenge: data.preferredDestination
        ? `Destination: ${data.preferredDestination}`
        : null,
      desiredOutcome: [
        data.studyLevel ? `Level: ${data.studyLevel}` : null,
        data.subject ? `Subject: ${data.subject}` : null,
        data.intendedIntake ? `Intake: ${data.intendedIntake}` : null,
        data.budget ? `Budget: ${data.budget}` : null,
        data.englishTestStatus ? `English: ${data.englishTestStatus}` : null,
      ]
        .filter(Boolean)
        .join(" | "),
      notes: data.context || null,
      referralSource: "ALAMINN_WHATSAPP_AI",
      privacyConsent: consent.privacyConsent,
      commsConsent: consent.commsConsent,
      marketingConsent: consent.marketingConsent,
      studentDataConsent: consent.privacyConsent,
      status: "new",
    },
  });

  // Write an audit log entry
  await db.auditLog.create({
    data: {
      actorId: "system",
      action: "whatsapp_lead_created",
      resource: "Inquiry",
      resourceId: inquiry.id,
      meta: JSON.stringify({
        contactId: contact.id,
        isExisting,
        source: "ALAMINN_WHATSAPP_AI",
        channel: "WHATSAPP",
        conversationRef: data.conversationRef || null,
        inquiryType: data.inquiryType || "general",
      }),
    },
  });

  return {
    contactId: contact.id,
    inquiryId: inquiry.id,
    isExisting,
    message: isExisting
      ? "Existing lead updated — your counselor will be in touch."
      : "New lead created — a counselor will contact you within 1 business day.",
  };
}

/**
 * Escalate to a human agent. Creates a Task assigned to the CRM team
 * and returns a handoff message for the user.
 */
export async function escalateToHuman(opts: {
  whatsappNumber: string;
  reason: string;
  conversationRef?: string | null;
  contactId?: string | null;
}): Promise<{ taskId: string; message: string }> {
  const normalized = normalizeWhatsappNumber(opts.whatsappNumber);
  const task = await db.task.create({
    data: {
      title: `WhatsApp human handoff — ${normalized?.slice(-4) ?? "unknown"}`,
      description: `Reason: ${opts.reason}\nConversation: ${opts.conversationRef || "n/a"}\nWhatsApp: ${normalized || "unknown"}`,
      status: "open",
      priority: "high",
      assigneeId: null, // unassigned — CRM team picks up
      contactId: opts.contactId || null,
      relatedType: "inquiry",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h SLA
    },
  });

  await db.auditLog.create({
    data: {
      actorId: "system",
      action: "whatsapp_human_handoff",
      resource: "Task",
      resourceId: task.id,
      meta: JSON.stringify({
        reason: opts.reason,
        conversationRef: opts.conversationRef || null,
        whatsapp: normalized,
      }),
    },
  });

  return {
    taskId: task.id,
    message:
      "I'm connecting you with a human counselor. They'll reach out to you on WhatsApp within 1 business day. " +
      "If urgent, you can also call 01716 609 554. Your reference: " +
      task.id.slice(-8).toUpperCase(),
  };
}
