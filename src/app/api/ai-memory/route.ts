import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai";
import { db } from "@/lib/db";

// AI Memory — stores and retrieves context by Student ID
// AI uses this to remember student-specific details across conversations
export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { applications: true, documents: true, interviews: { take: 3, orderBy: { startedAt: "desc" } }, timelineEvents: { take: 10, orderBy: { createdAt: "desc" } } },
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  // Build AI memory context
  const memory = {
    studentId: student.studentId,
    name: student.fullName,
    email: student.email,
    mobile: student.mobile,
    destination: student.studyDestination,
    program: student.programTitle,
    level: student.studyLevel,
    intake: student.intake,
    profileCompletion: student.profileCompletion,
    englishTests: JSON.parse(student.englishTests || "[]"),
    hasPassport: student.hasPassport,
    previousRefusal: student.previousRefusal,
    fundingStatus: student.fundingStatus,
    sponsorRelation: student.sponsorRelation,
    applications: student.applications.map((a) => ({ university: a.university, course: a.course, stage: a.stage, country: a.country })),
    documents: student.documents.map((d) => ({ name: d.name, status: d.status, category: d.category })),
    interviews: student.interviews.map((i) => ({ type: i.type, readiness: i.readiness, riskLevel: i.riskLevel })),
    recentTimeline: student.timelineEvents.map((t) => ({ type: t.type, title: t.title, date: t.createdAt })),
  };

  return NextResponse.json({ memory });
}

// AI explains next step based on student data (memory)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, question } = body;

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { applications: true, documents: true, interviews: { take: 3, orderBy: { startedAt: "desc" } } },
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const memoryContext = `Student Memory:
- Name: ${student.fullName} (ID: ${student.studentId})
- Destination: ${student.studyDestination || "Not set"}
- Program: ${student.programTitle || "Not set"}
- Level: ${student.studyLevel || "Not set"}
- Intake: ${student.intake || "Not set"}
- Profile completion: ${student.profileCompletion}%
- English tests: ${student.englishTests}
- Has passport: ${student.hasPassport}
- Previous refusal: ${student.previousRefusal}
- Funding: ${student.fundingStatus}
- Sponsor: ${student.sponsorRelation}
- Applications: ${student.applications.map((a) => `${a.university} - ${a.course} (${a.stage})`).join(", ") || "None"}
- Documents: ${student.documents.map((d) => `${d.name} (${d.status})`).join(", ") || "None"}
- Interviews: ${student.interviews.map((i) => `${i.type} - readiness: ${i.readiness}`).join(", ") || "None"}`;

  const systemPrompt = `You are ALO AI Assistant with access to this student's memory and journey history. Use ONLY this data to answer. Do NOT guarantee admission or visa approval. If unsure, say "needs verification".

${memoryContext}

Student's question: "${question || "What is my next step?"}"

Answer concisely based on the student's actual data above. Reference their specific applications, documents, and stage.`;

  const reply = await aiChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: "Answer based on my data." },
  ]);

  return NextResponse.json({ reply, studentId: student.studentId, memoryUsed: true });
}
