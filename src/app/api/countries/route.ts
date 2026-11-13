import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasCurrentVerifiedPublicSource } from "@/lib/public-source-review";

export async function GET() {
  try {
    const rows = await db.countryPage.findMany({
      where: { approvalStatus: "PUBLISHED" },
      orderBy: { name: "asc" },
      select: { slug: true, name: true, shortName: true, flag: true, capital: true, currency: true, intro: true, quickFacts: true, lastVerifiedAt: true, verificationStatus: true, sourceUrl: true },
    });
    const countries = rows.filter((country) => hasCurrentVerifiedPublicSource(country));
    return NextResponse.json({ countries }, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json({ error: "Country catalogue is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
