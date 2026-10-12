import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai";

// Marketing content generator (captions, post copy, ad copy, video scripts)
export async function POST(req: NextRequest) {
  const body = await req.json();
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
- Call to action: ${cta || "Book a free consultation"}

Generate the ${contentType} now. Output only the content.`;

  const content = await aiChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: `Generate the ${contentType} now.` },
  ]);

  return NextResponse.json({ content, contentType, topic, platform });
}
