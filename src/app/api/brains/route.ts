import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    const brains = [
      { id: "content", name: "Content Brain", status: "active", agents: 12, lastRun: new Date().toISOString() },
      { id: "university", name: "University Research Brain", status: "active", agents: 8, lastRun: new Date().toISOString() },
      { id: "seo", name: "SEO Brain", status: "active", agents: 6, lastRun: new Date().toISOString() },
      { id: "marketing", name: "Marketing Brain", status: "active", agents: 10, lastRun: new Date().toISOString() },
      { id: "student", name: "Student Intelligence Brain", status: "active", agents: 15, lastRun: new Date().toISOString() },
    ];
    return NextResponse.json({ success: true, data: brains });
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    const body = await req.json();
    return NextResponse.json({ success: true, data: { id: "brain-" + Date.now(), ...body, status: "created" } }, { status: 201 });
  })(request);
}

