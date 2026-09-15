// Partnership Business Strategy — outlining best methods and locations for rapid university partnerships
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const countrySlug = sp.get("countrySlug") || undefined;
    const region = sp.get("region") || undefined;
    const strategyType = sp.get("strategyType") || undefined;
    const status = sp.get("status") || undefined;
    const q = sp.get("q") || undefined;
    const limit = sp.get("limit") ? Math.min(100, parseInt(sp.get("limit")!)) : 20;
    const offset = sp.get("offset") ? parseInt(sp.get("offset")!) : 0;

    const where: any = {};
    if (countrySlug) where.countrySlug = countrySlug;
    if (region) where.region = region;
    if (strategyType) where.strategyType = strategyType;
    if (status) where.status = status;
    if (q) where.OR = [{ title: { contains: q } }, { description: { contains: q } }];

    const [strategies, total] = await Promise.all([
      db.partnershipBusinessStrategy.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
      db.partnershipBusinessStrategy.count({ where }),
    ]);

    return NextResponse.json({ success: true, strategies, total, limit, offset });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const body = await req.json();

    if (!body.title || !body.description) {
      return NextResponse.json({ error: "title and description required" }, { status: 400 });
    }

    let slug = body.slug ? slugify(body.slug) : slugify(body.title);
    const exists = await db.partnershipBusinessStrategy.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString().slice(-6)}`;

    const strategy = await db.partnershipBusinessStrategy.create({
      data: {
        title: body.title,
        slug,
        countrySlug: body.countrySlug || "",
        region: body.region || "",
        strategyType: body.strategyType || "RAPID_PARTNERSHIP",
        description: body.description,
        bestMethods: typeof body.bestMethods === "string" ? body.bestMethods : JSON.stringify(body.bestMethods || ""),
        bestLocations: typeof body.bestLocations === "string" ? body.bestLocations : JSON.stringify(body.bestLocations || ""),
        targetUniversities: JSON.stringify(body.targetUniversities || []),
        contactStrategy: typeof body.contactStrategy === "string" ? body.contactStrategy : JSON.stringify(body.contactStrategy || ""),
        researchLeverage: typeof body.researchLeverage === "string" ? body.researchLeverage : JSON.stringify(body.researchLeverage || ""),
        businessExpansion: typeof body.businessExpansion === "string" ? body.businessExpansion : JSON.stringify(body.businessExpansion || ""),
        status: body.status || "ACTIVE",
        createdById: user.id || user.email || "unknown",
      },
    });

    return NextResponse.json({ success: true, strategy });
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
    const fields = ["title", "countrySlug", "region", "strategyType", "description", "status"];
    for (const f of fields) if (body[f] !== undefined) updateData[f] = body[f];
    if (body.bestMethods !== undefined) updateData.bestMethods = typeof body.bestMethods === "string" ? body.bestMethods : JSON.stringify(body.bestMethods);
    if (body.bestLocations !== undefined) updateData.bestLocations = typeof body.bestLocations === "string" ? body.bestLocations : JSON.stringify(body.bestLocations);
    if (body.targetUniversities !== undefined) updateData.targetUniversities = JSON.stringify(body.targetUniversities);
    if (body.contactStrategy !== undefined) updateData.contactStrategy = typeof body.contactStrategy === "string" ? body.contactStrategy : JSON.stringify(body.contactStrategy);
    if (body.researchLeverage !== undefined) updateData.researchLeverage = typeof body.researchLeverage === "string" ? body.researchLeverage : JSON.stringify(body.researchLeverage);
    if (body.businessExpansion !== undefined) updateData.businessExpansion = typeof body.businessExpansion === "string" ? body.businessExpansion : JSON.stringify(body.businessExpansion);

    const strategy = await db.partnershipBusinessStrategy.update({ where: { id: body.id }, data: updateData });
    return NextResponse.json({ success: true, strategy });
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
    await db.partnershipBusinessStrategy.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
