import { NextResponse } from "next/server"
import { withAuth, type AuthContext } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_ROLES = ["ADMIN", "SUPER_ADMIN", "MARKETING_MANAGER"];

async function getLearningPosts(req: Request, _auth: AuthContext) {
  const searchParams = new URL(req.url).searchParams;
  const category = searchParams.get("category");
  const visibility = searchParams.get("visibility");
  const where: any = { isApproved: true };
  if (category) where.category = category;
  if (visibility) where.visibility = visibility;
  else where.visibility = { in: ["INTERNAL", "ALO_EMPLOYEES"] };
  const posts = await db.learningPost.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ posts });
}

async function createLearningPost(req: Request, auth: AuthContext) {
  const body = await req.json().catch(() => ({}));
  const { title, content, category, contentType, mediaUrl, visibility } = body;
  if (typeof title !== "string" || !title.trim() || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }
  const safeVisibility = ["INTERNAL", "ALO_EMPLOYEES", "PARTNERS", "PUBLIC"].includes(visibility) ? visibility : "INTERNAL";
  const post = await db.learningPost.create({
    data: {
      title: title.trim(),
      content,
      category: category || "ANNOUNCEMENT",
      contentType: contentType || "TEXT",
      mediaUrl,
      visibility: safeVisibility,
      authorId: auth.userId,
      isApproved: false,
    },
  });
  return NextResponse.json({ post }, { status: 201 });
}

async function approveLearningPost(req: Request, auth: AuthContext) {
  const body = await req.json().catch(() => ({}));
  const { id, isApproved } = body;
  if (typeof id !== "string" || typeof isApproved !== "boolean") {
    return NextResponse.json({ error: "id and boolean isApproved required" }, { status: 400 });
  }
  const post = await db.learningPost.update({
    where: { id },
    data: { isApproved, approvedById: isApproved ? auth.userId : null, approvedAt: isApproved ? new Date() : null },
  });
  return NextResponse.json({ post });
}

export const GET = withAuth(getLearningPosts, { requireUserTypes: CONTENT_ROLES });
export const POST = withAuth(createLearningPost, { requireUserTypes: CONTENT_ROLES });
export const PATCH = withAuth(approveLearningPost, { requireUserTypes: CONTENT_ROLES });
