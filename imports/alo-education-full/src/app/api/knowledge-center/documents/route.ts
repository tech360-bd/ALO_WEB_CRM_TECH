import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — all knowledge documents with categories
export async function GET(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get("categoryId");
  const fileType = req.nextUrl.searchParams.get("fileType");
  const visibility = req.nextUrl.searchParams.get("visibility");
  const featured = req.nextUrl.searchParams.get("featured") === "true";
  const where: any = { approvalStatus: "APPROVED" };
  if (categoryId) where.categoryId = categoryId;
  if (fileType) where.fileType = fileType;
  if (visibility) where.visibility = visibility;
  if (featured) where.isFeatured = true;

  const [documents, categories] = await Promise.all([
    db.knowledgeDocument.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 }),
    db.knowledgeCategory.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" } }),
  ]);

  return NextResponse.json({
    documents,
    categories,
    stats: {
      total: await db.knowledgeDocument.count({ where: { approvalStatus: "APPROVED" } }),
      featured: await db.knowledgeDocument.count({ where: { approvalStatus: "APPROVED", isFeatured: true } }),
      pinned: await db.knowledgeDocument.count({ where: { approvalStatus: "APPROVED", isPinned: true } }),
    },
  });
}

// POST — upload knowledge document
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, categoryId, fileType, filePath, fileSize, mimeType, tags, visibility, description, authorId } = body;
  const doc = await db.knowledgeDocument.create({
    data: {
      title, categoryId, fileType, filePath, fileSize, mimeType,
      tags: JSON.stringify(tags || []),
      visibility: visibility || "EMPLOYEE",
      description,
      authorId,
      approvalStatus: "APPROVED",
    },
  });
  await db.auditLog.create({ data: { action: "DATA_IMPORT", resource: "KnowledgeDocument", resourceId: doc.id, details: JSON.stringify({ title, fileType }) } });
  return NextResponse.json({ doc, message: "Document uploaded to Knowledge Center." });
}
