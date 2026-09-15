// Knowledge Sharing API — Allows ANY authenticated user to upload info/updates that others can view/utilize
// Included in each dashboard per requirement
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

// GET /api/knowledge-sharing — list/search posts
// Query: ?q=&category=&visibility=&status=&universitySlug=&countrySlug=&limit=&offset=&authorId=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q") || undefined;
    const category = sp.get("category") || undefined;
    const visibility = sp.get("visibility") || undefined;
    const status = sp.get("status") || "PUBLISHED"; // default only published for public view, admin can see all
    const universitySlug = sp.get("universitySlug") || undefined;
    const countrySlug = sp.get("countrySlug") || undefined;
    const authorId = sp.get("authorId") || undefined;
    const limit = sp.get("limit") ? Math.min(100, parseInt(sp.get("limit")!)) : 20;
    const offset = sp.get("offset") ? parseInt(sp.get("offset")!) : 0;

    const where: any = {};
    if (category) where.category = category;
    if (visibility) where.visibility = visibility;
    if (universitySlug) where.universitySlug = universitySlug;
    if (countrySlug) where.countrySlug = countrySlug;
    if (authorId) where.authorId = authorId;
    if (status && status !== "ALL") where.status = status;

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } },
        { summary: { contains: q } },
        { tags: { contains: q } },
      ];
    }

    const [posts, total] = await Promise.all([
      db.knowledgeSharingPost.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
        include: {
          _count: { select: { comments: true, upvoteLogs: true } },
        },
      }),
      db.knowledgeSharingPost.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      posts,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/knowledge-sharing — create new post (ANY authenticated user can upload)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized — login required to share knowledge" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, summary, category, tags, fileUrl, fileType, fileSize, visibility, universitySlug, countrySlug, sourceUrl } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const user = session.user as any;
    const authorId = user.id || user.email || "unknown";
    const authorName = user.name || user.email || "Anonymous";
    const authorRole = user.role || user.userType || "STUDENT";
    const authorEmail = user.email || "";

    let slug = slugify(title);
    const exists = await db.knowledgeSharingPost.findUnique({ where: { slug } });
    if (exists) {
      slug = `${slug}-${Date.now().toString().slice(-6)}`;
    }

    // Default status PENDING for non-admin, auto PUBLISHED for ADMIN/SUPER_ADMIN/INTERNATIONAL_OFFICER
    const isPrivileged = ["SUPER_ADMIN", "ADMIN", "INTERNATIONAL_OFFICER"].includes(authorRole);
    const status = isPrivileged ? "PUBLISHED" : "PENDING";
    const verificationStatus = isPrivileged ? "VERIFIED" : "NEEDS_REVIEW";

    const post = await db.knowledgeSharingPost.create({
      data: {
        title,
        slug,
        content,
        summary: summary || content.slice(0, 300),
        category: category || "general",
        tags: JSON.stringify(tags || []),
        fileUrl: fileUrl || null,
        fileType: fileType || null,
        fileSize: fileSize || null,
        authorId,
        authorName,
        authorRole,
        authorEmail,
        visibility: visibility || "ALL",
        status,
        verificationStatus,
        sourceUrl: sourceUrl || null,
        universitySlug: universitySlug || null,
        countrySlug: countrySlug || null,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: "KNOWLEDGE_SHARING_CREATED",
        resource: "KnowledgeSharingPost",
        resourceId: post.id,
        details: JSON.stringify({ title, category, authorRole, status }),
        userId: authorId,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      post,
      message: isPrivileged
        ? "Knowledge shared successfully and published"
        : "Knowledge shared successfully — pending approval, others will see after approval",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
