import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { ok, fail, pagination, searchWhere, readJson, writeAudit } from "@/lib/admin-api";
import { ALL_ROLES, normalizeRole, ROLE_LABELS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/** GET /api/v1/admin/users — list users */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "users.view");
  if (guard.denied) return guard.response;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || null;
  const role = url.searchParams.get("role");
  const status = url.searchParams.get("status");
  const { skip, take, page, pageSize } = pagination(req);
  const where = {
    ...searchWhere(q, ["name", "email"]),
    ...(role && role !== "all" ? { role } : {}),
    ...(status && status !== "all" ? { status } : {}),
  };
  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true, createdAt: true, updatedAt: true },
    }),
    db.user.count({ where }),
  ]);
  return ok({ users: items, roles: ALL_ROLES, roleLabels: ROLE_LABELS }, "Users loaded.", { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

/** POST /api/v1/admin/users — create user */
export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "users.create");
  if (guard.denied) return guard.response;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const { email, name, role, password, status } = body as Record<string, string>;
  if (!email || !name || !password) return fail("email, name, password are required.", ["missing_fields"]);
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return fail(`Invalid role. Valid roles: ${ALL_ROLES.join(", ")}`, ["invalid_role"]);
  if (password.length < 8) return fail("Password must be at least 8 characters.", ["weak_password"]);

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return fail("User with that email already exists.", ["duplicate_email"], 409);

  try {
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        role: normalizedRole,
        status: status || "active",
        passwordHash: hashPassword(password),
      },
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    });
    await writeAudit(guard.session, "user.create", "User", user.id, { email, role: normalizedRole });
    return ok(user, "User created.", {}, 201);
  } catch (e) {
    return fail("Failed to create user.", [(e as Error).message], 500);
  }
}
