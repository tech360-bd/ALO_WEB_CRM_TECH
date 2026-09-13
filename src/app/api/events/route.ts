import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/events — list published events
// GET /api/events?slug=... — single event by slug
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const category = req.nextUrl.searchParams.get("category");
  const upcoming = req.nextUrl.searchParams.get("upcoming");

  if (slug) {
    const event = await db.eventPage.findUnique({
      where: { slug, status: "PUBLISHED" },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({ event });
  }

  const where: any = { status: "PUBLISHED" };
  if (category) where.category = category;
  if (upcoming === "true") {
    where.eventDate = { gte: new Date() };
  }

  const events = await db.eventPage.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { eventDate: "asc" }],
    take: 50,
  });

  return NextResponse.json({ events });
}

// POST /api/events — register interest (increments registeredCount)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug } = body as { slug?: string };
  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });

  const event = await db.eventPage.findUnique({ where: { slug } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  if (event.capacity && event.registeredCount >= event.capacity) {
    return NextResponse.json({ error: "This event is fully booked" }, { status: 400 });
  }

  const updated = await db.eventPage.update({
    where: { slug },
    data: { registeredCount: { increment: 1 } },
  });

  return NextResponse.json({
    ok: true,
    registeredCount: updated.registeredCount,
    message: "Registration confirmed. ALO will send your join link via WhatsApp/email shortly.",
  });
}
