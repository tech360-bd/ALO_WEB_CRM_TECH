import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = await db.countryPage.findUnique({
    where: { slug },
    include: { universities: { select: { slug: true, name: true, city: true, quickFacts: true, sourceUrl: true, lastVerifiedAt: true } } },
  });
  if (!country || country.approvalStatus !== "PUBLISHED") {
    return NextResponse.json({ error: "Country page not found" }, { status: 404 });
  }
  return NextResponse.json({ country });
}
