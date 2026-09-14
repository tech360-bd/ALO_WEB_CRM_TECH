import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai";
import { db } from "@/lib/db";

// AI Memory — stores and retrieves context by Student ID using Main's canonical
// student detail tables. The donor route's relation includes do not exist in Main.
async function loadStudentMemory(studentId: string) {
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return null;

  const [applications, documents, interviews, timelineEvents, preference, passport, englishTests, funding] = await Promise.all([
    db.application.findMany({ where: { studentId }, orderBy: { updatedAt: "desc" } }),
    db.studentDocument.findMany({ where: { studentId }, orderBy: { updatedAt: "desc" } }),
    db.aiInterviewSession.findMany({ where: { studentId }, take: 3, orderBy: { startedAt: "desc" } }),
    db.timelineEvent.findMany({ where: { studentId }, take: 10, orderBy: { createdAt: "desc" } }),
    db.studentAdmissionPreference.findFirst({ where: { studentId }, orderBy: { updatedAt: "desc" } }),
    db.studentPassport.findFirst({ where: { studentId }, orderBy: { updatedAt: "desc" } }),
    db.studentEnglishTest.findMany({ where: { studentId }, orderBy: { updatedAt: "desc" } }),
    db.studentFunding.findFirst({ where: { studentId }, orderBy: { updatedAt: "desc" } }),
  ]);

  return {
    student,
    applications,
    documents,
    interviews,
    timelineEvents,
    preference,
    passport,
    englishTests,
    funding,
  };
}

function toMemory(data: NonNullable<Awaited<ReturnType<typeof loadStudentMemory>>>) {
  const { student, applications, documents, interviews, timelineEvents, preference, passport, englishTests, funding } = data;
  return {
    studentId: student.studentId,
    name: student.name,
    email: student.email,
    mobile: student.phone,
    destination: preference?.preferredCountry || student.currentCountry,
    program: preference?.preferredCourse || "",
    level: preference?.preferredLevel || "",
    intake: preference?.preferredIntake || "",
    profileCompletion: student.profileComplete,
    englishTests: englishTests.map((test) => ({ type: test.testType, overallScore: test.overallScore })),
    hasPassport: Boolean(passport?.passportNumber),
    previousRefusal: false,
    fundingStatus: funding?.fundingType || "",
    sponsorRelation: funding?.sponsorRelation || "",
    applications: applications.map((application) => ({
      university: application.universityName,
      course: application.courseName,
      stage: application.stage,
      country: application.country,
    })),
    documents: documents.map((document) => ({
      name: document.fileName || document.category,
      status: document.status,
      category: document.category,
    })),
    interviews: interviews.map((interview) => ({
      type: interview.interviewType,
      readiness: interview.readinessScore,
      riskLevel: interview.riskLevel,
    })),
    recentTimeline: timelineEvents.map((event) => ({
      type: event.stage,
      title: event.title,
      date: event.createdAt,
    })),
  };
}

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const data = await loadStudentMemory(studentId);
  if (!data) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  return NextResponse.json({ memory: toMemory(data) });
}

// AI explains next step based on student data (memory)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, question } = body;
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const data = await loadStudentMemory(studentId);
  if (!data) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  const memory = toMemory(data);
  const memoryContext = `Student Memory:\n${JSON.stringify(memory, null, 2)}`;

  const systemPrompt = `You are ALO AI Assistant with access to this student's memory and journey history. Use ONLY this data to answer. Do NOT guarantee admission or visa approval. If unsure, say "needs verification".

${memoryContext}

Student's question: "${question || "What is my next step?"}"

Answer concisely based on the student's actual data above. Reference their specific applications, documents, and stage.`;

  const reply = await aiChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: "Answer based on my data." },
  ]);

  return NextResponse.json({ reply, studentId: data.student.studentId, memoryUsed: true });
}
