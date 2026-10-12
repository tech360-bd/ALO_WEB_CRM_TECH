import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const visibility = req.nextUrl.searchParams.get("visibility");
  const where: any = { isApproved: true };
  if (category) where.category = category;
  if (visibility) where.visibility = visibility;
  else where.visibility = { in: ["INTERNAL", "ALO_EMPLOYEES"] };
  const posts = await db.learningPost.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, content, category, contentType, mediaUrl, visibility, authorId } = body;
  if (!title || !content) return NextResponse.json({ error: "title and content required" }, { status: 400 });
  const post = await db.learningPost.create({ data: { title, content, category: category || "ANNOUNCEMENT", contentType: contentType || "TEXT", mediaUrl, visibility: visibility || "INTERNAL", authorId, isApproved: visibility === "INTERNAL" || visibility === "ALO_EMPLOYEES" } });
  return NextResponse.json({ post });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, isApproved, approvedById } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const post = await db.learningPost.update({ where: { id }, data: { isApproved, approvedById, approvedAt: isApproved ? new Date() : null } });
  return NextResponse.json({ post });
}
