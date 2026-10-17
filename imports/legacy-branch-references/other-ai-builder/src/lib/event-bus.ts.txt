/**
 * Event Bus — Lightweight in-process pub/sub + persistence.
 *
 * - subscribe(eventType, handler) — register an in-process subscriber.
 * - emit(event) — notify subscribers AND persist the event to AuditLog
 *   (since the schema has no dedicated EventLog model — graceful degradation).
 *
 * Convenience emitters cover the most common domain events:
 *   - emitStudentCreated
 *   - emitLeadCreated
 *   - emitLeadQualified
 *   - emitApplicationCreated
 *   - emitContentPublished
 *   - emitUniversityUpdated
 *   - emitApprovalRequested
 *
 * Persistence: each emit creates an AuditLog row (action="EVENT_BUS",
 * resource=eventType, details=JSON.stringify(event)) so events can be
 * audited / replayed from the DB.
 *
 * Resilience: handler exceptions are swallowed (logged) so one slow/broken
 * subscriber never blocks the publisher or other subscribers.
 */

import { db } from "@/lib/db";

export type EventType =
  | "student.created"
  | "student.updated"
  | "lead.created"
  | "lead.updated"
  | "lead.qualified"
  | "lead.converted"
  | "application.created"
  | "application.status_changed"
  | "content.published"
  | "content.updated"
  | "university.updated"
  | "course.updated"
  | "approval.requested"
  | "approval.granted"
  | "approval.rejected"
  | "sla.breach"
  | "task.completed"
  | "document.uploaded"
  | "payment.received"
  | "visa.status_changed"
  | string;

export interface BusEvent<T = Record<string, unknown>> {
  id: string;                  // unique event ID (cuid-like)
  type: EventType;
  payload: T;
  actor?: string;              // userId or "system"
  targetType?: string;
  targetId?: string;
  occurredAt: Date;
  meta?: Record<string, unknown>;
}

export type EventHandler<T = Record<string, unknown>> = (event: BusEvent<T>) => void | Promise<void>;

// ─── In-process subscriber registry ────────────────────────────

const subscribers = new Map<string, Set<EventHandler>>();

/**
 * Subscribe to events of a given type. Returns an unsubscribe function.
 *
 * Wildcard "*" subscribes to ALL events.
 */
export function subscribe<T = Record<string, unknown>>(
  eventType: EventType | "*",
  handler: EventHandler<T>
): () => void {
  const key = String(eventType);
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key)!.add(handler as EventHandler);
  return () => {
    subscribers.get(key)?.delete(handler as EventHandler);
  };
}

/**
 * Emit an event:
 *   1. Notify all matching subscribers (sync + async) — exceptions swallowed.
 *   2. Persist the event to AuditLog (action="EVENT_BUS").
 *
 * Returns the persisted event (with id + occurredAt set).
 */
export async function emit<T = Record<string, unknown>>(
  event: Omit<BusEvent<T>, "id" | "occurredAt"> & Partial<Pick<BusEvent<T>, "id" | "occurredAt">>
): Promise<BusEvent<T>> {
  const fullEvent: BusEvent<T> = {
    id: event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    type: event.type,
    payload: event.payload,
    actor: event.actor || "system",
    targetType: event.targetType,
    targetId: event.targetId,
    occurredAt: event.occurredAt || new Date(),
    meta: event.meta,
  };

  // 1. Notify subscribers (specific type + wildcard)
  const specific = subscribers.get(String(fullEvent.type)) || new Set();
  const wildcard = subscribers.get("*") || new Set();
  const allHandlers = Array.from(specific).concat(Array.from(wildcard));

  await Promise.all(
    allHandlers.map(async (h) => {
      try {
        await h(fullEvent as BusEvent);
      } catch (err) {
        // Swallow — never let one subscriber break the bus
        console.error(`[event-bus] handler for "${fullEvent.type}" threw:`, err);
      }
    })
  );

  // 2. Persist to AuditLog (acts as EventLog)
  try {
    await db.auditLog.create({
      data: {
        action: "EVENT_BUS",
        resource: String(fullEvent.type),
        resourceId: fullEvent.targetId || null,
        userId: fullEvent.actor && fullEvent.actor !== "system" ? fullEvent.actor : null,
        details: JSON.stringify({
          eventId: fullEvent.id,
          type: fullEvent.type,
          payload: fullEvent.payload,
          targetType: fullEvent.targetType || null,
          targetId: fullEvent.targetId || null,
          meta: fullEvent.meta || null,
          occurredAt: fullEvent.occurredAt.toISOString(),
        }),
      },
    });
  } catch (err) {
    console.error("[event-bus] persist failed", err);
  }

  return fullEvent;
}

// ─── Recent Events / Stats ─────────────────────────────────────

export interface EventFilter {
  type?: EventType;
  targetType?: string;
  targetId?: string;
  actor?: string;
  since?: Date;
  limit?: number;
}

export interface RecentEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  actor: string;
  targetType?: string;
  targetId?: string;
  occurredAt: Date;
  meta?: Record<string, unknown>;
}

/**
 * Fetch recent events from the AuditLog-backed event log.
 */
export async function getRecentEvents(filters: EventFilter = {}): Promise<RecentEvent[]> {
  const where: Record<string, unknown> = { action: "EVENT_BUS" };
  if (filters.type) where.resource = String(filters.type);
  if (filters.targetId) where.resourceId = filters.targetId;
  if (filters.actor && filters.actor !== "system") where.userId = filters.actor;

  const rows = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.limit || 50,
  });

  const out: RecentEvent[] = [];
  for (const r of rows) {
    let d: any = {};
    try { d = JSON.parse(r.details || "{}"); } catch {}
    // Apply post-filters (targetType, since) since they're inside JSON
    if (filters.targetType && d.targetType !== filters.targetType) continue;
    if (filters.since && new Date(d.occurredAt) < filters.since) continue;
    out.push({
      id: d.eventId || r.id,
      type: d.type || r.resource || "unknown",
      payload: d.payload || {},
      actor: d.actor || (r.userId || "system"),
      targetType: d.targetType,
      targetId: d.targetId,
      occurredAt: new Date(d.occurredAt || r.createdAt),
      meta: d.meta,
    });
  }
  return out;
}

export interface EventStats {
  total: number;
  byType: Array<{ type: string; count: number }>;
  byActor: Array<{ actor: string; count: number }>;
  last24h: number;
  last7d: number;
}

/**
 * Aggregate event-bus stats from the AuditLog-backed log.
 */
export async function getEventStats(): Promise<EventStats> {
  const rows = await db.auditLog.findMany({
    where: { action: "EVENT_BUS" },
    select: { resource: true, userId: true, details: true, createdAt: true },
    take: 5000,
    orderBy: { createdAt: "desc" },
  });

  const byTypeMap = new Map<string, number>();
  const byActorMap = new Map<string, number>();
  const now = Date.now();
  let last24h = 0;
  let last7d = 0;

  for (const r of rows) {
    byTypeMap.set(r.resource || "unknown", (byTypeMap.get(r.resource || "unknown") || 0) + 1);
    const actor = r.userId || "system";
    byActorMap.set(actor, (byActorMap.get(actor) || 0) + 1);
    if (r.createdAt.getTime() > now - 24 * 60 * 60 * 1000) last24h++;
    if (r.createdAt.getTime() > now - 7 * 24 * 60 * 60 * 1000) last7d++;
  }

  return {
    total: rows.length,
    byType: Array.from(byTypeMap.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    byActor: Array.from(byActorMap.entries()).map(([actor, count]) => ({ actor, count })).sort((a, b) => b.count - a.count),
    last24h,
    last7d,
  };
}

// ─── Convenience Emitters ──────────────────────────────────────

export async function emitStudentCreated(studentId: string, payload: { name: string; email: string; mobile?: string }, actor?: string): Promise<BusEvent> {
  return emit({
    type: "student.created",
    payload: { studentId, ...payload },
    actor,
    targetType: "Student",
    targetId: studentId,
  });
}

export async function emitLeadCreated(leadId: string, payload: { fullName: string; phone?: string; email?: string; source?: string }, actor?: string): Promise<BusEvent> {
  return emit({
    type: "lead.created",
    payload: { leadId, ...payload },
    actor,
    targetType: "Lead",
    targetId: leadId,
  });
}

export async function emitLeadQualified(leadId: string, payload: { score: number; tier: string; reasons?: string[] }, actor?: string): Promise<BusEvent> {
  return emit({
    type: "lead.qualified",
    payload: { leadId, ...payload },
    actor,
    targetType: "Lead",
    targetId: leadId,
  });
}

export async function emitApplicationCreated(applicationId: string, payload: { studentId: string; university: string; course: string; intake?: string }, actor?: string): Promise<BusEvent> {
  return emit({
    type: "application.created",
    payload: { applicationId, ...payload },
    actor,
    targetType: "Application",
    targetId: applicationId,
  });
}

export async function emitContentPublished(payload: { contentType: string; slug: string; title: string; publishedBy?: string }, actor?: string): Promise<BusEvent> {
  return emit({
    type: "content.published",
    payload,
    actor: actor || payload.publishedBy || "system",
    targetType: payload.contentType,
    targetId: payload.slug,
  });
}

export async function emitUniversityUpdated(universitySlug: string, payload: { name: string; fieldsChanged?: string[]; source?: string }, actor?: string): Promise<BusEvent> {
  return emit({
    type: "university.updated",
    payload: { universitySlug, ...payload },
    actor,
    targetType: "UniversityPage",
    targetId: universitySlug,
  });
}

export async function emitApprovalRequested(payload: { resourceType: string; resourceId: string; requestedBy: string; reason?: string; riskLevel?: string }, actor?: string): Promise<BusEvent> {
  return emit({
    type: "approval.requested",
    payload,
    actor: actor || payload.requestedBy || "system",
    targetType: payload.resourceType,
    targetId: payload.resourceId,
  });
}
