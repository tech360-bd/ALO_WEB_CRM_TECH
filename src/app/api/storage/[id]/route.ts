import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/storage-service";

// GET /api/storage/[id]
// Returns full metadata for a single file, including its event history.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = await db.fileMetadata.findUnique({
    where: { id },
    include: {
      events: { orderBy: { createdAt: "desc" }, take: 50 },
      versions: { select: { id: true, version: true, uploadedAt: true, uploadedBy: true, sizeBytes: true } },
    },
  });
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });
  return NextResponse.json({ file });
}

// DELETE /api/storage/[id]
// Soft-deletes a file (never hard-deletes — the physical file is kept for audit/restore).
// Body: { deletedBy, reason }
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { deletedBy, reason } = body as { deletedBy: string; reason: string };
  if (!deletedBy || !reason) {
    return NextResponse.json({ error: "deletedBy and reason are required" }, { status: 400 });
  }
  try {
    await deleteFile(id, deletedBy, reason, req.headers.get("x-forwarded-for") || undefined);
    return NextResponse.json({ message: "File soft-deleted. Physical file retained for audit." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
