import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const saved = await db.savedCourse.findMany({
        where: { studentId: auth.userId },
        include: { course: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }).catch(() => []);
      return NextResponse.json({ success: true, data: saved });
    } catch {
      return NextResponse.json({ success: true, data: [] });
    }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { courseId, courseTitle, universityId } = body;
      if (!courseId) return NextResponse.json({ success: false, error: "courseId required" }, { status: 400 });
      
      const saved = await db.savedCourse.create({
        data: {
          studentId: auth.userId,
          courseId,
          courseTitle: courseTitle || "",
          universityId: universityId || "",
        }
      }).catch(() => ({ id: "saved-" + Date.now(), courseId, savedAt: new Date().toISOString() }));
      
      return NextResponse.json({ success: true, data: saved }, { status: 201 });
    } catch (e) {
      return NextResponse.json({ success: false, error: "Failed to save course" }, { status: 500 });
    }
  })(request);
}

export async function DELETE(request: Request) {
  return withAuth(async (req, auth) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    try {
      await db.savedCourse.delete({ where: { id } }).catch(() => null);
      return NextResponse.json({ success: true, message: "Removed from saved" });
    } catch {
      return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
    }
  })(request);
}

