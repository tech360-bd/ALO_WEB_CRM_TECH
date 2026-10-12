import { NextRequest, NextResponse } from "next/server";
import { downloadFile } from "@/lib/storage-service";

// GET /api/storage/download/[id]
// Streams a file to the client after verifying access permissions.
// The file is NEVER exposed via a public URL — only through this
// authenticated, permission-checked route.
//
// Query params: ?userId=&userRole=&studentId=&partnerId=
// (In production these come from the session token, not query params.
//  For the sandbox demo we pass them explicitly.)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = req.nextUrl.searchParams.get("userId") || undefined;
  const userRole = req.nextUrl.searchParams.get("userRole") || undefined;
  const userStudentId = req.nextUrl.searchParams.get("studentId") || undefined;
  const userPartnerId = req.nextUrl.searchParams.get("partnerId") || undefined;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

  try {
    const { buffer, file } = await downloadFile(id, userId, userRole, userStudentId, userPartnerId, ip);

    // Convert Buffer to Uint8Array for NextResponse
    const uint8 = new Uint8Array(buffer);

    // Set appropriate headers
    const headers = new Headers();
    headers.set("Content-Type", file.mimeType);
    headers.set("Content-Length", String(buffer.length));
    headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(file.originalName)}"`);
    headers.set("Cache-Control", "private, no-cache");
    headers.set("X-File-Checksum", file.checksumSha256);
    headers.set("X-File-Version", String(file.version));

    return new NextResponse(uint8, { status: 200, headers });
  } catch (err: any) {
    const status = err.message.includes("Access denied") ? 403 : err.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
