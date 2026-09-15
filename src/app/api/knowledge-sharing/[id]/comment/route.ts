import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const comments = await db.knowledgeSharingComment.findMany({
      where: { postId: params.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ success: true, comments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const body = await req.json();
    const { content } = body;
    if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });

    const post = await db.knowledgeSharingPost.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const comment = await db.knowledgeSharingComment.create({
      data: {
        postId: params.id,
        authorId: user.id || user.email || "unknown",
        authorName: user.name || user.email || "Anonymous",
        authorRole: user.role || user.userType || "STUDENT",
        content,
      },
    });

    return NextResponse.json({ success: true, comment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
