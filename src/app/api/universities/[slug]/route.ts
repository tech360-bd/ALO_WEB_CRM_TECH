import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const university = await db.universityPage.findUnique({
    where: { slug },
    include: {
      country: { select: { name: true, shortName: true, flag: true, slug: true } },
      courses: { where: { approvalStatus: "PUBLISHED" }, orderBy: { name: "asc" } },
    },
  });
  if (!university || university.approvalStatus !== "PUBLISHED") {
    return NextResponse.json({ error: "University page not found" }, { status: 404 });
  }
  return NextResponse.json({ university });
}
