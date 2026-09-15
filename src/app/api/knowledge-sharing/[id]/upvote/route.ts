import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const userId = user.id || user.email;

    const existing = await db.knowledgeSharingUpvote.findUnique({
      where: { postId_userId: { postId: params.id, userId } },
    });

    if (existing) {
      await db.knowledgeSharingUpvote.delete({ where: { id: existing.id } });
      await db.knowledgeSharingPost.update({ where: { id: params.id }, data: { upvotes: { decrement: 1 } } }).catch(() => {});
      return NextResponse.json({ success: true, upvoted: false });
    } else {
      await db.knowledgeSharingUpvote.create({ data: { postId: params.id, userId } });
      await db.knowledgeSharingPost.update({ where: { id: params.id }, data: { upvotes: { increment: 1 } } }).catch(() => {});
      return NextResponse.json({ success: true, upvoted: true });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
