import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const universitySlug = req.nextUrl.searchParams.get("universitySlug");
  const countrySlug = req.nextUrl.searchParams.get("countrySlug");
  const category = req.nextUrl.searchParams.get("category");
  const where: any = { isActive: true };
  if (universitySlug) where.universitySlug = universitySlug;
  if (countrySlug) where.countrySlug = countrySlug;
  if (category) where.category = category;
  const questions = await db.interviewQuestion.findMany({ where, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { universitySlug, courseSlug, countrySlug, category, question, suggestedAnswer, difficulty } = body;
  if (!category || !question) return NextResponse.json({ error: "category and question required" }, { status: 400 });
  const q = await db.interviewQuestion.create({ data: { universitySlug, courseSlug, countrySlug, category, question, suggestedAnswer, difficulty: difficulty || "MEDIUM" } });
  return NextResponse.json({ question: q });
}
