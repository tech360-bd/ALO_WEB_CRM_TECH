import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";

// Simple in-memory rate limiter: max 20 requests per minute per user
const chatRateLimit = new Map<string, { count: number; windowStart: number }>();
const CHAT_RATE_LIMIT = 20;
const CHAT_RATE_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = chatRateLimit.get(userId);

  if (!entry || now - entry.windowStart > CHAT_RATE_WINDOW_MS) {
    chatRateLimit.set(userId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= CHAT_RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of chatRateLimit.entries()) {
    if (now - entry.windowStart > CHAT_RATE_WINDOW_MS * 2) {
      chatRateLimit.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const POST = withAuth(async (req: Request, auth) => {
  try {
    // Rate limit check
    if (!checkRateLimit(auth.userId)) {
      return NextResponse.json(
        { reply: "You're sending messages too quickly. Please wait a moment before asking another question." },
        { status: 429 }
      );
    }

    const { message, context } = await req.json();

    const systemPrompt = `You are an AI study abroad counselor for ALO Education, helping Bangladeshi students.
You have knowledge about:
- 13 study destinations: UK, USA, Canada, Australia, Germany, Ireland, New Zealand, Dubai, Denmark, Europe (Schengen), Japan, Malaysia, South Korea
- 111+ partner universities across these countries
- Course information at Bachelor's, Master's, PhD, Foundation, and Diploma levels
- Visa requirements, tuition costs, living expenses, work rights, and post-study visa options
- IELTS/TOEFL/PTE requirements
- Scholarships including Chevening, Commonwealth, Fulbright, MEXT, DAAD, KGSP
- Application processes and document requirements

Context provided by user: ${context || "General inquiry"}

Be helpful, accurate, and encouraging. If unsure about specific data, recommend the student book a free consultation for personalized advice. Keep responses concise but informative.`;

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ZAI_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { reply: "I'm having trouble connecting right now. Please try again or book a free consultation with our expert counselors." },
        { status: 200 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'd be happy to help! Could you tell me more about what you're looking for? For example, which country interests you, what subject you'd like to study, or what your budget range is.";

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { reply: "Thank you for your message! For the most accurate and personalized guidance, I recommend booking a free consultation with one of our expert counselors who can provide tailored advice based on your profile." },
      { status: 200 }
    );
  }
});
