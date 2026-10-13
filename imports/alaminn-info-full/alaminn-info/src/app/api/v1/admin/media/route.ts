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
    ...searchWhere(q, ["filename", "altText"]),
    ...(category && category !== "all" ? { category } : {}),
  };
  const [items, total] = await Promise.all([
    db.mediaAsset.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    db.mediaAsset.count({ where }),
  ]);
  return ok(items, "Media assets loaded.", { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "resources.create");
  if (guard.denied) return guard.response;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const { filename, url, altText, mimeType, size, width, height, category } = body as Record<string, string>;
  if (!filename || !url) return fail("filename and url are required.", ["missing_fields"]);
  try {
    const asset = await db.mediaAsset.create({
      data: {
        filename,
        url,
        altText: altText || null,
        mimeType: mimeType || null,
        size: size ? Number(size) : null,
        width: width ? Number(width) : null,
        height: height ? Number(height) : null,
        category: category || null,
      },
    });
    await writeAudit(guard.session, "media.create", "MediaAsset", asset.id, { filename });
    return ok(asset, "Media asset created.", {}, 201);
  } catch (e) {
    return fail("Failed to create media asset.", [(e as Error).message], 500);
  }
}
