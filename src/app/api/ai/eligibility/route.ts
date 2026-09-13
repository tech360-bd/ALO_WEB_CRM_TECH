import { NextRequest, NextResponse } from "next/server";
import { aiChat, extractJson } from "@/lib/ai";

// AI Eligibility Checker — used on country, university, and course pages
// Student inputs academic background, English score, study gap, budget, preferred subject, intake.
// AI returns: eligibility status, recommended documents, recommended courses.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { academicLevel, academicGrade, englishTest, englishScore, studyGap, budget, preferredSubject, preferredLevel, preferredIntake, preferredCountry } = body;

  const systemPrompt = `You are the ALO Education AI Eligibility Checker. Based on the student's profile, assess their eligibility for studying abroad and recommend next steps.

Rules:
- Be realistic and honest. Do not guarantee admission.
- If data is uncertain, mark it "Needs verification".
- Consider academic background, English score, study gap, and budget.
- Recommend specific next steps and document requirements.
- Never invent exact university requirements — give general guidance.

Student profile:
- Academic level completed: ${academicLevel || "Not specified"}
- Academic grade / CGPA: ${academicGrade || "Not specified"}
- English test: ${englishTest || "Not specified"}
- English score: ${englishScore || "Not specified"}
- Study gap: ${studyGap || "None specified"}
- Budget: ${budget || "Not specified"}
- Preferred subject: ${preferredSubject || "Not specified"}
- Preferred study level: ${preferredLevel || "Not specified"}
- Preferred intake: ${preferredIntake || "Not specified"}
- Preferred destination: ${preferredCountry || "Open"}

Return ONLY valid JSON (no markdown) in this exact shape:
{
  "status": "ELIGIBLE" | "POSSIBLY_ELIGIBLE" | "NEEDS_COUNSELOR_REVIEW" | "NOT_READY_YET",
  "summary": "<2-3 sentence assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "concerns": ["<concern 1>", "<concern 2>"],
  "recommendedDocuments": ["<doc 1>", "<doc 2>", "<doc 3>"],
  "recommendedNextSteps": ["<step 1>", "<step 2>", "<step 3>"],
  "recommendedCourses": ["<course suggestion 1>", "<suggestion 2>"],
  "englishTestAdvice": "<advice on English test>",
  "visaRiskNote": "<brief visa risk note>"
}`;

  const raw = await aiChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: "Assess my eligibility and provide recommendations as JSON." },
  ], { temperature: 0.4 });

  const parsed = extractJson(raw);
  return NextResponse.json(parsed ?? { status: "NEEDS_COUNSELOR_REVIEW", summary: raw });
}
