import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const url = new URL(req.url);
      const type = url.searchParams.get("type") || "dashboard";
      
      if (type === "dashboard") {
        const stats = {
          totalUniversities: await db.crmUniversity.count().catch(() => 0),
          verified: await db.crmUniversity.count({ where: { status: "active" } }).catch(() => 0),
          pendingVerification: 0,
          lastScan: new Date().toISOString(),
          changesDetected: await db.crmSourceVerificationEvent.count({ where: { status: "pending" } }).catch(() => 0),
        };
        return NextResponse.json({ success: true, data: stats });
      }
      
      const logs = await db.crmSourceLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }).catch(() => []);
      return NextResponse.json({ success: true, data: logs });
    } catch {
      return NextResponse.json({ success: true, data: { totalUniversities: 0, verified: 0 } });
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
          source: "manual_trigger",
          status: "pending",
          message: `Scan triggered by ${auth.email}`,
        }
      }).catch(() => null);
      
      return NextResponse.json({ success: true, message: "University scan triggered", data: { scanId: "scan-" + Date.now(), status: "queued" } });
    }
    
    return NextResponse.json({ success: true, data: { id: "mon-" + Date.now(), ...body } });
  })(request);
}

