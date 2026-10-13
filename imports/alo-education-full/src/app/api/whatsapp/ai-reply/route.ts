import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai";
import { db } from "@/lib/db";

// WhatsApp AI reply — generates context-aware AI reply with memory
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, message, conversationId, studentId, isAfterHours } = body;

  // Rule-based replies (no AI cost) for common greetings
  const lowerMsg = message.toLowerCase().trim();
  if (/^(hi|hello|hey|salam|assalam|asa|হাই|হ্যালো|সালাম)/.test(lowerMsg)) {
    return NextResponse.json({ reply: "Hello! 👋 Welcome to ALO Education. I'm your AI assistant. How can I help you today?" });
  }
  if (/^(thanks|thank you|dhonnobad|ধন্যবাদ)/.test(lowerMsg)) {
    return NextResponse.json({ reply: "You're welcome! 😊 Is there anything else I can help you with?" });
  }

  // Check if message asks for private data (requires OTP)
  const privateDataKeywords = ["application status", "document", "payment", "visa status", "offer letter", "cas", "bank statement", "passport"];
  const requiresOtp = privateDataKeywords.some((k) => lowerMsg.includes(k));

  if (requiresOtp && studentId) {
    // Generate OTP
    const crypto = await import("crypto");
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.auditLog.create({
      data: {
        action: "DATA_IMPORT",
        resource: "User",
        resourceId: studentId,
        details: JSON.stringify({ otp, otpExpiry, type: "whatsapp_otp", phone }),
      },
    });

    return NextResponse.json({
      reply: `For security, I need to verify your identity before sharing private information. Please enter the OTP sent to your registered phone: `,
      requiresOtp: true,
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  }

  // Load student memory if student exists
  let memoryContext = "";
  if (studentId) {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { applications: true, documents: true, interviews: { take: 1, orderBy: { startedAt: "desc" } } },
    });
    if (student) {
      memoryContext = `Student Memory:
- Name: ${student.fullName} (ID: ${student.studentId})
- Destination: ${student.studyDestination || "Not set"}
- Program: ${student.programTitle || "Not set"}
- Applications: ${student.applications.length}
- Profile completion: ${student.profileCompletion}%
- Has passport: ${student.hasPassport}`;
    }
  }

  const systemPrompt = `You are ALO AI WhatsApp Assistant for ALO Education. You work 24/7 — during office hours counselors handle chats, after hours you handle first response automatically.

Rules:
- Be warm, professional, and concise (suitable for WhatsApp).
- Support both English and Bangla based on the user's language.
- Do NOT guarantee visa or admission approval.
- If the user asks for private data (application status, documents, payments, visa), ask for OTP verification first.
- If the case is complex, angry, involves payment disputes, visa refusal, complaints, or emergencies, transfer to a human counselor.
- Keep replies under 100 words.
- If you don't know something, suggest booking a consultation.

${memoryContext ? memoryContext : "No existing student profile found."}
${isAfterHours ? "Note: This is after office hours. AI is handling the first response." : ""}

User message: "${message}"

Reply now:`;

  const reply = await aiChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: "Reply to the user's message." },
  ]);

  return NextResponse.json({ reply: reply.trim(), requiresOtp: false });
}
