import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const where: any = {};
  if (type) where.type = type;
  const contacts = await db.b2BContact.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, organization, type, email, phone, countrySlug, position, notes } = body;
  if (!name || !organization) return NextResponse.json({ error: "name and organization required" }, { status: 400 });
  const contact = await db.b2BContact.create({ data: { name, organization, type: type || "UNIVERSITY", email, phone, countrySlug, position, notes } });
  return NextResponse.json({ contact });
}
