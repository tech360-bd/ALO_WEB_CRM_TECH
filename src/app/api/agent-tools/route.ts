import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    const tools = [
      { id: "web_search", name: "Web Search", description: "Search web for university data", enabled: true },
      { id: "course_matcher", name: "Course Matcher", description: "Match student profile to courses", enabled: true },
      { id: "eligibility_checker", name: "Eligibility Checker", description: "Check admission eligibility", enabled: true },
      { id: "document_ocr", name: "Document OCR", description: "Extract text from documents", enabled: true },
      { id: "email_sender", name: "Email Sender", description: "Send templated emails", enabled: false },
    ];
    return NextResponse.json({ success: true, data: tools });
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    const body = await req.json();
    return NextResponse.json({ success: true, data: { id: "tool-" + Date.now(), ...body, status: "registered" } }, { status: 201 });
  })(request);
}

