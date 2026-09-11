import { db } from "@/lib/db";

export async function GET() {
  const agents = await db.aiAgent.findMany({ orderBy: { department: "asc" } });
  return Response.json({ agents });
}
