import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai";
import { authenticateRequest } from "@/lib/auth-middleware";

const MARKETING_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "super_admin", "admin", "MARKETING_MANAGER", "marketing_manager", "MARKETING", "marketing"]);

// Marketing content generator (captions, post copy, ad copy, video scripts)
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!MARKETING_ROLES.has(auth.userType) && !auth.roles.some((role) => MARKETING_ROLES.has(role))) {
    return NextResponse.json({ error: "Marketing access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { contentType, topic, platform, tone, targetAudience, keyMessage, cta } = body;

  const systemPrompt = `You are the ALO Education AI Marketing Content Generator. Create ${contentType} for ${platform} about: ${topic}.

Rules:
- Follow ALO Education brand voice: professional, encouraging, student-focused.
- Do NOT promise visa or admission guarantees.
- Be honest and factual.
- Tailor length to platform (Instagram: short + emojis, Facebook: medium, LinkedIn: professional, Email: structured).
- Include a clear call-to-action.
- Use Bangla-English mix if appropriate for Bangladeshi audience.

Details:
- Tone: ${tone || "professional yet warm"}
- Target audience: ${targetAudience || "Bangladeshi students planning to study abroad"}
- Key message: ${keyMessage || topic}
- Call to action: ${cta || "Request a consultation"}

Generate the ${contentType} now. Output only the content.`;

  const content = await aiChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: `Generate the ${contentType} now.` },
  ]);

  return NextResponse.json({ content, contentType, topic, platform });
}
