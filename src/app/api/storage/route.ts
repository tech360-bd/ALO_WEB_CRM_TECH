import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const url = new URL(req.url);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
      
      const files = await db.fileMetadata.findMany({
        orderBy: { uploadedAt: "desc" },
        take: limit,
      }).catch(() => []);
      
      const stats = {
        totalFiles: await db.fileMetadata.count().catch(() => 0),
        totalSize: 0,
        pools: {},
      };
      
      return NextResponse.json({ success: true, data: files, stats });
    } catch {
      return NextResponse.json({ success: true, data: [], stats: { totalFiles: 0 } });
    }
  })(request);
}

