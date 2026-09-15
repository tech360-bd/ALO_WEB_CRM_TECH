// Knowledge Sharing — Single Post CRUD
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    // allow slug or id
    const post = await db.knowledgeSharingPost.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        comments: { orderBy: { createdAt: "asc" }, take: 100 },
        upvoteLogs: { take: 50 },
        _count: { select: { comments: true, upvoteLogs: true } },
      },
    });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    // Increment views
    await db.knowledgeSharingPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => {});

    return NextResponse.json({ success: true, post: { ...post, views: post.views + 1 } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const userId = user.id || user.email;
    const userRole = user.role || user.userType || "";

    const body = await req.json();
    const existing = await db.knowledgeSharingPost.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const isOwner = existing.authorId === userId;
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "INTERNATIONAL_OFFICER"].includes(userRole);

    // Only owner can edit content, admin can edit anything + approve
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden — only author or admin can edit" }, { status: 403 });
    }

    const allowedFieldsForOwner = ["title", "content", "summary", "category", "tags", "fileUrl", "fileType", "fileSize", "visibility", "universitySlug", "countrySlug", "sourceUrl"];
    const allowedFieldsForAdmin = [...allowedFieldsForOwner, "status", "verificationStatus", "isPinned", "isFeatured", "rejectionReason"];

    const allowed = isAdmin ? allowedFieldsForAdmin : allowedFieldsForOwner;
    const updateData: any = {};
    for (const f of allowed) {
      if (body[f] !== undefined) {
        if (f === "tags" && Array.isArray(body[f])) updateData[f] = JSON.stringify(body[f]);
        else updateData[f] = body[f];
      }
    }

    if (isAdmin && body.status) {
      updateData.approvedById = userId;
      updateData.approvedAt = body.status === "PUBLISHED" || body.status === "APPROVED" ? new Date() : null;
    }

    const updated = await db.knowledgeSharingPost.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const userId = user.id || user.email;
    const userRole = user.role || user.userType || "";

    const existing = await db.knowledgeSharingPost.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const isOwner = existing.authorId === userId;
    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(userRole);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.knowledgeSharingPost.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
