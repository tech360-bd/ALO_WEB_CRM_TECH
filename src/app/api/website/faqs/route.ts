import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const faqs = await db.homepageFaq.findMany({
      where: { status: "active" },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ success: true, faqs });
  } catch (error) {
    console.error("FAQs fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}
