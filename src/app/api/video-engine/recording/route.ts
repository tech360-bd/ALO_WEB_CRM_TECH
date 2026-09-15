import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { getVideoEngine } from "@/lib/video-engine";

const AUTH = { requireUserTypes: ["MARKETING", "MARKETING_MANAGER", "SUPER_ADMIN", "ADMIN", "COUNSELOR"] };

export const POST = withAuth(async (req) => {
  try {
    const contentType = req.headers.get("content-type") || "";
    
    // Handle multipart form (browser recording upload)
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("video") as File;
      const counselingSessionId = form.get("counselingSessionId") as string;
      const studentId = form.get("studentId") as string;
      const type = form.get("type") as string || "camera";
      
      if (!file) return NextResponse.json({ success: false, error: "video file required" }, { status: 400 });

      // In real impl, upload to storage and create VideoRecording record
      const recordingId = `rec_${Date.now()}`;
      return NextResponse.json({
        success: true,
        recording: {
          recordingId,
          outputUrl: `/uploads/recordings/${recordingId}.webm`,
          counselingSessionId,
          studentId,
          type,
          size: file.size,
        },
      });
    }

    // JSON (server-side recording start)
    const body = await req.json();
    const { type, jitsiRoomName, counselingSessionId, maxDurationSec, withAudio } = body;
    
    const engine = getVideoEngine();
    const result = await engine.startRecording({
      type: type || "camera",
      jitsiRoomName,
      counselingSessionId,
      maxDurationSec: maxDurationSec || 3600,
      withAudio: withAudio !== false,
    });

    return NextResponse.json({ success: true, recording: result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    // List recordings - would query DB
    return NextResponse.json({
      success: true,
      recordings: [],
      filters: { studentId },
      note: "Query VideoRecording model with studentId filter",
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);
