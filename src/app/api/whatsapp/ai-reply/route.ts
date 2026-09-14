import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, message, studentId, isAfterHours } = body;
  const lowerMsg = message.toLowerCase().trim();
  if (/^(hi|hello|hey|salam|assalam|asa|হাই|হ্যালো|সালাম)/.test(lowerMsg)) return NextResponse.json({ reply: "Hello! 👋 Welcome to ALO Education. I'm your AI assistant. How can I help you today?" });
  if (/^(thanks|thank you|dhonnobad|ধন্যবাদ)/.test(lowerMsg)) return NextResponse.json({ reply: "You're welcome! 😊 Is there anything else I can help you with?" });
  const privateDataKeywords = ["application status", "document", "payment", "visa status", "offer letter", "cas", "bank statement", "passport"];
  if (privateDataKeywords.some((keyword) => lowerMsg.includes(keyword)) && studentId) {
    const crypto = await import("crypto");
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await db.auditLog.create({ data: { action: "DATA_IMPORT", resource: "User", resourceId: studentId, details: JSON.stringify({ otp, otpExpiry, type: "whatsapp_otp", phone }) } });
    return NextResponse.json({ reply: "For security, I need to verify your identity before sharing private information. Please enter the OTP sent to your registered phone.", requiresOtp: true, otp: process.env.NODE_ENV === "development" ? otp : undefined });
  }
  let memoryContext = "";
  if (studentId) {
    const student = await db.student.findUnique({ where: { id: studentId }, select: { name: true, studentId: true, profileComplete: true, currentCountry: true, documents: true } });
    if (student) {
      const [applications, latestEnglish, passport] = await Promise.all([
        db.application.count({ where: { studentId } }),
        db.studentEnglishTest.findFirst({ where: { studentId }, orderBy: { updatedAt: "desc" } }),
        db.studentPassport.findFirst({ where: { studentId } }),
      ]);
      memoryContext = `Student Memory:\n- Name: ${student.name} (ID: ${student.studentId})\n- Destination: ${student.currentCountry || "Not set"}\n- Applications: ${applications}\n- Profile completion: ${student.profileComplete}%\n- Has passport: ${Boolean(passport)}\n- English score: ${latestEnglish?.overallScore ?? "Not provided"}`;
    }
  }
  const systemPrompt = `You are ALO AI WhatsApp Assistant for ALO Education. Be warm, professional, concise, support English and Bangla, do not guarantee visa or admission approval, request OTP before private data, and transfer complex or sensitive disputes to a human counselor. Keep replies under 100 words.\n\n${memoryContext || "No existing student profile found."}\n${isAfterHours ? "AI is handling the first response after office hours." : ""}\n\nUser message: "${message}"\nReply now:`;
  const reply = await aiChat([{ role: "assistant", content: systemPrompt }, { role: "user", content: "Reply to the user's message." }]);
  return NextResponse.json({ reply: reply.trim(), requiresOtp: false });
}
