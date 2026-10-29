// ============================================================================
// §131 — WhatsApp media-by-link payloads (official Cloud API), pure logic.
// No db / no network — fully unit-testable. Used by whatsapp-cloud-api.
// ============================================================================

export const WHATSAPP_MEDIA_TYPES = ["document", "image", "audio", "video"] as const;
export type WhatsAppMediaType = (typeof WHATSAPP_MEDIA_TYPES)[number];

export interface SendWhatsAppMediaParams {
  to: string;                   // phone (any format — normalized internally)
  mediaType: WhatsAppMediaType; // document | image | audio | video
  link: string;                 // publicly reachable https URL of the media
  fileName?: string;            // document filename (document only)
  caption?: string;             // short caption shown with document/image/video
}

export interface SendWhatsAppUploadedMediaParams {
  mediaType: 'document' | 'image';
  mediaId: string;
  fileName?: string;
  caption?: string;
}

/** Pure payload builder for media uploaded to Meta using the official Cloud API. */
export function buildWhatsAppUploadedMediaPayload(toNormalized: string, p: SendWhatsAppUploadedMediaParams): Record<string, unknown> {
  const media: Record<string, unknown> = { id: p.mediaId };
  if (p.mediaType === 'document' && p.fileName) media.filename = p.fileName;
  if (p.caption) media.caption = p.caption;
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: toNormalized,
    type: p.mediaType,
    [p.mediaType]: media,
  };
}

/** Pure payload builder — media-by-link per the official Cloud API contract. */
export function buildWhatsAppMediaPayload(toNormalized: string, p: SendWhatsAppMediaParams): Record<string, unknown> {
  const media: Record<string, unknown> = { link: p.link };
  if (p.mediaType === "document" && p.fileName) media.filename = p.fileName;
  if (p.caption && p.mediaType !== "audio") media.caption = p.caption;
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toNormalized,
    type: p.mediaType,
    [p.mediaType]: media,
  };
}

/** Input validation — evaluated before credentials and before any network call. */
export function validateWhatsAppMediaRequest(params: SendWhatsAppMediaParams): { ok: true } | { ok: false; error: string } {
  if (!WHATSAPP_MEDIA_TYPES.includes(params.mediaType)) {
    return { ok: false, error: `mediaType must be one of ${WHATSAPP_MEDIA_TYPES.join(", ")}` };
  }
  if (!params.link || !/^https:\/\//.test(params.link)) {
    return { ok: false, error: "An https media link is required (WhatsApp Cloud API fetches media by URL)" };
  }
  return { ok: true };
}

/** Honest configuration check — §175: never fabricate a send when not configured. */
export function whatsappCloudConfigError(): string | null {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || process.env.WHATSAPP_GRAPH_API_VERSION || process.env.WHATSAPP_API_VERSION || 'v22.0';
  if (!token) return 'not configured — WHATSAPP_ACCESS_TOKEN or WHATSAPP_TOKEN is required';
  if (!/^v\d+\.\d+$/.test(graphVersion.trim())) {
    return 'not configured — a valid WHATSAPP_GRAPH_VERSION is required';
  }
  return null;
}
