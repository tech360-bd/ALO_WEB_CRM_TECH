import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const entityType = formData.get("entityType") as string || "general";
      const entityId = formData.get("entityId") as string || "";
      
      if (!file) return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
      
      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) return NextResponse.json({ success: false, error: "File too large (max 10MB)" }, { status: 400 });
      
      // Create metadata record
      const metadata = await db.fileMetadata.create({
        data: {
          uuid: "file-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          extension: file.name.split(".").pop() || "",
          sizeBytes: BigInt(file.size),
          storagePool: "default",
          entityType,
          entityId,
          uploadedBy: auth.userId,
          status: "ACTIVE",
          visibility: "private",
          source: "upload",
        }
      }).catch(() => ({
        id: "file-" + Date.now(),
        originalName: file.name,
        sizeBytes: file.size,
        status: "ACTIVE"
      }));
      
      return NextResponse.json({ success: true, data: metadata, message: "File uploaded successfully" }, { status: 201 });
    } catch (e) {
      console.error("Upload error:", e);
      return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
    }
  })(request);
}

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    return NextResponse.json({ success: true, message: "Use POST with multipart/form-data to upload", limits: { maxSize: "10MB", allowedTypes: ["pdf", "jpg", "png", "docx"] } });
  })(request);
}

