import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const members = await db.teamMember.findMany({
      where: { status: "active" },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error("Team members fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}
