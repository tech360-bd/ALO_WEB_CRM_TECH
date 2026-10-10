import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, type AuthContext } from "@/lib/auth-middleware";

// GET — all knowledge documents with categories
async function listKnowledgeDocuments(req: Request, _auth: AuthContext) {
  const searchParams = new URL(req.url).searchParams;
  const categoryId = searchParams.get("categoryId");
  const fileType = searchParams.get("fileType");
  const visibility = searchParams.get("visibility");
  const featured = searchParams.get("featured") === "true";
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
async function createKnowledgeDocument(req: Request, auth: AuthContext) {
  const body = await req.json();
  const { title, categoryId, fileType, filePath, fileSize, mimeType, tags, visibility, description } = body;
  const doc = await db.knowledgeDocument.create({
    data: {
      title, categoryId, fileType, filePath, fileSize, mimeType,
      tags: JSON.stringify(tags || []),
      visibility: visibility || "EMPLOYEE",
      description,
      authorId: auth.userId,
      approvalStatus: "PENDING",
    },
  });
  await db.auditLog.create({ data: { userId: auth.userId, action: "DATA_IMPORT", resource: "KnowledgeDocument", resourceId: doc.id, details: JSON.stringify({ title, fileType }) } });
  return NextResponse.json({ doc, message: "Document uploaded to Knowledge Center." });
}


const KNOWLEDGE_ACCESS = { requireUserTypes: ["ADMIN", "SUPER_ADMIN", "EMPLOYEE", "HR_MANAGER", "BRANCH_MANAGER", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "MARKETING_MANAGER", "MARKETING", "FRONT_DESK", "SUPPORT_STAFF", "ENGLISH_TRAINER"] };
export const GET = withAuth(listKnowledgeDocuments, KNOWLEDGE_ACCESS);
export const POST = withAuth(createKnowledgeDocument, KNOWLEDGE_ACCESS);
