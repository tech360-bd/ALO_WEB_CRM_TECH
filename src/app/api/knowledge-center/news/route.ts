import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, type AuthContext } from "@/lib/auth-middleware";

// GET — knowledge news
async function listKnowledgeNews(req: Request, _auth: AuthContext) {
  const category = new URL(req.url).searchParams.get("category");
  const country = new URL(req.url).searchParams.get("country");
  const where: any = { status: "PUBLISHED" };
  if (category) where.category = category;
  if (country) where.country = country;
  const news = await db.knowledgeNews.findMany({ where, orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }], take: 30 });
  return NextResponse.json({ news });
}

// POST — create news
async function createKnowledgeNews(req: Request, auth: AuthContext) {
  const body = await req.json();
  const news = await db.knowledgeNews.create({ data: { ...body, authorId: auth.userId, status: "DRAFT" } });
  return NextResponse.json({ news, message: "News submitted to Knowledge Center for approval." });
}


const KNOWLEDGE_ACCESS = { requireUserTypes: ["ADMIN", "SUPER_ADMIN", "EMPLOYEE", "HR_MANAGER", "BRANCH_MANAGER", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "MARKETING_MANAGER", "MARKETING", "FRONT_DESK", "SUPPORT_STAFF", "ENGLISH_TRAINER"] };
export const GET = withAuth(listKnowledgeNews, KNOWLEDGE_ACCESS);
export const POST = withAuth(createKnowledgeNews, KNOWLEDGE_ACCESS);
