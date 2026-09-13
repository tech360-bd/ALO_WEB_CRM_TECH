import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const url = new URL(req.url);
      const status = url.searchParams.get("status") || "pending_review";
      const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
      const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));
      
      const [total, docs] = await Promise.all([
        db.portalStudentDocument.count({ where: { status } }).catch(() => 0),
        db.portalStudentDocument.findMany({
          where: { status },
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
  }, { requireUserTypes: ["ADMIN", "SUPER_ADMIN"] })(request);
}

