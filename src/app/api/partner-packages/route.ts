import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — partner packages
export async function GET() {
  const packages = await db.partnerPackage.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ packages });
}

// POST — create new partner package
export async function POST(req: NextRequest) {
  const body = await req.json();
  const pkg = await db.partnerPackage.create({ data: body });
  return NextResponse.json({ package: pkg });
}

// PATCH — update partner package
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  const pkg = await db.partnerPackage.update({ where: { id }, data });
  return NextResponse.json({ package: pkg });
}
