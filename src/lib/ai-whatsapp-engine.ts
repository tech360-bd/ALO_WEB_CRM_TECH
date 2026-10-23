/**
 * AI WhatsApp Engine — ALO Education
 * Language detection, intent, sentiment, lead scoring, reply generation
 * Must NOT guarantee visa/admission, fabricate info, request passwords/OTP/PIN
 */

import { db } from '@/lib/db';

// Language detection (simple heuristic + AI fallback)
export function detectLanguage(text: string): { language: 'bangla'|'english'|'mixed'|'banglish'; confidence: number } {
  const banglaRegex = /[\u0980-\u09FF]/;
  const hasBangla = banglaRegex.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);
  const banglishKeywords = ['ami','apni','kemon','ki','korchen','lagbe','chai','dorkar','help','kothay','kobe','kivabe'];

  const lower = text.toLowerCase();
  const banglishCount = banglishKeywords.filter(k => lower.includes(k)).length;

  if (hasBangla && hasEnglish) return { language: 'mixed', confidence: 0.85 };
  if (hasBangla) return { language: 'bangla', confidence: 0.95 };
  if (banglishCount >= 2) return { language: 'banglish', confidence: 0.8 };
  return { language: 'english', confidence: 0.9 };
}

// Intent detection
export const INTENTS = [
  'course_inquiry','university_inquiry','country_inquiry','admission','scholarship','visa',
  'documentation','application_status','offer_letter','cas','payment','refund','complaint',
  'urgent_support','appointment','counselor_request','portal_help','partner_communication',
  'follow_up','general_information'
];

const INTENT_KEYWORDS: Record<string, string[]> = {
  course_inquiry: ['course','subject','program','degree','bachelor','master','mba','phd'],
  university_inquiry: ['university','college','campus','ranking'],
  country_inquiry: ['uk','usa','canada','australia','ukvi','country','study in'],
  admission: ['admission','apply','application','intake','deadline'],
  scholarship: ['scholarship','funding','discount','waiver'],
  visa: ['visa','cas','i20','coe','embassy','interview','vfs'],
  documentation: ['document','passport','transcript','certificate','ielts','pte','bank statement','sop','cv'],
  application_status: ['status','offer','conditional','unconditional','application id'],
  offer_letter: ['offer letter','offer','conditional offer'],
  cas: ['cas','confirmation of acceptance'],
  payment: ['payment','fee','tuition','deposit','pay'],
  refund: ['refund','return','money back'],
  complaint: ['complaint','complain','angry','bad service','manager','ceo','coo','অভিযোগ','সমস্যা'],
  urgent_support: ['urgent','emergency','immediate','need help now','after hours','জরুরি','এখনই দরকার','ভিসা জরুরি','পেমেন্ট সমস্যা','ডেডলাইন','call me now'],
  appointment: ['appointment','meeting','schedule','book','counseling'],
  counselor_request: ['counselor','human','person','talk to someone','কাউকে দরকার'],
  portal_help: ['portal','login','password','account','student id'],
  partner_communication: ['partner','b2b','commission','referral'],
  follow_up: ['follow up','follow-up','update','reminder'],
  general_information: ['hello','hi','help','information','info'],
};

export function detectIntent(text: string): { intent: string; confidence: number } {
  const lower = text.toLowerCase();
  let bestIntent = 'general_information';
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  const confidence = Math.min(0.95, 0.4 + bestScore * 0.2);
  return { intent: bestIntent, confidence };
}

// Sentiment detection
export function detectSentiment(text: string): { sentiment: string; confidence: number; isHighRisk: boolean; isUrgent: boolean } {
  const lower = text.toLowerCase();

  const angryWords = ['angry','frustrated','terrible','worst','complaint','disappointed','refund','cheat','scam','অভিযোগ','রাগ','খারাপ'];
  const urgentWords = ['urgent','emergency','immediate','asap','now','today','deadline','জরুরি','এখনই','তাড়াতাড়ি'];
  const positiveWords = ['thanks','thank you','great','good','excellent','helpful','ধন্যবাদ','ভালো'];
  const confusedWords = ['confused','not understand','what','how','why','বুঝতে পারছি না'];

  let sentiment = 'neutral';
  let isHighRisk = false;
  let isUrgent = false;

  if (angryWords.some(w => lower.includes(w))) {
    sentiment = 'angry';
    isHighRisk = true;
  } else if (urgentWords.some(w => lower.includes(w))) {
    sentiment = 'urgent';
    isUrgent = true;
  } else if (positiveWords.some(w => lower.includes(w))) {
    sentiment = 'positive';
  } else if (confusedWords.some(w => lower.includes(w))) {
    sentiment = 'confused';
  }

  // Check complaint + urgent combined
  if (lower.includes('complaint') || lower.includes('অভিযোগ')) {
    sentiment = 'frustrated';
    isHighRisk = true;
  }

  const confidence = isHighRisk || isUrgent ? 0.9 : 0.7;

  return { sentiment, confidence, isHighRisk, isUrgent };
}

// Lead scoring
export function calculateLeadScore(params: {
  engagement?: number; // 0-10
  academicReadiness?: number;
  targetIntake?: string;
  destination?: string;
  budget?: string;
  documents?: number; // count
  responseFrequency?: number;
  applicationStage?: string;
  urgency?: number;
  intent?: string;
}): { score: number; explanation: string } {
  let score = 0;
  const factors: string[] = [];

  if (params.engagement) {
    score += params.engagement * 2;
    factors.push(`engagement:${params.engagement}`);
  }
  if (params.academicReadiness) {
    score += params.academicReadiness * 1.5;
    factors.push(`academic:${params.academicReadiness}`);
  }
  if (params.documents) {
    score += Math.min(20, params.documents * 3);
    factors.push(`docs:${params.documents}`);
  }
  if (params.responseFrequency) {
    score += Math.min(15, params.responseFrequency * 2);
    factors.push(`response:${params.responseFrequency}`);
  }
  if (params.urgency) {
    score += params.urgency * 1.5;
    factors.push(`urgency:${params.urgency}`);
  }
  if (params.applicationStage) {
    const stageScores: Record<string, number> = {
      lead_created: 5,
      counseling: 10,
      application: 20,
      offer: 30,
      cas: 40,
      visa: 50,
    };
    const s = stageScores[params.applicationStage] || 0;
    score += s;
    factors.push(`stage:${params.applicationStage}=${s}`);
  }
  if (params.destination) {
    score += 5;
    factors.push(`destination:${params.destination}`);
  }

  score = Math.min(100, Math.max(0, score));

  return {
    score,
    explanation: `Score ${score}/100 based on ${factors.join(', ')}`,
  };
}

// Deterministic, non-factual staff draft policy. Generated replies are not sent
// from this helper and must be reviewed before any customer communication.
export async function generateAiReply(params: {
  message: string;
  studentName?: string;
  language: string;
  intent: string;
  sentiment: string;
  context?: string;
}): Promise<{ reply: string; shouldHandover: boolean; handoverReason?: string; confidence: number }> {
  const lower = params.message.toLowerCase();
  const language = params.language === 'bangla' ? 'bangla' : 'english';
  const sensitive = /\b(passport|bank statement|bank account|card number|card pin|otp|password|passcode|student id|application status|visa status|date of birth|identity document)\b|পাসপোর্ট|ব্যাংক|ওটিপি|পাসওয়ার্ড|কার্ড|পিন|স্টুডেন্ট আইডি/i.test(params.message);
  const urgent = ['urgent', 'emergency', 'immediate', 'asap', 'today', 'deadline', 'জরুরি', 'এখনই', 'তাড়াতাড়ি'].some((word) => lower.includes(word));
  const complaint = ['complaint', 'complain', 'legal', 'refund dispute', 'angry', 'অভিযোগ'].some((word) => lower.includes(word));
  const asksHuman = ['human', 'counselor', 'talk to person', 'manager', 'কাউন্সেলর', 'মানুষের সঙ্গে'].some((word) => lower.includes(word));
  const shouldHandover = urgent || complaint || asksHuman || sensitive;
  const handoverReason = urgent ? 'urgent_human_review' : complaint ? 'complaint_human_review' : asksHuman ? 'human_requested' : sensitive ? 'sensitive_or_account_specific' : undefined;

  let reply: string;
  if (language === 'bangla') {
    if (sensitive) reply = 'আপনার নিরাপত্তার জন্য এই WhatsApp চ্যাটে Student ID, পাসপোর্ট, ব্যাংক/কার্ড তথ্য, OTP, পাসওয়ার্ড বা ব্যক্তিগত নথি পাঠাবেন না। অ্যাকাউন্ট-সম্পর্কিত সহায়তার জন্য নিরাপদ Student Portal ব্যবহার করুন।';
    else if (/visa|cas|i-20|coe|ভিসা/i.test(lower)) reply = 'ভিসা বা যোগ্যতা সম্পর্কে চূড়ান্ত সিদ্ধান্ত এই খসড়ায় দেওয়া হচ্ছে না। শর্ত পরিবর্তিত হতে পারে—বর্তমান সরকারি/বিশ্ববিদ্যালয়ের অফিসিয়াল উৎসে যাচাই করুন বা অনুমোদিত ALO ভিসা কর্মকর্তার পরামর্শ নিন।';
    else if (complaint || urgent || asksHuman) reply = 'আপনার বার্তাটি একজন অনুমোদিত কাউন্সেলরের মানব পর্যালোচনার জন্য খসড়া করা হয়েছে। প্রয়োজন হলে ২৪/৭ জরুরি সহায়তার জন্য 01805020101 নম্বরে কল করুন। এই চ্যাটে গোপন তথ্য বা নথি পাঠাবেন না।';
    else reply = 'ALO Education-এ যোগাযোগের জন্য ধন্যবাদ। সাধারণ সহায়তার জন্য পছন্দের দেশ, পড়াশোনার স্তর ও সম্ভাব্য intake জানাতে পারেন। নির্দিষ্ট ভর্তি-সংক্রান্ত শর্ত বর্তমান অফিসিয়াল উৎসে যাচাই করুন; কোনো ফলাফল নিশ্চিত নয়।';
  } else {
    if (sensitive) reply = 'For your security, do not share a Student ID, passport, bank/card details, OTP, password, or private document in this WhatsApp chat. Use the secure Student Portal for account-specific help.';
    else if (/visa|cas|i-20|coe|eligib|refusal/.test(lower)) reply = 'This draft does not make a visa or eligibility decision. Requirements can change; verify current information through official government/university sources or an authorized ALO visa officer.';
    else if (complaint || urgent || asksHuman) reply = 'This message needs review by an authorized counselor. For immediate urgent support, call 01805020101. Do not share credentials or private documents in chat.';
    else reply = 'Thank you for contacting ALO Education. For general guidance, you may share your preferred destination, study level, and intended intake. Verify specific requirements with current official sources; no outcome is guaranteed.';
  }

  return { reply, shouldHandover, handoverReason, confidence: 0.5 };
}

// Log AI operations
export async function logAiOperation(params: {
  threadId: string;
  messageId?: string;
  studentId: string;
  intent: string;
  intentConfidence: number;
  sentiment: string;
  sentimentConfidence: number;
  language: string;
  model?: string;
  shouldHandover: boolean;
  handoverReason?: string;
}) {
  await db.aiIntentLog.create({
    data: {
      threadId: params.threadId,
      messageId: params.messageId || '',
      studentId: params.studentId,
      intent: params.intent,
      confidence: params.intentConfidence,
      model: params.model || 'rule_based',
      decisionSource: params.shouldHandover ? 'handover' : 'ai',
      language: params.language,
    },
  }).catch(() => {});

  await db.aiSentimentLog.create({
    data: {
      threadId: params.threadId,
      messageId: params.messageId || '',
      studentId: params.studentId,
      sentiment: params.sentiment,
      confidence: params.sentimentConfidence,
      isHighRisk: params.sentiment === 'angry' || params.sentiment === 'frustrated',
      isUrgent: params.sentiment === 'urgent',
      model: params.model || 'rule_based',
    },
  }).catch(() => {});

  if (params.shouldHandover) {
    await db.aloAuditLog.create({
      data: {
        studentId: params.studentId,
        actorType: 'ai',
        actorName: 'AI Handover',
        action: 'AI_HANDOVER',
        resource: 'CommunicationThread',
        resourceId: params.threadId,
        details: JSON.stringify({ reason: params.handoverReason, intent: params.intent, sentiment: params.sentiment }),
      },
    }).catch(() => {});
  }
}
