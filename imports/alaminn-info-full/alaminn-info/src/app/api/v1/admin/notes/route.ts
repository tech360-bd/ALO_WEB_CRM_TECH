import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, searchWhere, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "contacts.view");
  if (guard.denied) return guard.response;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || null;
  const contactId = url.searchParams.get("contactId");
  const { skip, take, page, pageSize } = pagination(req);
  const where = {
    ...searchWhere(q, ["body"]),
    ...(contactId ? { contactId } : {}),
  };
  const [items, total] = await Promise.all([
    db.note.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        author: { select: { id: true, name: true, email: true } },
        contact: { select: { id: true, fullName: true } },
      },
    }),
    db.note.count({ where }),
  ]);
  return ok(items, "Notes loaded.", { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "contacts.update");
  if (guard.denied) return guard.response;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const { body: noteBody, contactId } = body as Record<string, string>;
  if (!noteBody) return fail("body is required.", ["missing_fields"]);
  try {
    const note = await db.note.create({
      data: {
        body: noteBody,
        contactId: contactId || null,
        authorId: guard.session.userId,
      },
    });
    await writeAudit(guard.session, "note.create", "Note", note.id, { contactId });
    return ok(note, "Note created.", {}, 201);
  } catch (e) {
    return fail("Failed to create note.", [(e as Error).message], 500);
  }
}
