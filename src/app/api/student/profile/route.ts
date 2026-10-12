import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — Retrieve student profile
export async function GET(req: NextRequest) {
  const { error: authError, user } = await requireAuth(req);
  if (authError) return authError;

  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  // Students can only view their own profile; staff can view any
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  if (user!.role === "STUDENT" && student.userId !== user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fullStudent = await db.student.findUnique({
    where: { id: studentId },
    include: {
      documents: true,
      applications: true,
      payments: true,
      timelineEvents: { take: 20, orderBy: { createdAt: "desc" } },
      interviews: true,
      mockTests: true,
      visaCases: true,
      notifications: { where: { isRead: false }, take: 5 },
    },
  });

  return NextResponse.json({ student: fullStudent });
}

// PUT — Update student profile
export async function PUT(req: NextRequest) {
  const { error: authError, user } = await requireAuth(req);
  if (authError) return authError;

  const body = await req.json();
  const { studentId, ...updates } = body;

  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  // Verify the student exists and the user has access
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  if (user!.role === "STUDENT" && student.userId !== user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Whitelist of updatable fields matching the Student schema
  const allowedFields = [
    "firstName", "lastName", "fullName", "nationality", "dateOfBirth", "gender", "maritalStatus",
    "cityOfBirth", "countryOfBirth", "presentAddress", "permanentAddress",
    "altEmail", "altMobile", "emergencyName", "emergencyRelation", "emergencyPhone",
    "educationHistory", "hasPassport", "passportNumber", "passportIssuePlace",
    "passportIssueCountry", "passportIssueDate", "passportExpiryDate",
    "englishTests", "englishTestStatus", "workExperience", "recommendations",
    "hasPreviousVisa", "visaHistory", "previousRefusal", "refusalDetail",
    "dependentStatus", "dependentsCount", "medicalCondition", "criminalOffense", "riskNote",
    "fundingStatus", "sponsorRelation", "sourceOfFund", "bankStatementStatus", "sponsorDocStatus",
    "studyDestination", "programTitle", "studyLevel", "studyArea", "intake", "universityPreference",
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      data[key] = updates[key];
    }
  }

  // Auto-compute fullName if firstName/lastName changed
  if (data.firstName || data.lastName) {
    const fn = (data.firstName as string) || student.firstName;
    const ln = (data.lastName as string) || student.lastName;
    data.fullName = `${fn}${ln ? " " + ln : ""}`;
  }

  // Compute profileCompletion (simple heuristic)
  const merged = { ...student, ...data };
  const fields = [
    merged.firstName, merged.lastName, merged.email, merged.mobile,
    merged.nationality, merged.dateOfBirth, merged.gender,
    merged.presentAddress, merged.educationHistory !== "[]",
    merged.hasPassport, merged.englishTests !== "[]",
    merged.studyDestination, merged.studyLevel,
  ];
  const filled = fields.filter(Boolean).length;
  data.profileCompletion = Math.round((filled / fields.length) * 100);

  const updated = await db.student.update({
    where: { id: studentId },
    data,
  });

  // Timeline event
  await db.timelineEvent.create({
    data: {
      studentId,
      userId: user!.id,
      type: "PROFILE_UPDATED",
      title: "Profile updated",
      description: "Student profile information was updated",
    },
  });

  return NextResponse.json({ student: updated });
}
