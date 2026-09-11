import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createReviewRequest } from "@/lib/review-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/reviews/request
// Auth required — staff creates a review request for a student.
// Body: { studentId, serviceType, country?, studentName?, studentEmail?,
//         studentPhone?, requestedById? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    studentId,
    serviceType,
    country,
    studentName,
    studentEmail,
    studentPhone,
  } = body as Record<string, unknown>;

  if (!studentId || typeof studentId !== "string") {
    return NextResponse.json({ error: "studentId is required" }, { status: 400 });
  }
  if (!serviceType || typeof serviceType !== "string") {
    return NextResponse.json({ error: "serviceType is required" }, { status: 400 });
  }

  const requestedById = (session.user as { id?: string }).id;

  try {
    const review = await createReviewRequest({
      studentId,
      serviceType,
      country: typeof country === "string" ? country : undefined,
      studentName: typeof studentName === "string" ? studentName : undefined,
      studentEmail: typeof studentEmail === "string" ? studentEmail : undefined,
      studentPhone: typeof studentPhone === "string" ? studentPhone : undefined,
      requestedById,
    });
    return NextResponse.json({ ok: true, review });
  } catch (err: unknown) {
    const e = err as { message?: string };
    const status = e?.message === "Student not found" ? 404 : 500;
    return NextResponse.json(
      { error: e?.message || "Failed to create review request" },
      { status }
    );
  }
}
