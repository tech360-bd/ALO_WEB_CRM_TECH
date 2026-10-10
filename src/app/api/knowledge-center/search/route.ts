import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiChat } from "@/lib/ai";
import { withAuth, type AuthContext } from "@/lib/auth-middleware";

// GET — enterprise search across documents, news, training
async function searchKnowledge(req: Request, _auth: AuthContext) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q) return NextResponse.json({ results: [] });
  const query = q.toLowerCase();

  const [documents, news, trainings] = await Promise.all([
    db.knowledgeDocument.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { tags: { contains: query } },
          { aiTags: { contains: query } },
          { aiSummary: { contains: query } },
        ],
        approvalStatus: "APPROVED",
      },
      take: 20,
    }),
    db.knowledgeNews.findMany({
      where: {
        OR: [{ title: { contains: query } }, { content: { contains: query } }, { tags: { contains: query } }],
        status: "PUBLISHED",
      },
      take: 10,
    }),
    db.trainingMaterial.findMany({
      where: {
        OR: [{ title: { contains: query } }, { description: { contains: query } }, { tags: { contains: query } }],
        status: "ACTIVE",
      },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    query: q,
    results: {
      documents: documents.length,
      news: news.length,
      trainings: trainings.length,
      total: documents.length + news.length + trainings.length,
    },
    documents,
    news,
    trainings,
  });
}

// POST — AI Knowledge Search
async function aiKnowledgeSearch(req: Request, _auth: AuthContext) {
  const { question } = await req.json();
  if (!question) return NextResponse.json({ error: "Question required" }, { status: 400 });

  // Search knowledge base
  const query = question.toLowerCase();
  const documents = await db.knowledgeDocument.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
        { tags: { contains: query } },
        { aiSummary: { contains: query } },
        { aiTags: { contains: query } },
      ],
      approvalStatus: "APPROVED",
    },
    take: 10,
  });

  const news = await db.knowledgeNews.findMany({
    where: {
      OR: [{ title: { contains: query } }, { content: { contains: query } }],
      status: "PUBLISHED",
    },
    take: 5,
  });

  // Also search VERIFIED university/course data (Task 21 integration)
  // Only APPROVED + VERIFIED records are ever exposed — never pending changes.
  const [universities, courses] = await Promise.all([
    db.universityPage.findMany({
      where: {
        AND: [
          { verificationStatus: "VERIFIED" },
          { approvalStatus: "PUBLISHED" },
          {
            OR: [
              { name: { contains: query } },
              { city: { contains: query } },
              { overview: { contains: query } },
            ],
          },
        ],
      },
      take: 5,
      select: { slug: true, name: true, countrySlug: true, city: true, overview: true, sourceUrl: true, lastVerifiedAt: true },
    }),
    db.coursePage.findMany({
      where: {
        AND: [
          { verificationStatus: "VERIFIED" },
          { approvalStatus: "PUBLISHED" },
          {
            OR: [
              { name: { contains: query } },
              { subject: { contains: query } },
              { overview: { contains: query } },
              { tuition: { contains: query } },
              { intake: { contains: query } },
            ],
          },
        ],
      },
      take: 5,
      select: { slug: true, name: true, level: true, subject: true, duration: true, intake: true, tuition: true, englishRequirement: true, universitySlug: true },
    }),
  ]);

  // AI summarizes findings
  const context = documents.map(d => `- ${d.title} (${d.fileType}): ${d.aiSummary || d.description || "No summary"}`).join("\n");
  const newsContext = news.map(n => `- ${n.title}: ${n.content.slice(0, 200)}`).join("\n");
  const uniContext = universities.map(u => `- ${u.name} (${u.city}, ${u.countrySlug}): ${u.overview.slice(0, 150)} — source: ${u.sourceUrl}`).join("\n");
  const courseContext = courses.map(c => `- ${c.name} (${c.level}, ${c.subject}) at ${c.universitySlug}: intake ${c.intake}, tuition ${c.tuition.slice(0, 80)}, English: ${c.englishRequirement.slice(0, 80)}`).join("\n");

  const systemPrompt = `You are the ALO Education Knowledge Search Agent. An employee asked: "${question}"

Search results from the Knowledge Center:

Documents found:
${context || "No documents found."}

News found:
${newsContext || "No news found."}

Verified universities (from the University Monitoring System):
${uniContext || "No matching universities."}

Verified courses (from the University Monitoring System):
${courseContext || "No matching courses."}

IMPORTANT: All university/course data shown above is APPROVED + VERIFIED. It comes from the official university monitoring system which checks official sources every 7 days. You may confidently cite this data to employees.

Provide a helpful answer based on the search results. Include document titles, university names, and course details where relevant. Always mention the official source URL when citing university information. If no relevant data found, suggest checking with a senior counselor.`;

  const reply = await aiChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: "Answer based on the knowledge search results." },
  ]);

  return NextResponse.json({
    answer: reply,
    documents: documents.map(d => ({ id: d.id, title: d.title, fileType: d.fileType, summary: d.aiSummary })),
    news: news.map(n => ({ id: n.id, title: n.title })),
    universities: universities.map(u => ({ slug: u.slug, name: u.name, country: u.countrySlug, city: u.city, sourceUrl: u.sourceUrl })),
    courses: courses.map(c => ({ slug: c.slug, name: c.name, level: c.level, universitySlug: c.universitySlug })),
    totalResults: documents.length + news.length + universities.length + courses.length,
  });
}


const KNOWLEDGE_ACCESS = { requireUserTypes: ["ADMIN", "SUPER_ADMIN", "EMPLOYEE", "HR_MANAGER", "BRANCH_MANAGER", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "MARKETING_MANAGER", "MARKETING", "FRONT_DESK", "SUPPORT_STAFF", "ENGLISH_TRAINER"] };
export const GET = withAuth(searchKnowledge, KNOWLEDGE_ACCESS);
export const POST = withAuth(aiKnowledgeSearch, KNOWLEDGE_ACCESS);
