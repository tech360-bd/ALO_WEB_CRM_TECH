import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { canReviewDocuments } from "@/lib/documents/document-access";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      // ROLE FIX: this route only allowed ADMIN/SUPER_ADMIN user types, so the
      // document officers, application team and visa officers whose queue this
      // actually is could not open it, while an admin had to work the queue
      // manually. The review policy in lib/documents/document-access decides, so
      // the same roles that may approve a document may see what is waiting.
      if (!canReviewDocuments(auth.roles)) {
        return NextResponse.json(
          { success: false, error: "Your role cannot review documents." },
          { status: 403 },
        );
      }

      const url = new URL(req.url);
      const status = url.searchParams.get("status") || "pending_review";
      const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
      const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));
      
      const [total, docs] = await Promise.all([
        db.portalStudentDocument.count({ where: { status, isArchived: false } }).catch(() => 0),
        db.portalStudentDocument.findMany({
          where: { status, isArchived: false },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: { studentProfile: { select: { fullName: true, studentId: true } } }
        }).catch(() => [])
      ]);
      
      return NextResponse.json({ success: true, data: docs, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
    } catch (e) {
      return NextResponse.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
    }
  })(request);
}

