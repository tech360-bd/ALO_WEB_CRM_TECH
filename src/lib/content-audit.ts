import { db } from "@/lib/db";

type ContentAuditData = {
  userId?: string | null;
  action: string;
  resource?: string;
  resourceId?: string | null;
  details?: string | Record<string, unknown> | null;
};

/**
 * Content-management audit adapter.
 *
 * The application has more than one audit domain. Content CRUD must use the
 * canonical PortalAuditLog table rather than assuming a non-existent generic
 * `auditLog` delegate. Keeping the small create-compatible surface here lets
 * the content routes retain their existing audit payloads while recording the
 * real actor and entity consistently.
 */
export const contentAuditLog = {
  async create({ data }: { data: ContentAuditData }) {
    const metadata =
      typeof data.details === "string"
        ? (() => {
            try {
              return JSON.parse(data.details) as Record<string, unknown>;
            } catch {
              return { details: data.details };
            }
          })()
        : data.details ?? {};

    return db.portalAuditLog.create({
      data: {
        actorUserId: data.userId || "system",
        action: data.action,
        entityType: data.resource || "Content",
        entityId: data.resourceId || "",
        metadata: JSON.stringify(metadata),
      },
    });
  },
};
