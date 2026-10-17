import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const countrySlug = req.nextUrl.searchParams.get("country");
  const where: any = { approvalStatus: "PUBLISHED" };
  if (countrySlug) where.countrySlug = countrySlug;
  const universities = await db.universityPage.findMany({
    where,
    orderBy: { name: "asc" },
    include: { country: { select: { name: true, shortName: true, flag: true } } },
  });
  return NextResponse.json({ universities });
}
