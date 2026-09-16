import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai";
import { db } from "@/lib/db";

// Generate SOP / personal statement / GTE / cover letter / study gap explanation / etc.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, counselorId, type, university, course, personalBackground, academicBackground, workExperience, englishScore, futureGoals, whyThisCourse, whyThisUniversity, whyThisCountry, studyGap } = body;

  const typeMap: Record<string, string> = {
    SOP: "Statement of Purpose",
    PERSONAL_STATEMENT: "Personal Statement",
    GTE: "Genuine Temporary Entrant Statement",
    GS: "Genuine Student Statement",
    COVER_LETTER: "Cover Letter",
    STUDY_GAP: "Study Gap Explanation",
    SPONSOR: "Sponsor Explanation",
    REFUSAL_EXPLANATION: "Refusal Explanation",
    INTERVIEW_ANSWER: "Interview Answer Guide",
  };

  const systemPrompt = `You are the ALO Education AI SOP Writer. Write an original, personalized ${typeMap[type] || "Statement of Purpose"} for an international student.

CRITICAL RULES — originality & compliance:
- Write ORIGINAL content only. Do NOT copy from sample SOPs or templates.
- Use the student's real profile data provided below.
- Be honest and specific. Do NOT invent achievements or fake experiences.
- If information is missing, mark it with [verify: ...] so the student can fill it in.
- Do NOT guarantee admission or visa approval.
- Keep the document 400–600 words for SOP/Personal Statement, 200–300 for shorter documents.
- Structure: strong opening, academic background, relevant experience, why this course/university/country, career goals, conclusion.

Student profile:
- Name: (from student record)
- University: ${university || "Not specified"}
- Course: ${course || "Not specified"}
- Personal background: ${personalBackground || "Not specified"}
- Academic background: ${academicBackground || "Not specified"}
- Work experience: ${workExperience || "Not specified"}
- English score: ${englishScore || "Not specified"}
- Future goals: ${futureGoals || "Not specified"}
- Why this course: ${whyThisCourse || "Not specified"}
- Why this university: ${whyThisUniversity || "Not specified"}
- Why this country: ${whyThisCountry || "Not specified"}
- Study gap explanation: ${studyGap || "Not specified"}

Write the ${typeMap[type] || "document"} now. Mark any assumptions with [verify: ...]. Output only the document text.`;

  const content = await aiChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: `Generate the ${typeMap[type] || "document"} now.` },
  ]);

  const wordCount = content.trim().split(/\s+/).length;

  // Save draft
  let draft: Awaited<ReturnType<typeof db.sopDraft.create>> | null = null;
  if (studentId) {
    draft = await db.sopDraft.create({
      data: {
        studentId,
        applicationId: "",
        universityName: university || "",
        courseName: course || "",
        content,
        version: 1,
        status: "DRAFT",
        reviewRequested: false,
      },
    });
    await db.timelineEvent.create({
      data: { studentId, stage: "application", userId: counselorId, type: "AI_ACTION", title: `${typeMap[type] || "SOP"} draft generated`, description: `AI draft created (${wordCount} words) — pending student & counselor review` },
    });
  }

  return NextResponse.json({ content, wordCount, draft, originalityNote: "This is an AI-generated draft. The student must review and personalize before submission. ALO does not guarantee admission." });
}
