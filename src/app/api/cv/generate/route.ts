import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, counselorId, template, personalInfo, education, workExperience, skills, achievements } = body;

  const systemPrompt = `You are the ALO Education AI CV Builder. Create a professional, well-structured CV/Resume for an international student.

Rules:
- Use the student's real information provided.
- Format: Contact info, Summary, Education, Work Experience, Skills, Achievements, (optional: Languages, Certifications).
- Be honest — do NOT invent achievements.
- Keep it to one page equivalent (300–500 words).
- Use clear section headers and bullet points.

Student info:
- Personal info: ${personalInfo || "Name, email, phone"}
- Education: ${education || "Not specified"}
- Work experience: ${workExperience || "Not specified"}
- Skills: ${skills || "Not specified"}
- Achievements: ${achievements || "Not specified"}
- Template: ${template || "STANDARD"}

Write the CV now. Output only the CV text with clear sections.`;

  const content = await aiChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: "Generate the CV now." },
  ]);

  let draft: Awaited<ReturnType<typeof db.cvDraft.create>> | null = null;
  if (studentId) {
    draft = await db.cvDraft.create({
      data: { studentId, content, version: 1, status: "DRAFT", reviewerId: counselorId || "" },
    });
  }

  return NextResponse.json({ content, draft });
}
