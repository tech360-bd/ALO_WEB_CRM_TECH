// International Officer — University Research Activities CRUD
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const universitySlug = sp.get("universitySlug") || undefined;
    const countrySlug = sp.get("countrySlug") || undefined;
    const status = sp.get("status") || undefined;
    const activityType = sp.get("activityType") || undefined;
    const assignedOfficerId = sp.get("assignedOfficerId") || undefined;
    const q = sp.get("q") || undefined;
    const limit = sp.get("limit") ? Math.min(100, parseInt(sp.get("limit")!)) : 20;
    const offset = sp.get("offset") ? parseInt(sp.get("offset")!) : 0;

    const where: any = {};
    if (universitySlug) where.universitySlug = universitySlug;
    if (countrySlug) where.countrySlug = countrySlug;
    if (status) where.status = status;
    if (activityType) where.activityType = activityType;
    if (assignedOfficerId) where.assignedOfficerId = assignedOfficerId;
    if (q) where.OR = [{ title: { contains: q } }, { description: { contains: q } }, { universityName: { contains: q } }];

    const [activities, total] = await Promise.all([
      db.universityResearchActivity.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
      db.universityResearchActivity.count({ where }),
    ]);

    return NextResponse.json({ success: true, activities, total, limit, offset });
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

    if (!body.universitySlug || !body.title) {
      return NextResponse.json({ error: "universitySlug and title required" }, { status: 400 });
    }

    const activity = await db.universityResearchActivity.create({
      data: {
        universitySlug: body.universitySlug,
        universityName: body.universityName || body.universitySlug,
        countrySlug: body.countrySlug || "",
        activityType: body.activityType || "RESEARCH",
        title: body.title,
        description: body.description || "",
        researchData: body.researchData ? (typeof body.researchData === "string" ? body.researchData : JSON.stringify(body.researchData)) : null,
        status: body.status || "PENDING",
        priority: body.priority || "MEDIUM",
        assignedOfficerId: body.assignedOfficerId || null,
        assignedOfficerName: body.assignedOfficerName || "",
        evidenceUrls: JSON.stringify(body.evidenceUrls || []),
        nextAction: body.nextAction || "",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        createdById: user.id || user.email || "unknown",
      },
    });

    // Also auto-create evidence linkage if researchData provided and university exists
    // And create audit log
    await db.auditLog.create({
      data: {
        action: "RESEARCH_ACTIVITY_CREATED",
        resource: "UniversityResearchActivity",
        resourceId: activity.id,
        details: JSON.stringify({ universitySlug: body.universitySlug, title: body.title }),
        userId: user.id || user.email || "unknown",
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, activity });
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
    const fields = ["title", "description", "status", "priority", "assignedOfficerId", "assignedOfficerName", "nextAction", "countrySlug", "universityName", "activityType"];
    for (const f of fields) if (body[f] !== undefined) updateData[f] = body[f];
    if (body.researchData !== undefined) updateData.researchData = typeof body.researchData === "string" ? body.researchData : JSON.stringify(body.researchData);
    if (body.evidenceUrls !== undefined) updateData.evidenceUrls = JSON.stringify(body.evidenceUrls);
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.status === "COMPLETED") updateData.completedAt = new Date();

    const activity = await db.universityResearchActivity.update({ where: { id: body.id }, data: updateData });
    return NextResponse.json({ success: true, activity });
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
    await db.universityResearchActivity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
