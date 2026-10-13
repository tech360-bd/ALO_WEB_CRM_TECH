/**
 * WhatsApp AI Agent — public API.
 * Re-exports everything that routes/admin-pages need.
 *
 * Server-only. Do not import from client components — use
 * @/components/site/whatsapp instead for client-side helpers.
 */
export {
  whatsappConfig,
  buildWhatsappUrl,
  buildWhatsappHandoffUrl,
  normalizeWhatsappNumber,
  displayWhatsappNumber,
  getAgentStatus,
  AI_MODE_LABELS,
  STATUS_LABELS,
  type WhatsappAgentStatus,
  type WhatsappMessageStatus,
} from "./config";

export {
  classifyIntent,
  isHumanHandoffRequest,
  ALL_INTENTS,
  INTENT_LABELS,
  type WhatsappIntent,
} from "./intents";

export {
  retrieveKnowledge,
  getCountryBySlug,
  listCountries,
  type KnowledgeResult,
  type UniversityResult,
  type CourseResult,
  type ScholarshipResult,
  type CountryResult,
  type SupervisorResult,
  type PhdResult,
} from "./knowledge";

export {
  createOrUpdateLead,
  escalateToHuman,
  findExistingContactByWhatsapp,
  type LeadCaptureData,
  type LeadConsentFlags,
  type LeadResult,
} from "./leads";

export {
  processAgentMessage,
  applySafetyGuardrails,
  getAgentMetrics,
  GREETING_MESSAGE,
  type AgentRequest,
  type AgentResponse,
  type AgentAction,
  type AgentMessage,
} from "./agent";

export {
  sendWhatsappMessage,
  parseInboundWebhook,
  type SendResult,
  type InboundMessage,
} from "./sender";
