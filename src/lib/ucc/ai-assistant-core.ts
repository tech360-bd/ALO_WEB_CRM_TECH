// ============================================================================
// ALO UCC AI Assistant — honest core (§121 IMPORTANT, §165, §166, §175)
//
// Rules enforced here:
//  - NEVER invent information. Every suggestion/prefill/summary is derived
//    exclusively from the conversation record and linked data passed in.
//  - §166 context protection: access must be proven BEFORE retrieval. The
//    route must call assertConversationAccess() with the employee identity
//    and only then load message content.
//  - When a capability needs an external provider that is not configured
//    (e.g. machine translation), the answer is CONFIGURATION REQUIRED —
//    never a canned fake translation.
// Pure functions, no db access — fully unit-testable.
// ============================================================================

export interface UccConversationView {
  id: string;
  channel: string;
  participantName: string;
  participantPhone?: string | null;
  participantEmail?: string | null;
  studentId?: string | null;
  leadId?: string | null;
  assignedToUserId?: string | null;
  destinationCountry?: string | null;
  status: string;
  priority: string;
  lastMessageText?: string | null;
  lastMessageAt?: Date | null;
  unreadCount: number;
}

export interface UccMessageView {
  id: string;
  direction: string; // inbound | outbound | system | internal_note
  senderName: string;
  messageType: string; // text | image | document | voice | ...
  content: string;
  status: string; // sent | delivered | read | failed
  createdAt: Date;
}

export interface AssistantActor {
  userId?: string | null;
  role?: string | null;
  employeeId?: string | null;
}

// Roles allowed to view ANY conversation (supervision); everyone else must
// be the assigned employee. Mirrors the proxy/ROLE_ROUTES supervision family.
export const CONVERSATION_SUPERVISOR_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "BRANCH_MANAGER",
]);

/** §166 — returns true when the actor may retrieve this conversation. */
export function canAccessConversation(actor: AssistantActor, conversation: UccConversationView): boolean {
  const role = String(actor.role || "").toUpperCase();
  if (CONVERSATION_SUPERVISOR_ROLES.has(role)) return true;
  if (!conversation.assignedToUserId) return false;
  return (
    conversation.assignedToUserId === actor.userId ||
    conversation.assignedToUserId === actor.employeeId
  );
}

/** §166 enforce-before-retrieval gate for the route. Throws with status code. */
export function assertConversationAccess(actor: AssistantActor, conversation: UccConversationView | null): asserts conversation is UccConversationView {
  if (!conversation) {
    throw Object.assign(new Error("Conversation not found"), { statusCode: 404 });
  }
  if (!canAccessConversation(actor, conversation)) {
    throw Object.assign(
      new Error("Forbidden — conversation is not assigned to you (§166: permission is enforced before retrieval)"),
      { statusCode: 403 },
    );
  }
}

// ---------------------------------------------------------------------------
// §165 conversation summary — deterministic, data-derived only.
// ---------------------------------------------------------------------------

export interface ConversationSummary {
  summary: string;
  openIssues: string[];
  lastInboundMessage?: string;
  channelStats: Record<string, number>;
  attachmentCount: number;
  awaitingResponse: boolean;
  linked: { studentId?: string; leadId?: string };
  /** §165 — who is responsible for this conversation right now. */
  responsibleEmployee: string; // user/employee id, or "Unassigned"
  /**
   * §165 — missing information explicitly derivable from the record.
   * Never guessed: only surfaced when the absence is observable
   * (e.g. no student/lead link, no phone number on record).
   */
  missingInformation: string[];
  /** §165 — a deadline is shown only when one exists on the linked record; otherwise null (never invented). */
  deadline: string | null;
  nextAction: string;
  basisNote: string;
}

const FAILSAFE_NEXT_ACTION = "Review the conversation and reply manually; AI drafted nothing — no invented content.";

export function summarizeConversation(
  conversation: UccConversationView,
  messages: UccMessageView[],
): ConversationSummary {
  const chatMessages = messages.filter((m) => m.direction !== "system" && m.direction !== "internal_note");
  const inbound = chatMessages.filter((m) => m.direction === "inbound");
  const lastInbound = inbound[inbound.length - 1];
  const lastAny = chatMessages[chatMessages.length - 1];

  const channelStats: Record<string, number> = {};
  for (const m of chatMessages) {
    channelStats[m.direction] = (channelStats[m.direction] || 0) + 1;
  }

  // Open issues: inbound messages that look like a request/question and have
  // no later outbound reply.
  const lastOutboundIdx = chatMessages.reduce(
    (acc, m, i) => (m.direction === "outbound" ? i : acc),
    -1,
  );
  const openIssues: string[] = [];
  chatMessages.forEach((m, i) => {
    if ((m.direction !== "inbound" && m.direction !== "system") /* inbound only */) return;
    if (m.direction !== "inbound") return;
    if (i > lastOutboundIdx && m.messageType === "text") {
      const text = m.content.trim();
      if (text) openIssues.push(text.length > 160 ? `${text.slice(0, 157)}…` : text);
    }
  });

  const attachmentCount = chatMessages.filter((m) => m.messageType !== "text").length;
  const awaitingResponse = !!lastInbound && lastAny?.direction === "inbound";

  const parts: string[] = [];
  parts.push(
    `${conversation.participantName} (${conversation.channel}) — ${chatMessages.length} message(s), ` +
      `${inbound.length} inbound. Status: ${conversation.status}; priority: ${conversation.priority}.`,
  );
  if (lastInbound) {
    parts.push(
      `Last inbound (${lastInbound.messageType}): "${truncate(lastInbound.content, 140)}"`,
    );
  }
  if (attachmentCount > 0) parts.push(`${attachmentCount} non-text message(s) (attachment/voice/image).`);
  parts.push(
    conversation.studentId
      ? `Linked student ${conversation.studentId}${conversation.leadId ? ` and lead ${conversation.leadId}` : ""}.`
      : conversation.leadId
        ? `Linked lead ${conversation.leadId}.`
        : "No student/lead matched yet.",
  );

  // §165 — responsible employee + missing information + deadline,
  // each derived from observable record state, never invented.
  const responsibleEmployee = conversation.assignedToUserId || "Unassigned";
  const missingInformation: string[] = [];
  if (!conversation.studentId && !conversation.leadId) {
    missingInformation.push("Identity link missing — contact match unresolved (no student or lead record).");
  }
  if (!conversation.participantPhone && !conversation.participantEmail) {
    missingInformation.push("No phone or email on record for this participant.");
  }
  const deadline: string | null = null; // conversation record has no deadline field — shown as null, never invented

  return {
    summary: parts.join(" "),
    openIssues,
    lastInboundMessage: lastInbound ? lastInbound.content : undefined,
    channelStats,
    attachmentCount,
    awaitingResponse,
    linked: {
      studentId: conversation.studentId || undefined,
      leadId: conversation.leadId || undefined,
    },
    responsibleEmployee,
    missingInformation,
    deadline,
    nextAction: awaitingResponse
      ? "Reply to the participant's last inbound message (draft from an approved template if useful)."
      : FAILSAFE_NEXT_ACTION,
    basisNote:
      "Derived only from stored conversation data (§165: the original conversation remains accessible; §175: no invented content).",
  };
}

function truncate(s: string, n: number): string {
  const t = (s || "").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

// ---------------------------------------------------------------------------
// Reply suggestions — template-driven only (§130: sent as drafts with review)
// ---------------------------------------------------------------------------

export interface ReplyTemplate {
  templateCode: string;
  templateName: string;
  channel: string;
  body: string; // may contain {{name}}, {{country}}, …
}

export function fillTemplate(templateBody: string, conversation: UccConversationView): string {
  return templateBody
    .replaceAll("{{name}}", conversation.participantName || "")
    .replaceAll("{{country}}", conversation.destinationCountry || "")
    .replaceAll("{{studentId}}", conversation.studentId || "")
    .replaceAll("{{leadId}}", conversation.leadId || "")
    .replaceAll("{{phone}}", conversation.participantPhone || "")
    .replaceAll("{{email}}", conversation.participantEmail || "")
    .replaceAll("{{counselor}}", "") // never invent a counselor name
    .replace(/  +/g, " ")
    .trim();
}

export function buildReplySuggestions(
  templatesValue: ReplyTemplate[],
  conversation: UccConversationView,
): string[] {
  const channelCompatible = templatesValue.filter(
    (t) => t.channel.toLowerCase() === conversation.channel.toLowerCase() || t.channel.toLowerCase() === "all",
  );
  return channelCompatible
    .slice(0, 3)
    .map((t) => fillTemplate(t.body, conversation))
    .filter((text) => text.length > 0);
}

// ---------------------------------------------------------------------------
// Form prefill — real fields only (§175: never invent a profile).
// ---------------------------------------------------------------------------

export function buildFormPrefill(conversation: UccConversationView): Record<string, string> {
  return {
    studentName: conversation.participantName || "",
    email: conversation.participantEmail || "",
    phone: conversation.participantPhone || "",
    destinationCountry: conversation.destinationCountry || "",
    studentId: conversation.studentId || "",
    leadId: conversation.leadId || "",
    // Other fields stay EMPTY by design — the employee fills them; the system
    // must not fabricate intake/score/funding claims.
    targetIntake: "",
    preferredCourse: "",
    fundingSponsor: "",
    englishScore: "",
  };
}

// ---------------------------------------------------------------------------
// Provider-gated capabilities
// ---------------------------------------------------------------------------

export const TRANSLATION_CONFIGURATION_REQUIRED =
  "CONFIGURATION REQUIRED — no translation provider is configured (§121: configure official provider credentials instead of faking a translation).";
