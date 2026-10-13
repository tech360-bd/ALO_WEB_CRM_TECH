/**
 * WEBHOOK IDEMPOTENCY & PROVIDER STATUS MAPPING (spec §170-§173)
 * ============================================================
 * Spec §171 is mandatory: "Webhook/message processing must be idempotent. The same
 * WhatsApp webhook must not create duplicate messages, documents, leads, students
 * or tasks. Use provider message IDs/event IDs."
 *
 * The existing webhook fell back to `Date.now()` for event IDs in three places,
 * which is exactly the failure mode the spec forbids: every retry of the same
 * provider event produced a NEW id, so duplicate processing was possible. These
 * helpers derive ids from the provider payload instead, and are pure so the
 * behaviour is testable without a database.
 *
 * §173 is also encoded here: "API accepted" is NOT "delivered". Meta returns a
 * wamid on acceptance; delivery and read arrive later as separate status events.
 */

export type MessageDeliveryStatus = 'accepted' | 'sent' | 'delivered' | 'read' | 'failed';

/** Provider status value → internal state. Unknown values never become 'delivered'. */
export function mapProviderStatus(rawStatus: unknown): MessageDeliveryStatus | null {
  const value = String(rawStatus ?? '').trim().toLowerCase();
  switch (value) {
    case 'sent':
      return 'sent';
    case 'delivered':
      return 'delivered';
    case 'read':
      return 'read';
    case 'failed':
    case 'undeliverable':
    case 'rejected':
    case 'deleted':
      return 'failed';
    case 'accepted':
      return 'accepted';
    // Meta also sends 'warning' (e.g. a business-account quality notice) — that is
    // not a delivery state and must not be recorded as one.
    default:
      return null;
  }
}

/** Statuses that prove the message left the provider, not merely that it was accepted. */
export function isProofOfDelivery(status: MessageDeliveryStatus | null): boolean {
  return status === 'delivered' || status === 'read';
}

/** Never regress a message from read back to sent when events arrive out of order. */
const STATUS_RANK: Record<MessageDeliveryStatus, number> = {
  accepted: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  // A failure is terminal and must always win, whatever order it arrives in.
  failed: 99,
};

export function shouldApplyStatus(current: MessageDeliveryStatus | null, incoming: MessageDeliveryStatus): boolean {
  if (!current) return true;
  if (incoming === 'failed') return true;
  if (current === 'failed') return false;
  return STATUS_RANK[incoming] >= STATUS_RANK[current];
}

export interface DerivedEventId {
  eventId: string;
  /** Which provider identifier the id came from — useful in logs and audits. */
  source: 'provider_event' | 'message_status' | 'message_inbound' | 'payload_hash';
  /** True when the id is stable across retries of the same event. */
  deterministic: boolean;
}

function hashPayload(payload: unknown): string {
  // FNV-1a: tiny, dependency-free, and stable across processes — unlike Date.now().
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload ?? '');
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Derive a stable webhook event id.
 *
 * Preference order (most to least authoritative):
 *   1. the provider's own event/message identifier;
 *   2. "<messageId>:<status>" for status callbacks;
 *   3. a hash of the raw payload — still deterministic across retries, which is
 *      the property `Date.now()` never had.
 *
 * The `source` is returned so callers can tell whether they had a real provider
 * id; a payload-hash id is the weakest form and is flagged as such.
 */
export function deriveWebhookEventId(params: {
  provider?: string;
  eventId?: string | null;
  messageId?: string | null;
  status?: string | null;
  eventType?: string;
  payload?: unknown;
}): DerivedEventId {
  const provider = (params.provider || 'provider').toLowerCase();
  const eventId = (params.eventId || '').trim();
  if (eventId) return { eventId: `${provider}:${eventId}`, source: 'provider_event', deterministic: true };

  const messageId = (params.messageId || '').trim();
  if (messageId) {
    const status = (params.status || '').trim().toLowerCase();
    return {
      eventId: status ? `${provider}:${messageId}:${status}` : `${provider}:${messageId}`,
      source: status ? 'message_status' : 'message_inbound',
      deterministic: true,
    };
  }

  return {
    eventId: `${provider}:${params.eventType || 'event'}:${hashPayload(params.payload)}`,
    source: 'payload_hash',
    deterministic: true,
  };
}

/**
 * Has this event already been handled?
 *
 * Callers persist `deriveWebhookEventId().eventId` and pass the stored ids here.
 * Kept as a function (rather than an inline `includes`) so the rule — and the
 * reason it exists — travels with the id format.
 */
export function isDuplicateEvent(eventId: string, alreadyProcessed: Iterable<string>): boolean {
  if (!eventId) return false;
  const seen = alreadyProcessed instanceof Set ? alreadyProcessed : new Set(alreadyProcessed);
  return seen.has(eventId);
}

/**
 * Normalise an inbound WhatsApp payload into the events the CRM must store,
 * de-duplicated by (messageId, status). Meta can repeat entries inside one batch,
 * so dedupe must happen before any database write (spec §171).
 */
export interface InboundEvent {
  eventId: string;
  kind: 'message' | 'status';
  messageId: string;
  status: MessageDeliveryStatus | null;
  from?: string;
  text?: string;
  timestamp?: string;
  mediaId?: string;
  mediaType?: string;
}

interface RawWhatsAppPayload {
  entry?: Array<{
    id?: string;
    changes?: Array<{
      value?: {
        messages?: Array<{ id?: string; from?: string; timestamp?: string; type?: string; text?: { body?: string }; image?: { id?: string }; document?: { id?: string; filename?: string }; audio?: { id?: string } }>;
        statuses?: Array<{ id?: string; status?: string; recipient_id?: string; timestamp?: string }>;
      };
    }>;
  }>;
}

/** Extract the deduplicated event list from a WhatsApp Cloud API webhook body. */
export function extractInboundEvents(payload: RawWhatsAppPayload): InboundEvent[] {
  const events: InboundEvent[] = [];
  const seen = new Set<string>();
  const entries = payload?.entry ?? [];

  for (const entry of entries) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value ?? {};

      for (const message of value.messages ?? []) {
        const messageId = String(message.id ?? '');
        if (!messageId) continue;
        const derived = deriveWebhookEventId({ provider: 'whatsapp', messageId, eventType: 'inbound' });
        if (isDuplicateEvent(derived.eventId, seen)) continue;
        seen.add(derived.eventId);
        const mediaId = message.document?.id || message.image?.id || message.audio?.id || undefined;
        events.push({
          eventId: derived.eventId,
          kind: 'message',
          messageId,
          status: null,
          from: message.from,
          text: message.text?.body,
          timestamp: message.timestamp,
          mediaId,
          mediaType: message.document ? 'document' : message.image ? 'image' : message.audio ? 'audio' : message.type,
        });
      }

      for (const status of value.statuses ?? []) {
        const messageId = String(status.id ?? '');
        if (!messageId) continue;
        const mapped = mapProviderStatus(status.status);
        if (!mapped) continue; // 'warning' and other non-delivery values are ignored
        const derived = deriveWebhookEventId({ provider: 'whatsapp', messageId, status: mapped, eventType: 'status' });
        if (isDuplicateEvent(derived.eventId, seen)) continue;
        seen.add(derived.eventId);
        events.push({ eventId: derived.eventId, kind: 'status', messageId, status: mapped, timestamp: status.timestamp });
      }
    }
  }

  return events;
}
