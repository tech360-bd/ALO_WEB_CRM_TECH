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

// AI reply generation (safe, no guarantees)
export async function generateAiReply(params: {
  message: string;
  studentName?: string;
  language: string;
  intent: string;
  sentiment: string;
  context?: string;
}): Promise<{ reply: string; shouldHandover: boolean; handoverReason?: string; confidence: number }> {
  const { message, studentName, language, intent, sentiment, context } = params;

  // Check handover conditions
  const lower = message.toLowerCase();

  const handoverTriggers = [
    'human','counselor','talk to person','manager','ceo','coo',
    'complaint','legal','visa refusal','payment dispute','angry',
    'sensitive document','cannot answer','কাউকে দরকার','অভিযোগ'
  ];

  if (handoverTriggers.some(t => lower.includes(t))) {
    return {
      reply: language === 'bangla'
        ? `ধন্যবাদ ${studentName || ''}। আপনার বিষয়টি আমাদের কাউন্সেলরের কাছে পাঠানো হয়েছে। খুব শীঘ্রই যোগাযোগ করা হবে। জরুরি হলে কল করুন: 01805020101`
        : `Thank you ${studentName || ''}. Your query has been forwarded to our counselor. You will be contacted shortly. For urgent support: 01805020101`,
      shouldHandover: true,
      handoverReason: 'explicit_human_request_or_complaint',
      confidence: 0.95,
    };
  }

  if (sentiment === 'angry' || sentiment === 'frustrated') {
    return {
      reply: language === 'bangla'
        ? `দুঃখিত ${studentName || ''}, আপনার অসুবিধার জন্য। আমাদের টিম বিষয়টি গুরুত্ব সহকারে দেখছে। অনুগ্রহ করে আপনার Student ID শেয়ার করুন। জরুরি: 01805020101`
        : `Sorry ${studentName || ''} for the inconvenience. Our team is looking into this urgently. Please share your Student ID. Urgent: 01805020101`,
      shouldHandover: true,
      handoverReason: 'high_risk_sentiment',
      confidence: 0.9,
    };
  }

  // Safe reply templates by intent
  const replies: Record<string, Record<string, string>> = {
    course_inquiry: {
      english: `Hello ${studentName || ''}! For course inquiry, please share: 1) Preferred country 2) Study level 3) Subject 4) Intake 5) Budget. Our counselor will suggest best options. Portal: https://aloeducation.com/student/login`,
      bangla: `হ্যালো ${studentName || ''}! কোর্স সম্পর্কে জানতে শেয়ার করুন: ১) দেশ ২) লেভেল ৩) সাবজেক্ট ৪) ইনটেক ৫) বাজেট। কাউন্সেলর সেরা অপশন সাজেস্ট করবেন।`,
      mixed: `Hello ${studentName || ''}! Course er jonno share korun: country, level, subject, intake, budget. Counselor best option suggest korben. Portal: https://aloeducation.com/student/login`,
    },
    visa: {
      english: `For visa guidance, our visa team will assist you. Please upload: passport, bank statement, academic docs in portal. We provide preparation, not guarantee of approval. Portal: https://aloeducation.com/student/login`,
      bangla: `ভিসা গাইডেন্সের জন্য ভিসা টিম সহায়তা করবে। পোর্টালে আপলোড করুন: পাসপোর্ট, ব্যাংক স্টেটমেন্ট, একাডেমিক ডকুমেন্ট। আমরা প্রস্তুতি দিই, অনুমোদনের গ্যারান্টি দিই না।`,
      mixed: `Visa guidance er jonno visa team help korbe. Portal e upload korun: passport, bank statement, academic docs. Amra preparation dei, approval guarantee na.`,
    },
    payment: {
      english: `For payment related queries, please share your Student ID and reference. Our finance team will check. Never share card PIN, OTP, or banking password here. For urgent: 01805020101`,
      bangla: `পেমেন্ট সংক্রান্ত, Student ID এবং রেফারেন্স শেয়ার করুন। ফাইন্যান্স টিম চেক করবে। কার্ড PIN, OTP, ব্যাংকিং পাসওয়ার্ড শেয়ার করবেন না। জরুরি: 01805020101`,
      mixed: `Payment query er jonno Student ID ar reference share korun. Finance team check korbe. PIN/OTP/password share korben na. Urgent: 01805020101`,
    },
  };

  const langKey = language === 'bangla' ? 'bangla' : language === 'mixed' || language === 'banglish' ? 'mixed' : 'english';
  const intentReply = replies[intent]?.[langKey] || replies[intent]?.['english'];

  if (intentReply) {
    return {
      reply: intentReply,
      shouldHandover: false,
      confidence: 0.8,
    };
  }

  // Default safe reply
  const defaultReplies: Record<string, string> = {
    english: `Hello ${studentName || ''}! I'm ALO AI Assistant. I can help with: study abroad options, courses, universities, IELTS/PTE, visa guidance, scholarships, portal help. How can I assist today? For human counselor, type "counselor".`,
    bangla: `হ্যালো ${studentName || ''}! আমি ALO AI Assistant। সাহায্য করতে পারি: বিদেশে পড়াশোনা, কোর্স, ইউনিভার্সিটি, IELTS/PTE, ভিসা গাইডেন্স, স্কলারশিপ। কিভাবে সাহায্য করতে পারি? কাউন্সেলর লাগলে "counselor" লিখুন।`,
    mixed: `Hello ${studentName || ''}! Ami ALO AI Assistant. Help korte pari: study abroad, course, university, IELTS/PTE, visa guidance, scholarship. Kivabe help korte pari? Counselor lagle "counselor" likhun.`,
  };

  return {
    reply: defaultReplies[langKey] || defaultReplies['english'],
    shouldHandover: false,
    confidence: 0.6,
  };
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
