import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, searchWhere, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "dashboard.view");
  if (guard.denied) return guard.response;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || null;
  const status = url.searchParams.get("status");
  const assigneeId = url.searchParams.get("assigneeId");
  const { skip, take, page, pageSize } = pagination(req);
  const where = {
    ...searchWhere(q, ["title", "description"]),
    ...(status && status !== "all" ? { status } : {}),
    ...(assigneeId ? { assigneeId } : {}),
  };
  const [items, total] = await Promise.all([
    db.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { assignee: { select: { id: true, name: true, email: true } }, contact: { select: { id: true, fullName: true } } },
    }),
    db.task.count({ where }),
  ]);
  return ok(items, "Tasks loaded.", { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "dashboard.view");
  if (guard.denied) return guard.response;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;
  if (!b.title) return fail("title is required.", ["missing_fields"]);
  try {
    const task = await db.task.create({
      data: {
        title: String(b.title),
        description: b.description ? String(b.description) : null,
        priority: b.priority ? String(b.priority) : "medium",
        status: b.status ? String(b.status) : "open",
        dueDate: b.dueDate ? new Date(String(b.dueDate)) : null,
        assigneeId: b.assigneeId ? String(b.assigneeId) : null,
        contactId: b.contactId ? String(b.contactId) : null,
        relatedType: b.relatedType ? String(b.relatedType) : null,
        relatedId: b.relatedId ? String(b.relatedId) : null,
      },
    });
    await writeAudit(guard.session, "task.create", "Task", task.id, { title: task.title });
    return ok(task, "Task created.", {}, 201);
  } catch (e) {
    return fail("Failed to create task.", [(e as Error).message], 500);
  }
}
