/**
 * Event Bus — Centralized event sourcing + audit log for all agent/automation activity.
 *
 * Stores events in the EventLog table. Each event has:
 *  - eventType (e.g., LEAD_CREATED, APPLICATION_SUBMITTED, BRAIN_SIGNAL_DETECTED)
 *  - aggregateType + aggregateId (the entity the event concerns)
 *  - actorType (USER, AGENT, SYSTEM, WEBHOOK) + actorId
 *  - correlationId (for tracing across services)
 *  - causationId (the event that caused this one)
 */

import { db } from "@/lib/db";
import { randomUUID } from "crypto";

export interface EmitEventParams {
  eventType: string;
  aggregateType: string;
  aggregateId?: string;
  studentId?: string;
  leadId?: string;
  actorType: "USER" | "AGENT" | "SYSTEM" | "WEBHOOK";
  actorId?: string;
  agentId?: string;
  payload?: Record<string, unknown>;
  correlationId?: string;
  causationId?: string;
}

export interface EventQuery {
  eventType?: string;
  aggregateType?: string;
  aggregateId?: string;
  studentId?: string;
  leadId?: string;
  actorType?: string;
  actorId?: string;
  agentId?: string;
  correlationId?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Emit a single event to the bus. Returns the created EventLog row.
 */
export async function emitEvent(params: EmitEventParams) {
  try {
    return await db.eventLog.create({
      data: {
        eventType: params.eventType,
        aggregateType: params.aggregateType,
        aggregateId: params.aggregateId || null,
        studentId: params.studentId || null,
        leadId: params.leadId || null,
        actorType: params.actorType,
        actorId: params.actorId || null,
        agentId: params.agentId || null,
        payload: JSON.stringify(params.payload || {}),
        correlationId: params.correlationId || randomUUID(),
        causationId: params.causationId || null,
      },
    });
  } catch (err: any) {
    // Event bus failures must never block the calling workflow.
    console.error("[event-bus] emit failed:", err?.message);
    return null;
  }
}

/**
 * Emit multiple events sharing a single correlationId.
 */
export async function emitBatch(events: EmitEventParams[]) {
  if (events.length === 0) return [];
  const correlationId = events[0].correlationId || randomUUID();
  const results = await Promise.all(
    events.map((e) => emitEvent({ ...e, correlationId }))
  );
  return results;
}

/**
 * Query events. Returns ordered by timestamp desc by default.
 */
export async function queryEvents(query: EventQuery = {}) {
  const where: Record<string, unknown> = {};
  if (query.eventType) where.eventType = query.eventType;
  if (query.aggregateType) where.aggregateType = query.aggregateType;
  if (query.aggregateId) where.aggregateId = query.aggregateId;
  if (query.studentId) where.studentId = query.studentId;
  if (query.leadId) where.leadId = query.leadId;
  if (query.actorType) where.actorType = query.actorType;
  if (query.actorId) where.actorId = query.actorId;
  if (query.agentId) where.agentId = query.agentId;
  if (query.correlationId) where.correlationId = query.correlationId;
  if (query.since || query.until) {
    where.timestamp = {};
    if (query.since) (where.timestamp as any).gte = query.since;
    if (query.until) (where.timestamp as any).lte = query.until;
  }

  const limit = Math.min(query.limit || 100, 500);
  const offset = query.offset || 0;

  return db.eventLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: limit,
    skip: offset,
  });
}

/**
 * Get aggregate event stream (all events for a specific entity).
 */
export async function getAggregateStream(
  aggregateType: string,
  aggregateId: string,
  limit = 50
) {
  return db.eventLog.findMany({
    where: { aggregateType, aggregateId },
    orderBy: { timestamp: "desc" },
    take: Math.min(limit, 500),
  });
}

/**
 * Get event bus statistics — REAL counts from DB. Never fabricated.
 */
export async function getEventBusStats() {
  const total = await db.eventLog.count();

  const byEventType = await db.eventLog.groupBy({
    by: ["eventType"],
    _count: true,
    orderBy: { _count: { eventType: "desc" } },
    take: 20,
  });

  const byActorType = await db.eventLog.groupBy({
    by: ["actorType"],
    _count: true,
  });

  const byAggregateType = await db.eventLog.groupBy({
    by: ["aggregateType"],
    _count: true,
    orderBy: { _count: { aggregateType: "desc" } },
    take: 20,
  });

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await db.eventLog.count({
    where: { timestamp: { gte: last24h } },
  });

  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyCount = await db.eventLog.count({
    where: { timestamp: { gte: last7d } },
  });

  return {
    total,
    last24h: recentCount,
    last7d: weeklyCount,
    byEventType: byEventType.map((e: any) => ({
      eventType: e.eventType,
      count: e._count.eventType,
    })),
    byActorType: byActorType.map((a: any) => ({
      actorType: a.actorType,
      count: a._count.actorType,
    })),
    byAggregateType: byAggregateType.map((a: any) => ({
      aggregateType: a.aggregateType,
      count: a._count.aggregateType,
    })),
  };
}

/**
 * Replay events for a given aggregate (useful for rebuilding projections).
 */
export async function replayAggregateEvents(
  aggregateType: string,
  aggregateId: string
) {
  const events = await db.eventLog.findMany({
    where: { aggregateType, aggregateId },
    orderBy: { timestamp: "asc" },
  });
  return events.map((e: any) => ({
    ...e,
    payload: safeParse(e.payload),
  }));
}

function safeParse(s: string | null | undefined): any {
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
