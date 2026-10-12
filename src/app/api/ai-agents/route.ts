import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const agents = await db.aiAgent.findMany({ orderBy: { department: "asc" } });
  return Response.json({ agents });
}
