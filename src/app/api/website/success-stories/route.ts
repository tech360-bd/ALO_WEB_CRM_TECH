import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stories = await db.successStory.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ success: true, stories });
  } catch (error) {
    console.error("Success stories fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch success stories" },
      { status: 500 }
    );
  }
}
