import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const countries = await db.countryPage.findMany({
    where: { approvalStatus: "PUBLISHED" },
    orderBy: { name: "asc" },
    select: { slug: true, name: true, shortName: true, flag: true, capital: true, currency: true, intro: true, quickFacts: true, lastVerifiedAt: true, verificationStatus: true, sourceUrl: true },
  });
  return NextResponse.json({ countries });
}
