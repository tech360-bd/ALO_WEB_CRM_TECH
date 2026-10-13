/**
 * Generic admin CRUD factory for Higher Study entities.
 * --------------------------------------------------------------------
 * Each Higher Study entity (universities, courses, scholarships, etc.)
 * has the same admin route shape: GET (list), POST (create), GET-by-id,
 * PUT (update), DELETE. This factory centralises the common logic —
 * permission gating, pagination, audit logging, slug uniqueness — so
 * each route file is just a thin config + a call to the factory.
 *
 * The factory is type-loose (uses `Record<string, unknown>` for the
 * Prisma data payload) because each entity's Prisma input type differs.
 * Callers cast to their specific Prisma input type at the call site.
 */
import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import {
  jsonResponse,
  parsePaginationParams,
  paginationSkipTake,
  buildPaginationMeta,
  safeString,
  slugify,
} from "@/lib/higher-study/api-helpers";
import {
  writeAuditLog,
  resolveActor,
  parseBody,
  applyVerificationUpdate,
  validationError,
  notFoundError,
  internalError,
  toNumberOrNull,
  toBooleanOrNull,
  toDateOrNull,
} from "@/lib/higher-study/admin-helpers";
import type { Permission } from "@/lib/rbac";

// ─── Types ────────────────────────────────────────────────────────────

export interface EntityConfig {
  /** Singular entity name (used for audit log entityType). */
  name: string;
  /** Plural label used in messages. */
  pluralLabel: string;
  /** Permissions keyed by action. */
  permissions: {
    view: Permission;
    create: Permission;
    update: Permission;
    delete: Permission;
  };
  /** Prisma delegate (e.g. `db.higherStudyUniversity`). */
  delegate: {
    findMany: (args: unknown) => Promise<unknown[]>;
    findUnique: (args: unknown) => Promise<unknown>;
    findFirst: (args: unknown) => Promise<unknown>;
    count: (args: unknown) => Promise<number>;
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  /** Search fields for `?q` (case-insensitive contains). */
  searchFields?: string[];
  /** Required fields for create validation. */
  requiredFields?: string[];
  /** Whitelisted fields for create/update. */
  allowedFields: readonly string[];
  /** Fields that should be coerced to boolean. */
  booleanFields?: string[];
  /** Fields that should be coerced to number. */
  numberFields?: string[];
  /** Fields that should be coerced to Date. */
  dateFields?: string[];
  /** Field name for the slug (default: "slug"). */
  slugField?: string;
  /** Field name for the display name (used to auto-generate slug). */
  nameField?: string;
  /** Optional relations to include in list/detail responses. */
  include?: Record<string, unknown>;
  /** Default order-by for list. */
  orderBy?: Record<string, "asc" | "desc">;
  /** Whether the entity supports verification status tracking. */
  hasVerificationStatus?: boolean;
}

// ─── List + Create handlers ──────────────────────────────────────────

export function makeListHandler(cfg: EntityConfig) {
  return async (req: NextRequest) => {
    const guard = await requirePermission(req, cfg.permissions.view);
    if (guard.denied) return guard.response;

    try {
      const url = new URL(req.url);
      const params = parsePaginationParams(req);
      const { skip, take } = paginationSkipTake(params);

      const q = safeString(url.searchParams.get("q"));
      const verifiedStatus = safeString(url.searchParams.get("verifiedStatus"));
      const publicationStatus = safeString(url.searchParams.get("publicationStatus"));

      const where: Record<string, unknown> = {};
      if (q && cfg.searchFields && cfg.searchFields.length > 0) {
        where.OR = cfg.searchFields.map((f) => ({
          [f]: { contains: q },
        }));
      }
      if (verifiedStatus) where.verificationStatus = verifiedStatus;
      if (publicationStatus) where.publicationStatus = publicationStatus;

      const findManyArgs: Record<string, unknown> = {
        where,
        skip,
        take,
        orderBy: cfg.orderBy ?? { updatedAt: "desc" },
      };
      if (cfg.include) findManyArgs.include = cfg.include;

      const [items, total] = await Promise.all([
        cfg.delegate.findMany(findManyArgs),
        cfg.delegate.count({ where }),
      ]);

      return jsonResponse(
        true,
        `${cfg.pluralLabel} retrieved.`,
        { items },
        { pagination: buildPaginationMeta(params, total) },
      );
    } catch (err) {
      console.error(`[admin/${cfg.name} GET] error`, err);
      return internalError();
    }
  };
}

export function makeCreateHandler(cfg: EntityConfig) {
  return async (req: NextRequest) => {
    const guard = await requirePermission(req, cfg.permissions.create);
    if (guard.denied) return guard.response;

    const body = await parseBody(req);
    if (!body) return validationError("Invalid request body.", ["invalid_body"]);

    try {
      // Validate required fields.
      const errors: string[] = [];
      for (const f of cfg.requiredFields ?? []) {
        const v = body[f];
        if (v === undefined || v === null || v === "") {
          errors.push(`${f}_required`);
        }
      }
      if (errors.length > 0) {
        return validationError("Validation failed.", errors);
      }

      const slugField = cfg.slugField ?? "slug";
      const nameField = cfg.nameField ?? "name";

      // Resolve slug.
      let slug = safeString(body[slugField] as string);
      if (!slug && nameField) {
        slug = slugify(safeString(body[nameField] as string));
      }
      if (!slug) {
        return validationError("Could not derive a valid slug.", ["slug_invalid"]);
      }

      // Slug uniqueness check.
      const clash = await cfg.delegate.findUnique({
        where: { [slugField]: slug },
        select: { id: true },
      });
      if (clash) {
        return validationError("Slug already exists.", ["slug_duplicate"]);
      }

      // Build the data payload.
      const data: Record<string, unknown> = { [slugField]: slug };
      for (const key of cfg.allowedFields) {
        if (key === slugField) continue;
        if (!(key in body)) continue;
        const v = body[key];
        if (v === undefined) continue;
        if (cfg.booleanFields?.includes(key)) {
          const b = toBooleanOrNull(v);
          if (b !== null) data[key] = b;
          continue;
        }
        if (cfg.numberFields?.includes(key)) {
          const n = toNumberOrNull(v);
          if (n !== null) data[key] = n;
          continue;
        }
        if (cfg.dateFields?.includes(key)) {
          const d = toDateOrNull(v);
          if (d !== null) data[key] = d;
          continue;
        }
        if (v === null || typeof v === "string") {
          data[key] = v;
        }
      }

      // Apply verification update on create (if entity supports it).
      const finalData = cfg.hasVerificationStatus
        ? applyVerificationUpdate(null, data, guard.session.userId)
        : data;

      const createArgs: Record<string, unknown> = { data: finalData };
      if (cfg.include) createArgs.include = cfg.include;

      const created = await cfg.delegate.create(createArgs);

      // Audit log.
      const actor = resolveActor(req, guard.session.userId);
      await writeAuditLog({
        actorUserId: actor.userId,
        action: "create",
        entityType: cfg.name,
        entityId: (created as { id: string }).id,
        entitySlug: (created as Record<string, unknown>)[slugField] as string,
        afterData: created,
        ipHash: actor.ipHash,
        userAgent: actor.userAgent,
      });

      return jsonResponse(true, `${cfg.name} created.`, created);
    } catch (err) {
      console.error(`[admin/${cfg.name} POST] error`, err);
      return internalError();
    }
  };
}

// ─── Read + Update + Delete handlers ─────────────────────────────────

export function makeGetHandler(cfg: EntityConfig) {
  return async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const guard = await requirePermission(req, cfg.permissions.view);
    if (guard.denied) return guard.response;

    try {
      const { id } = await params;
      const findArgs: Record<string, unknown> = { where: { id } };
      if (cfg.include) findArgs.include = cfg.include;
      const item = await cfg.delegate.findUnique(findArgs);
      if (!item) return notFoundError();
      return jsonResponse(true, `${cfg.name} retrieved.`, item);
    } catch (err) {
      console.error(`[admin/${cfg.name}/[id] GET] error`, err);
      return internalError();
    }
  };
}

export function makeUpdateHandler(cfg: EntityConfig) {
  return async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const guard = await requirePermission(req, cfg.permissions.update);
    if (guard.denied) return guard.response;

    const body = await parseBody(req);
    if (!body) return validationError("Invalid request body.", ["invalid_body"]);

    try {
      const { id } = await params;
      const before = (await cfg.delegate.findUnique({
        where: { id },
      })) as { id: string; slug?: string; verificationStatus?: string } | null;
      if (!before) return notFoundError();

      const slugField = cfg.slugField ?? "slug";

      const data: Record<string, unknown> = {};
      for (const key of cfg.allowedFields) {
        if (!(key in body)) continue;
        const v = body[key];
        if (v === undefined) continue;
        if (cfg.booleanFields?.includes(key)) {
          const b = toBooleanOrNull(v);
          if (b !== null) data[key] = b;
          continue;
        }
        if (cfg.numberFields?.includes(key)) {
          const n = toNumberOrNull(v);
          if (n !== null) data[key] = n;
          continue;
        }
        if (cfg.dateFields?.includes(key)) {
          const d = toDateOrNull(v);
          if (d !== null) data[key] = d;
          continue;
        }
        if (v === null || typeof v === "string") {
          data[key] = v;
        }
      }

      // Slug uniqueness check (if slug is changing).
      if (typeof data[slugField] === "string" && data[slugField] !== (before as Record<string, unknown>)[slugField]) {
        const clash = await cfg.delegate.findUnique({
          where: { [slugField]: data[slugField] },
          select: { id: true },
        });
        if (clash && (clash as { id: string }).id !== id) {
          return validationError("Slug already in use.", ["slug_duplicate"]);
        }
      }

      const finalData = cfg.hasVerificationStatus
        ? applyVerificationUpdate(
            { verificationStatus: before.verificationStatus },
            data,
            guard.session.userId,
          )
        : data;

      const updateArgs: Record<string, unknown> = {
        where: { id },
        data: finalData,
      };
      if (cfg.include) updateArgs.include = cfg.include;

      const updated = await cfg.delegate.update(updateArgs);

      const actor = resolveActor(req, guard.session.userId);
      await writeAuditLog({
        actorUserId: actor.userId,
        action: "update",
        entityType: cfg.name,
        entityId: id,
        entitySlug: (updated as Record<string, unknown>)[slugField] as string,
        beforeData: before,
        afterData: updated,
        ipHash: actor.ipHash,
        userAgent: actor.userAgent,
      });

      return jsonResponse(true, `${cfg.name} updated.`, updated);
    } catch (err) {
      console.error(`[admin/${cfg.name}/[id] PUT] error`, err);
      return internalError();
    }
  };
}

export function makeDeleteHandler(cfg: EntityConfig) {
  return async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const guard = await requirePermission(req, cfg.permissions.delete);
    if (guard.denied) return guard.response;

    try {
      const { id } = await params;
      const before = (await cfg.delegate.findUnique({
        where: { id },
        select: { id: true, slug: true },
      })) as { id: string; slug?: string } | null;
      if (!before) return notFoundError();

      await cfg.delegate.delete({ where: { id } });

      const actor = resolveActor(req, guard.session.userId);
      await writeAuditLog({
        actorUserId: actor.userId,
        action: "delete",
        entityType: cfg.name,
        entityId: id,
        entitySlug: before.slug,
        beforeData: before,
        ipHash: actor.ipHash,
        userAgent: actor.userAgent,
      });

      return jsonResponse(true, `${cfg.name} deleted.`, { id });
    } catch (err) {
      console.error(`[admin/${cfg.name}/[id] DELETE] error`, err);
      return internalError();
    }
  };
}
