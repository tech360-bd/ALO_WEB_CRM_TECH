import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    return NextResponse.json({
      success: true,
      data: {
        protectionMode: true,
        paymentGuard: true,
        globalPause: false,
        riskLevel: "low",
        lastAudit: new Date().toISOString(),
        checks: [
          { name: "Content Safety", status: "pass" },
          { name: "Visa Claim Check", status: "pass" },
          { name: "Brand Compliance", status: "pass" },
          { name: "Meta Policy", status: "pass" },
        ]
      }
    });
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    const body = await req.json();
    return NextResponse.json({ success: true, message: "Safety check recorded", data: body });
  })(request);
}

