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
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });
  // Object-level: students can only view own memory; staff can view assigned/any with role
  const isStudent = (auth as any).roles?.includes('STUDENT') || (auth as any).roles?.includes('student');
  // Simplified check: if STUDENT role and requested id != user's linked student, deny unless staff
  const allowedRoles = ['super_admin','admin','counselor','senior_counselor','application_team','SUPER_ADMIN','ADMIN','COUNSELOR'];
  const isStaff = (auth as any).roles?.some((r: string) => allowedRoles.includes(r));
  if (isStudent && !isStaff) {
    // Student must match own id; fetch linked student for this user
    const linked = await db.student.findFirst({ where: { userId: (auth as any).userId } }).catch(() => null);
    if (!linked || linked.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden: not your record' }, { status: 403 });
    }
  }

  const data = await loadStudentMemory(studentId);
  if (!data) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  return NextResponse.json({ memory: toMemory(data) });
}

// AI explains next step based on student data (memory)
export async function POST(req: NextRequest) {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const { studentId, question } = body;
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });
  // Reuse same object-level check as GET
  const allowedRoles = ['super_admin','admin','counselor','senior_counselor','application_team','SUPER_ADMIN','ADMIN','COUNSELOR'];
  const isStaff = (auth as any).roles?.some((r: string) => allowedRoles.includes(r));
  const isStudentRole = (auth as any).roles?.includes('STUDENT') || (auth as any).roles?.includes('student');
  if (isStudentRole && !isStaff) {
    const linked = await db.student.findFirst({ where: { userId: (auth as any).userId } }).catch(() => null);
    if (!linked || linked.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden: not your record' }, { status: 403 });
    }
  }

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
