import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    return NextResponse.json({
      success: true,
      data: {
        model: process.env.AI_DEFAULT_MODEL || "glm-4-flash",
        fastModel: process.env.AI_FAST_MODEL || "glm-4-flash",
        smartModel: process.env.AI_SMART_MODEL || "glm-4-plus",
        provider: "z-ai",
        status: "active",
        features: ["sop_generation", "course_matching", "eligibility_check", "visa_readiness"],
        usage: { today: 0, monthly: 0, limit: 10000 }
      }
    });
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    const body = await req.json();
    return NextResponse.json({ success: true, data: { id: "ai-" + Date.now(), ...body, status: "processed", result: "AI response placeholder - configure GROQ_API_KEY or ZAI_API_KEY" } });
  })(request);
}

