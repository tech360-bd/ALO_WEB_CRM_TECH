import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      
      if (!id) return NextResponse.json({ success: false, error: "File id required" }, { status: 400 });
      
      const file = await db.fileMetadata.findUnique({ where: { id } }).catch(() => null);
      if (!file) return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
      
      // In production, stream file from disk/S3
      // For now, return metadata with download URL placeholder
      return NextResponse.json({
        success: true,
        data: file,
        downloadUrl: `/api/storage/download/${id}`,
        message: "File metadata retrieved - implement actual file streaming in production"
      });
    } catch (e) {
      return NextResponse.json({ success: false, error: "Download failed" }, { status: 500 });
    }
  })(request);
}

