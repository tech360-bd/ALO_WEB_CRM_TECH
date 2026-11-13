// ============================================================================
// ALO Employee Access System — object/record/field scope decision kernel.
//
// The spec's FEATURE ACCESS ENGINE mandates these backend helpers:
//   canAccessApplication(user_id, application_id)
//   canAccessDocument(user_id, document_id)
//   canSendCommunication(user_id, channel, target_id)
// Their DECISION LOGIC lives here as pure functions (fully unit-testable,
// no db); the db-backed wrappers are in src/lib/access-check-engine.ts.
//
// ABSOLUTE SECURITY RULE: decisions are computed server-side from the
// authenticated principal, role, scope flags and record ownership —
// never from client-provided claims.
// ============================================================================

export const MASTER_ROLES = new Set(["SUPER_ADMIN"]);

/** Scope resolution inputs — facts about the actor and the record. */
export interface ObjectScopeInput {
  roles: string[];              // authenticated roles (uppercased by caller or here)
  isOwner?: boolean;            // actor owns the record (own data)
  isAssigned?: boolean;         // record is assigned to the actor (ASSIGNED scope)
  sameBranch?: boolean;         // actor's branch == record's branch (BRANCH scope)
  sameDepartment?: boolean;     // actor's department == record's department
  hasExplicitRule?: boolean;    // an enabled FeatureAccessRule grants this user/role the feature
}

export type ScopeDecision = { allowed: boolean; reason: string };

/**
 * Central record-level decision:
 *   GLOBAL (master roles) > explicit feature rule > ASSIGNMENT/ONWNERSHIP >
 *   BRANCH/DEPARTMENT scope > deny (least privilege).
 */
export function evaluateObjectScope(input: ObjectScopeInput): ScopeDecision {
  const roles = (input.roles || []).map((r) => String(r).toUpperCase());
  if (roles.some((r) => MASTER_ROLES.has(r))) {
    return { allowed: true, reason: "GLOBAL scope — master role" };
  }
  if (input.hasExplicitRule) {
    return { allowed: true, reason: "Explicit enabled FeatureAccessRule" };
  }
  if (input.isAssigned) {
    return { allowed: true, reason: "ASSIGNED scope — record is assigned to user" };
  }
  if (input.isOwner) {
    return { allowed: true, reason: "OWN scope — user owns this record" };
  }
  if (roles.includes("BRANCH_MANAGER") && input.sameBranch) {
    return { allowed: true, reason: "BRANCH scope — branch manager within own branch" };
  }
  if (input.sameDepartment && (roles.includes("DEPARTMENT_MANAGER") || roles.includes("TEAM_LEADER"))) {
    return { allowed: true, reason: "DEPARTMENT/TEAM scope within own department" };
  }
  return { allowed: false, reason: "Denied — no scope grants access (least privilege)" };
}

/** Channels the spec mandates for the communication access matrix. */
export const COMMUNICATION_CHANNELS = [
  "whatsapp", "email", "phone", "sms",
  "facebook", "instagram", "linkedin", "x", "youtube", "tiktok",
] as const;
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export function isCommunicationChannel(v: string): v is CommunicationChannel {
  return (COMMUNICATION_CHANNELS as readonly string[]).includes(String(v).toLowerCase());
}

/** Feature key conventions — matches feature-access rules seeding. */
export function channelFeatureKey(channel: string): string {
  const c = String(channel).toLowerCase();
  return c === "phone" ? "communication.phone_call" : `communication.${c}`;
}

/** spec: external contact identity uses phone_normalized + country_code. */
export function deriveCountryCode(normalizedPhoneDigits: string): string {
  const digits = String(normalizedPhoneDigits || "").replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith("880")) return "880";   // Bangladesh
  if (digits.startsWith("91")) return "91";     // India
  if (digits.startsWith("92")) return "92";     // Pakistan
  if (digits.startsWith("977")) return "977";   // Nepal
  if (digits.startsWith("94")) return "94";     // Sri Lanka
  if (digits.startsWith("971")) return "971";   // UAE
  if (digits.startsWith("966")) return "966";   // Saudi Arabia
  if (digits.startsWith("44")) return "44";     // United Kingdom
  if (digits.startsWith("1")) return "1";       // US/Canada
  return "";
}
