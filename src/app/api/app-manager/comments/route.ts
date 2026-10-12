import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — application comments (filtered by visibility based on viewer role)
export async function GET(req: NextRequest) {
  const applicationId = req.nextUrl.searchParams.get("applicationId");
  const viewerRole = req.nextUrl.searchParams.get("viewerRole") || "APPLICATION_TEAM";
  if (!applicationId) return NextResponse.json({ comments: [] });

  const allComments = await db.applicationComment.findMany({
    where: { applicationId },
    orderBy: { createdAt: "desc" },
  });

  // Filter comments based on viewer role
  const canViewB2B = viewerRole === "APPLICATION_TEAM" || viewerRole === "APPLICATION_MANAGER" || viewerRole === "SUPER_ADMIN";
  const filteredComments = allComments.filter((c) => {
    if (c.isB2bConfidential && !canViewB2B) return false;
    if (c.visibility === "B2B_CONFIDENTIAL" && !canViewB2B) return false;
    if (c.visibility === "INTERNAL" && viewerRole === "STUDENT") return false;
    if (c.visibility === "FINANCE" && viewerRole !== "FINANCE" && viewerRole !== "SUPER_ADMIN") return false;
    return true;
  });

  return NextResponse.json({
    comments: filteredComments,
    totalComments: allComments.length,
    hiddenComments: allComments.length - filteredComments.length,
    canViewB2B,
  });
}

// POST — add comment
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { applicationId, userId, role, commentType, visibility, commentText, isB2bConfidential } = body;

  const comment = await db.applicationComment.create({
    data: {
      applicationId,
      userId,
      role,
      commentType: commentType || "INTERNAL",
      visibility: visibility || "INTERNAL",
      commentText,
      isB2bConfidential: isB2bConfidential || false,
    },
  });

  await db.auditLog.create({
    data: { userId, action: "MESSAGE_ACTION", resource: "ApplicationComment", resourceId: comment.id, details: JSON.stringify({ applicationId, visibility, isB2bConfidential }) },
  });

  return NextResponse.json({ comment, message: "Comment added." });
}
