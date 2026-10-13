import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai";

// AI SOP (Statement of Purpose) writer
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentName, course, university, country, academicBackground, workExperience, englishScore, futureGoals, whyThisCourse, whyThisCountry } = body;

  const systemPrompt = `You are ALO AI SOP Writer, an expert at drafting compelling, authentic Statements of Purpose for international university applications. 

Write a polished, professional SOP (about 400-500 words) for the student below. The SOP must:
- Have a strong opening hook
- Explain academic background and achievements
- Connect past experience to the chosen course
- Explain why this specific country and university
- Address future career goals clearly
- Sound genuine, not generic or AI-ish
- Be free of plagiarism (original content only)

Student details:
- Name: ${studentName}
- Course: ${course}
- University: ${university}
- Country: ${country}
- Academic background: ${academicBackground || "Not specified"}
- Work experience: ${workExperience || "Not specified"}
- English test score: ${englishScore || "Not specified"}
- Future goals: ${futureGoals || "Not specified"}
- Why this course: ${whyThisCourse || ""}
- Why this country: ${whyThisCountry || ""}

Output only the SOP text, no preamble. Mark any factual assumption you had to make with [verify: ...] so the student can confirm.`;

  const sop = await aiChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: "Write the complete Statement of Purpose now." },
  ]);
  return NextResponse.json({ sop });
}
