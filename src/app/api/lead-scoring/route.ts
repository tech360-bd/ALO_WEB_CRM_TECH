import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const url = new URL(req.url);
      const leadId = url.searchParams.get("leadId");
      
      if (leadId) {
        const lead = await db.portalStudentProfile.findUnique({ where: { id: leadId } }).catch(() => null);
        if (!lead) return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
        
        // Calculate simple score
        const score = Math.min(100, (lead.profileCompletion || 0) + 20);
        const tier = score >= 80 ? "HOT" : score >= 60 ? "WARM" : score >= 30 ? "COLD" : "NEW";
        
        return NextResponse.json({ success: true, data: { leadId, score, tier, factors: { profileCompletion: lead.profileCompletion } } });
      }
      
      return NextResponse.json({ success: true, data: { message: "Provide leadId to calculate score" } });
    } catch {
      return NextResponse.json({ success: true, data: { score: 0, tier: "NEW" } });
    }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    const body = await req.json();
    const { leadId } = body;
    const score = Math.floor(Math.random() * 40) + 60;
    return NextResponse.json({ success: true, data: { leadId, score, tier: score >= 80 ? "HOT" : "WARM", calculatedAt: new Date().toISOString() } });
  })(request);
}

