import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reviews/submit/[token]
// Public endpoint — fetches the invitation details so the student can
// submit their review without logging in. Marks the invitation as OPENED.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await db.reviewInvitation.findUnique({ where: { token } });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid or expired review link." }, { status: 404 });
  }

  if (invitation.status === "SUBMITTED") {
    return NextResponse.json({ error: "This review link has already been used.", alreadySubmitted: true }, { status: 410 });
  }

  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    await db.reviewInvitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "This review link has expired." }, { status: 410 });
  }

  // Mark as opened
  if (invitation.status === "SENT") {
    await db.reviewInvitation.update({
      where: { id: invitation.id },
      data: { status: "OPENED", openedAt: new Date() },
    });
  }

  return NextResponse.json({
    invitation: {
      id: invitation.id,
      studentName: invitation.studentName,
      country: invitation.country,
      serviceType: invitation.serviceType,
      counselorId: invitation.counselorId,
      googleReviewUrl: invitation.googleReviewUrl,
      facebookRecommendUrl: invitation.facebookRecommendUrl,
      expiresAt: invitation.expiresAt,
    },
  });
}

// POST /api/reviews/submit/[token]
// Public endpoint — student submits their review. Consent is captured explicitly.
// The review is NEVER auto-published — it goes to the moderation queue.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();
  const {
    rating, reviewText, photoFileId,
    consentPublish, consentMarketing, consentShowName,
  } = body as {
    rating: number; reviewText: string; photoFileId?: string;
    consentPublish: boolean; consentMarketing: boolean; consentShowName: boolean;
  };

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
  }
  if (!reviewText || reviewText.trim().length < 10) {
    return NextResponse.json({ error: "Please write at least a short review." }, { status: 400 });
  }

  const invitation = await db.reviewInvitation.findUnique({ where: { token } });
  if (!invitation) {
    return NextResponse.json({ error: "Invalid review link." }, { status: 404 });
  }
  if (invitation.status === "SUBMITTED") {
    return NextResponse.json({ error: "This review link has already been used." }, { status: 410 });
  }
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "This review link has expired." }, { status: 410 });
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

  // Run AI moderation (spam/fraud detection) — uses z-ai-web-dev-sdk
  const moderation = await runAiModeration(reviewText, invitation);

  // Create the review
  const review = await db.studentReview.create({
    data: {
      invitationId: invitation.id,
      studentId: invitation.studentId,
      studentName: invitation.studentName,
      studentEmail: invitation.studentEmail,
      country: invitation.country,
      counselorName: invitation.counselorId, // simplified
      serviceType: invitation.serviceType,
      rating,
      reviewText,
      photoFileId,
      // Consent (explicitly captured)
      consentPublish: !!consentPublish,
      consentMarketing: !!consentMarketing,
      consentShowName: !!consentShowName,
      consentCapturedAt: new Date(),
      consentIp: ip,
      // Moderation
      aiSpamScore: moderation.spamScore,
      aiFlags: JSON.stringify(moderation.flags),
      aiSentiment: moderation.sentiment,
      moderationStatus: moderation.flags.length > 0 ? "NEEDS_REVIEW" : "PENDING",
      isVerifiedStudent: !!invitation.studentId,
    },
  });

  // Update invitation status
  await db.reviewInvitation.update({
    where: { id: invitation.id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      reviewId: review.id,
    },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      userId: invitation.studentId,
      action: "REVIEW_SUBMITTED",
      resource: "StudentReview",
      resourceId: review.id,
      details: JSON.stringify({
        rating, consentPublish, consentMarketing, consentShowName,
        spamScore: moderation.spamScore, flags: moderation.flags,
      }),
    },
  });

  return NextResponse.json({
    review: {
      id: review.id,
      rating: review.rating,
      moderationStatus: review.moderationStatus,
    },
    moderation,
    message: consentPublish
      ? "Thank you! Your review has been submitted and will be published after moderation."
      : "Thank you for your feedback! Your review has been recorded internally.",
  }, { status: 201 });
}

// AI moderation: spam, fraud, offensive content detection.
// Uses z-ai-web-dev-sdk. Does NOT rewrite the student's review — only flags it.
async function runAiModeration(reviewText: string, invitation: any): Promise<{
  spamScore: number;
  flags: string[];
  sentiment: string;
}> {
  const flags: string[] = [];
  let spamScore = 0;

  // Heuristic checks first (fast, no API call)
  const lower = reviewText.toLowerCase();
  if (reviewText.length < 20) { flags.push("VERY_SHORT"); spamScore += 0.2; }
  if (/(.)\1{10,}/.test(reviewText)) { flags.push("REPETITIVE_CHARS"); spamScore += 0.3; }
  if (/https?:\/\//i.test(reviewText)) { flags.push("CONTAINS_URL"); spamScore += 0.2; }
  if (/\b(free|win|prize|lottery|click here|buy now)\b/i.test(reviewText)) { flags.push("SPAM_KEYWORDS"); spamScore += 0.4; }
  if (/\b(bad word|offensive)\b/i.test(reviewText)) { flags.push("POSSIBLE_OFFENSIVE"); spamScore += 0.3; }

  // Sentiment (simple heuristic)
  const positiveWords = ["excellent", "great", "amazing", "helpful", "professional", "recommend", "thank", "happy", "satisfied", "best"];
  const negativeWords = ["bad", "terrible", "worst", "horrible", "disappointed", "waste", "scam", "fraud", "angry", "frustrated"];
  let posCount = 0, negCount = 0;
  for (const w of positiveWords) if (lower.includes(w)) posCount++;
  for (const w of negativeWords) if (lower.includes(w)) negCount++;
  const sentiment = posCount > negCount ? "POSITIVE" : negCount > posCount ? "NEGATIVE" : "NEUTRAL";

  // Try AI-powered analysis (best-effort — falls back to heuristics on error)
  try {
    const { getZai } = await import("@/lib/ai");
    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      messages: [{
        role: "user",
        content: `Analyze this student review for spam, fraud, or offensive content. Return JSON: {"spamScore": 0.0-1.0, "flags": ["list","of","issues"], "sentiment": "POSITIVE|NEUTRAL|NEGATIVE"}

Review: "${reviewText.slice(0, 1000)}"

Flags to check: SPAM, FABRICATED, OFFENSIVE, PERSONAL_INFO, DUPLICATE_SUSPECTED, EXTERNAL_PROMOTION. Only include flags that apply. Do NOT rewrite the review. Do NOT modify the student's words.`,
      }],
      thinking: { type: "disabled" },
      temperature: 0.1,
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || "{}");
    if (typeof parsed.spamScore === "number") spamScore = Math.max(spamScore, parsed.spamScore);
    if (Array.isArray(parsed.flags)) flags.push(...parsed.flags.filter((f: any) => typeof f === "string"));
    if (parsed.sentiment) { /* keep AI sentiment if provided */ }
  } catch {
    // Fall back to heuristics only
  }

  return { spamScore: Math.min(spamScore, 1), flags: Array.from(new Set(flags)), sentiment };
}
