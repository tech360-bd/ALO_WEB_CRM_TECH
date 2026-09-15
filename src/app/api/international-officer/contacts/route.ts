// International Officer — Contact Details (B2BContact wrapper with extra logic)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const type = sp.get("type") || undefined;
    const countrySlug = sp.get("countrySlug") || undefined;
    const q = sp.get("q") || undefined;
    const limit = sp.get("limit") ? Math.min(100, parseInt(sp.get("limit")!)) : 50;
    const offset = sp.get("offset") ? parseInt(sp.get("offset")!) : 0;

    const where: any = {};
    if (type) where.type = type;
    if (countrySlug) where.countrySlug = countrySlug;
    if (q) where.OR = [{ name: { contains: q } }, { organization: { contains: q } }, { email: { contains: q } }];

    const [contacts, total] = await Promise.all([
      db.b2BContact.findMany({ where, orderBy: { lastContactedAt: "desc" }, take: limit, skip: offset }),
      db.b2BContact.count({ where }),
    ]);

    return NextResponse.json({ success: true, contacts, total, limit, offset });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    if (!body.name || !body.organization) {
      return NextResponse.json({ error: "name and organization required" }, { status: 400 });
    }

    const contact = await db.b2BContact.create({
      data: {
        name: body.name,
        organization: body.organization,
        type: body.type || "UNIVERSITY",
        email: body.email || "",
        phone: body.phone || "",
        countrySlug: body.countrySlug || "",
        position: body.position || "",
        notes: body.notes || "",
        lastContactedAt: body.lastContactedAt ? new Date(body.lastContactedAt) : new Date(),
      },
    });

    return NextResponse.json({ success: true, contact });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updateData: any = {};
    const fields = ["name", "organization", "type", "email", "phone", "countrySlug", "position", "notes"];
    for (const f of fields) if (body[f] !== undefined) updateData[f] = body[f];
    if (body.lastContactedAt !== undefined) updateData.lastContactedAt = body.lastContactedAt ? new Date(body.lastContactedAt) : null;

    const contact = await db.b2BContact.update({ where: { id: body.id }, data: updateData });
    return NextResponse.json({ success: true, contact });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sp = req.nextUrl.searchParams;
    const id = sp.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.b2BContact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
