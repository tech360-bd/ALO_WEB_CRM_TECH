import { NextRequest, NextResponse } from "next/server";
import { aiChat, extractJson } from "@/lib/ai";
import { db } from "@/lib/db";

// AI human-like interview system
// Asks one question at a time, evaluates answers, provides follow-ups,
// and at the end gives a score + readiness report saved to CRM.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "next_question") {
    // Ask the next interview question based on transcript so far
    const { type, transcript, studentName, university, course, country } = body;
    const transcriptText = (transcript || [])
      .map((t: any, i: number) => `Q${i + 1}: ${t.q}\nA: ${t.a}`)
      .join("\n\n");

    const systemPrompt = `You are ALO AI Interviewer, a realistic ${type.replace(/_/g, " ").toLowerCase()} interviewer for international students applying to study abroad. You act like a real visa officer or university admissions interviewer.

Rules:
- Ask ONLY ONE question at a time.
- If the student has answered previous questions, acknowledge briefly and ask a relevant follow-up.
- Cover these areas across the interview: why country, why university, why course, sponsor/funding, study gap, future plans.
- If an answer is weak or vague, dig deeper with a follow-up.
- Be professional, calm, and slightly probing like a real officer.
- Keep your response SHORT: a one-line acknowledgment + the next question. Do not give feedback yet.

Context:
- Student: ${studentName}
- University: ${university}
- Course: ${course}
- Country: ${country}
- Interview type: ${type}

${transcriptText ? `Conversation so far:\n${transcriptText}` : "The interview is just starting. Begin with a warm but professional opening question asking the student to introduce themselves."}

Respond with ONLY the next thing you would say (acknowledgment + one question).`;

    const reply = await aiChat([
      { role: "assistant", content: systemPrompt },
      { role: "user", content: transcriptText ? "Ask the next follow-up question now." : "Begin the interview with your opening question now." },
    ]);
    return NextResponse.json({ question: reply.trim() });
  }

  if (action === "complete") {
    // Generate final score + readiness report
    const { type, transcript, studentName, university, course, country, studentId } = body;
    const transcriptText = (transcript || [])
      .map((t: any, i: number) => `Q${i + 1}: ${t.q}\nA: ${t.a}`)
      .join("\n\n");

    const systemPrompt = `You are ALO AI Interview Evaluator. Analyze the following ${type.replace(/_/g, " ").toLowerCase()} interview transcript and produce a detailed readiness report.

Student: ${studentName}
University: ${university}
Course: ${course}
Country: ${country}

Transcript:
${transcriptText}

Score each dimension from 1-10 and assess risk. Return ONLY valid JSON (no markdown) in this exact shape:
{
  "scores": {
    "communication": <1-10>,
    "confidence": <1-10>,
    "courseKnowledge": <1-10>,
    "universityKnowledge": <1-10>,
    "financialExplanation": <1-10>,
    "sponsorExplanation": <1-10>,
    "studyGapExplanation": <1-10>,
    "futurePlanClarity": <1-10>
  },
  "overallReadiness": <0-100>,
  "visaRisk": "LOW" | "MEDIUM" | "HIGH",
  "readiness": "ready" | "needs_practice" | "high_risk" | "human_review_required",
  "feedback": "<2-3 sentence overall feedback>",
  "improvementPlan": ["<actionable tip 1>", "<tip 2>", "<tip 3>"],
  "weakAreas": ["<area 1>", "<area 2>"]
}`;

    const raw = await aiChat([
      { role: "assistant", content: systemPrompt },
      { role: "user", content: "Analyze the transcript and produce the readiness report as valid JSON now." },
    ], { temperature: 0.3 });
    const parsed = extractJson(raw);

    if (parsed && studentId) {
      const session = await db.interviewSession.create({
        data: {
          sessionId: `IV-${Date.now().toString(36).toUpperCase()}`,
          studentId,
          type,
          status: "COMPLETED",
          transcript: JSON.stringify(transcript),
          scores: JSON.stringify(parsed.scores),
          readiness: parsed.readiness,
          riskLevel: parsed.visaRisk,
          feedback: parsed.feedback,
          completedAt: new Date(),
        },
      });
      await db.timelineEvent.create({
        data: {
          studentId,
          type: "INTERVIEW_COMPLETED",
          title: `AI ${type.replace(/_/g, " ").toLowerCase()} completed`,
          description: `Readiness ${parsed.overallReadiness}% - ${parsed.readiness.replace(/_/g, " ")}`,
        },
      });
      await db.auditLog.create({
        data: { action: "AI_ACTION", resource: "InterviewSession", resourceId: session.id, details: JSON.stringify({ readiness: parsed.readiness }) },
      });
    }

    return NextResponse.json({ report: parsed ?? { feedback: raw } });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
