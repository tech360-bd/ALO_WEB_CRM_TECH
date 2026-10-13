import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, searchWhere, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "resources.view");
  if (guard.denied) return guard.response;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || null;
  const category = url.searchParams.get("category");
  const { skip, take, page, pageSize } = pagination(req);
  const where = {
    ...searchWhere(q, ["title", "fileName", "description"]),
    ...(category && category !== "all" ? { category } : {}),
  };
  const [items, total] = await Promise.all([
    db.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    }),
    db.document.count({ where }),
  ]);
  return ok(items, "Documents loaded.", { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "resources.create");
  if (guard.denied) return guard.response;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const { title, fileName, fileUrl, mimeType, size, category, description } = body as Record<string, string>;
  if (!title || !fileName || !fileUrl) return fail("title, fileName, fileUrl are required.", ["missing_fields"]);
  try {
    const doc = await db.document.create({
      data: {
        title,
        fileName,
        fileUrl,
        mimeType: mimeType || null,
        size: size ? Number(size) : null,
        category: category || null,
        description: description || null,
        uploadedById: guard.session.userId,
      },
    });
    await writeAudit(guard.session, "document.create", "Document", doc.id, { title, fileName });
    return ok(doc, "Document created.", {}, 201);
  } catch (e) {
    return fail("Failed to create document.", [(e as Error).message], 500);
  }
}
