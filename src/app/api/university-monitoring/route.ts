import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const url = new URL(req.url);
      const type = url.searchParams.get("type") || "dashboard";
      
      if (type === "dashboard") {
        const [totalUniversities, verified, changesDetected] = await Promise.all([
          db.crmUniversity.count(),
          db.crmUniversity.count({ where: { status: "active" } }),
          db.crmSourceVerificationEvent.count({ where: { verificationStatus: "NEEDS_REVIEW" } }),
        ]);
        const stats = {
          totalUniversities,
          verified,
          pendingVerification: changesDetected,
          lastScan: new Date().toISOString(),
          changesDetected,
        };
        return NextResponse.json({ success: true, data: stats });
      }
      
      const logs = await db.crmSourceLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
      return NextResponse.json({ success: true, data: logs });
    } catch (err: any) {
      console.error('[university-monitoring] error', err);
      return NextResponse.json({ success: false, error: err?.message || 'Failed to load monitoring data' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    const body = await req.json();
    const { action, universityId } = body;
    
    if (action === "trigger_scan") {
      await db.crmSourceLog.create({
        data: {
          universityId: universityId || "all",
          sourceUrl: "manual_trigger",
          status: "pending",
          verifiedBy: auth.email || auth.userId || "",
          verifiedAt: new Date().toISOString(),
        }
      }).catch(() => null);
      
      return NextResponse.json({ success: true, message: "University scan triggered", data: { scanId: "scan-" + Date.now(), status: "queued" } });
    }
    
    return NextResponse.json({ success: true, data: { id: "mon-" + Date.now(), ...body } });
  })(request);
}

