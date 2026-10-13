import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai";

// AI suggested reply for counselor inbox
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { originalMessage, channel, studentName, context } = body;

  const systemPrompt = `You are the ALO Education AI reply assistant helping a counselor draft a reply to a student's message on ${channel}.

Rules:
- Be warm, professional, and concise (suitable for ${channel}).
- Do NOT guarantee admission or visa approval.
- Do NOT share private/commission/partner details.
- If the student asks something you're unsure about, suggest they book a consultation.
- You may switch between English and Bangla based on the student's language.
- Keep the reply under 100 words.
- End with a helpful next step (e.g. "Book a free consultation" or "Check your student portal").

${context ? `Context: ${context}` : ""}
${studentName ? `Student: ${studentName}` : ""}

Student's message: "${originalMessage}"

Draft a helpful reply. Output only the reply text.`;

  const reply = await aiChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: "Draft the reply now." },
  ]);
  return NextResponse.json({ suggestedReply: reply.trim() });
}
