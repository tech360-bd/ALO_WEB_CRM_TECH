import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { downloadFile } from "@/lib/storage-service";

// GET /api/storage/download/[id]
// Streams a private file only after the authenticated user's identity and
// ownership context have been resolved server-side. Query-string identity
// values are intentionally ignored; accepting them would create an IDOR.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult;
  const { id } = await params;

  const userRole = (auth.userType || auth.roles[0] || "").toUpperCase();
  const [student, portalStudent, partner] = await Promise.all([
    db.student.findFirst({ where: { userId: auth.userId }, select: { id: true } }).catch(() => null),
    db.portalStudentProfile.findUnique({ where: { userId: auth.userId }, select: { studentId: true } }).catch(() => null),
    db.partnerProfile.findUnique({ where: { userId: auth.userId }, select: { id: true } }).catch(() => null),
  ]);
  const userStudentId = student?.id || portalStudent?.studentId || undefined;
  const userPartnerId = partner?.id || undefined;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

  try {
    const { buffer, file } = await downloadFile(id, auth.userId, userRole, userStudentId, userPartnerId, ip);
    const uint8 = new Uint8Array(buffer);
    const headers = new Headers();
    headers.set("Content-Type", file.mimeType);
    headers.set("Content-Length", String(buffer.length));
    headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(file.originalName)}"`);
    headers.set("Cache-Control", "private, no-cache");
    headers.set("X-File-Checksum", file.checksumSha256);
    headers.set("X-File-Version", String(file.version));
    return new NextResponse(uint8, { status: 200, headers });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : "File download failed";
    const status = message.includes("Access denied") ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
