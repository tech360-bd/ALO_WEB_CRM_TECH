import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    const resources = [
      { id: "1", title: "ALO CRM Basics", type: "video", duration: "15 min", completed: false, category: "onboarding" },
      { id: "2", title: "Student Counseling Best Practices", type: "article", duration: "10 min", completed: false, category: "counseling" },
      { id: "3", title: "Visa Documentation Guide", type: "pdf", duration: "20 min", completed: false, category: "visa" },
      { id: "4", title: "University Admission Requirements 2027", type: "course", duration: "45 min", completed: false, category: "admissions" },
    ];
    return NextResponse.json({ success: true, data: resources });
  })(request);
}

