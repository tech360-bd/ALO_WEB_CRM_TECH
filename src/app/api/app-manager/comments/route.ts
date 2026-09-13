import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-middleware";
import { canViewB2B, filterCommentsByVisibility } from "@/lib/application-manager/service";

// GET — application comments (filtered by visibility based on viewer role)
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;

  const applicationId = req.nextUrl.searchParams.get("applicationId");
  if (!applicationId) return NextResponse.json({ success: false, error: 'applicationId required' }, { status: 400 });

  const app = await db.application.findUnique({ where: { id: applicationId } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

  const allComments = await db.applicationComment.findMany({
    where: { applicationId },
    orderBy: { createdAt: "desc" },
  });

  const canViewB2BFlag = canViewB2B(auth.roles, auth.permissions);
  const filteredComments = filterCommentsByVisibility(allComments, canViewB2BFlag, auth.roles[0] || 'APPLICATION_TEAM');

  return NextResponse.json({
    comments: filteredComments,
    totalComments: allComments.length,
    hiddenComments: allComments.length - filteredComments.length,
    canViewB2B: canViewB2BFlag,
    success: true,
    data: filteredComments,
  });
}

// POST — add comment
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { applicationId, commentType, visibility, commentText, isB2bConfidential } = body;

  if (!applicationId || !commentText) return NextResponse.json({ success: false, error: 'applicationId and commentText required' }, { status: 400 });

  if ((visibility === 'B2B_CONFIDENTIAL' || isB2bConfidential) && !canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B comment requires permission' }, { status: 403 });
  }

  const comment = await db.applicationComment.create({
    data: {
      applicationId,
      userId: auth.userId,
      role: auth.roles[0] || 'APPLICATION_TEAM',
      commentType: commentType || "INTERNAL",
      visibility: visibility || "internal",
      commentText,
      isB2bConfidential: isB2bConfidential || visibility === 'B2B_CONFIDENTIAL',
    },
  });

  await db.auditLog.create({
    data: { userId: auth.userId, action: "ADD_COMMENT", resource: "ApplicationComment", resourceId: comment.id, details: JSON.stringify({ applicationId, visibility, isB2bConfidential }), actorRole: auth.roles[0] || '' },
  });

  return NextResponse.json({ comment, message: "Comment added.", success: true, data: comment });
}
