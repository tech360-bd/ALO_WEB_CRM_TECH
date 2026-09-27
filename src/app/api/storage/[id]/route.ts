import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/storage-service";

const STAFF_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER"]);

async function requireStorageStaff(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;
  const role = (authResult.userType || authResult.roles[0] || "").toUpperCase();
  if (!STAFF_ROLES.has(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return { auth: authResult, role };
}

// GET /api/storage/[id] — private metadata and audit history.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireStorageStaff(req);
  if (access instanceof NextResponse) return access;
  const { id } = await params;
  const file = await db.fileMetadata.findUnique({
    where: { id },
    include: {
      events: { orderBy: { createdAt: "desc" }, take: 50 },
      versions: { select: { id: true, version: true, uploadedAt: true, uploadedBy: true, sizeBytes: true } },
    },
  });
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });
  return NextResponse.json({ file: { ...file, sizeBytes: Number(file.sizeBytes) } });
}

// DELETE /api/storage/[id] — admin-only soft delete; actor identity is server-derived.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireStorageStaff(req);
  if (access instanceof NextResponse) return access;
  if (!["SUPER_ADMIN", "ADMIN"].includes(access.role)) {
    return NextResponse.json({ error: "Only an administrator can delete files" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) return NextResponse.json({ error: "reason is required" }, { status: 400 });
  try {
    await deleteFile(id, access.auth.userId, reason, req.headers.get("x-forwarded-for") || undefined);
    return NextResponse.json({ message: "File soft-deleted. Physical file retained for audit." });
  } catch (err: any) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unable to delete file" }, { status: 500 });
  }
}
