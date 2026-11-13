import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasCurrentVerifiedPublicSource } from "@/lib/public-source-review";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const country = await db.countryPage.findUnique({
      where: { slug },
      include: {
        universities: {
          where: { approvalStatus: "PUBLISHED" },
          select: {
            slug: true,
            name: true,
            city: true,
            quickFacts: true,
            sourceUrl: true,
            lastVerifiedAt: true,
            verificationStatus: true,
            approvalStatus: true,
          },
        },
      },
    });
    if (!country || country.approvalStatus !== "PUBLISHED" || !hasCurrentVerifiedPublicSource(country)) {
      return NextResponse.json({ error: "Country page not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    const universities = country.universities.filter((university) => hasCurrentVerifiedPublicSource(university));
    return NextResponse.json(
      { country: { ...country, universities } },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } },
    );
  } catch {
    return NextResponse.json({ error: "Country page is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
