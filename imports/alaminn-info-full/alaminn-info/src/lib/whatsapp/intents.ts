/**
 * WhatsApp AI — Intent Detection
 * ===============================
 * Classifies user messages into one of 14 supported intents.
 * Uses keyword/regex matching first (fast, deterministic), then
 * falls back to LLM-based classification for ambiguous inputs.
 *
 * Supported intents:
 *   STUDY_DESTINATION    — "Which country is best for..."
 *   UNIVERSITY_SEARCH    — "Find universities in UK"
 *   COURSE_SEARCH        — "MSc Computer Science courses"
 *   SCHOLARSHIP_SEARCH   — "What scholarships are available?"
 *   PHD_SEARCH           — "Find PhD opportunities"
 *   SUPERVISOR_SEARCH    — "Looking for a supervisor"
 *   ELIGIBILITY          — "Can I apply with my background?"
 *   APPLICATION          — "How do I apply?"
 *   DOCUMENTS            — "What documents do I need?"
 *   CONSULTATION         — "Book a consultation"
 *   CONTACT              — "I want to talk to someone"
 *   ALO_EDUCATION_HANDOFF — "Connect me with ALO Education"
 *   HUMAN_AGENT          — "I want to talk to a human"
 *   OTHER                — fallback
 */

export type WhatsappIntent =
  | "STUDY_DESTINATION"
  | "UNIVERSITY_SEARCH"
  | "COURSE_SEARCH"
  | "SCHOLARSHIP_SEARCH"
  | "PHD_SEARCH"
  | "SUPERVISOR_SEARCH"
  | "ELIGIBILITY"
  | "APPLICATION"
  | "DOCUMENTS"
  | "CONSULTATION"
  | "CONTACT"
  | "ALO_EDUCATION_HANDOFF"
  | "HUMAN_AGENT"
  | "OTHER";

export const ALL_INTENTS: WhatsappIntent[] = [
  "STUDY_DESTINATION",
  "UNIVERSITY_SEARCH",
  "COURSE_SEARCH",
  "SCHOLARSHIP_SEARCH",
  "PHD_SEARCH",
  "SUPERVISOR_SEARCH",
  "ELIGIBILITY",
  "APPLICATION",
  "DOCUMENTS",
  "CONSULTATION",
  "CONTACT",
  "ALO_EDUCATION_HANDOFF",
  "HUMAN_AGENT",
  "OTHER",
];

export const INTENT_LABELS: Record<WhatsappIntent, string> = {
  STUDY_DESTINATION: "Study Destination",
  UNIVERSITY_SEARCH: "University Search",
  COURSE_SEARCH: "Course Search",
  SCHOLARSHIP_SEARCH: "Scholarship Search",
  PHD_SEARCH: "PhD Search",
  SUPERVISOR_SEARCH: "Supervisor Search",
  ELIGIBILITY: "Eligibility Check",
  APPLICATION: "Application Guidance",
  DOCUMENTS: "Document Guidance",
  CONSULTATION: "Consultation Request",
  CONTACT: "Contact Request",
  ALO_EDUCATION_HANDOFF: "ALO Education Handoff",
  HUMAN_AGENT: "Human Agent",
  OTHER: "Other",
};

type IntentRule = {
  intent: WhatsappIntent;
  patterns: RegExp[];
};

// Order matters — more specific intents first.
const RULES: IntentRule[] = [
  {
    intent: "HUMAN_AGENT",
    patterns: [
      /\b(human|person|counsel(?:or|ler)|agent|real\s+person|talk\s+to\s+(?:a\s+)?(?:human|person)|someone\s+(?:call|contact)\s+me|human\s+support|live\s+agent)\b/i,
    ],
  },
  {
    intent: "ALO_EDUCATION_HANDOFF",
    patterns: [
      /\balo\s+education\b/i,
      /\bconnect\s+me\s+(?:with|to)\s+(?:a\s+)?counselor\b/i,
      /\bcounselor\s+(?:help|advice|support)\b/i,
    ],
  },
  {
    intent: "CONSULTATION",
    patterns: [
      /\b(consultation|book\s+(?:a\s+)?(?:consultation|call|meeting)|schedule\s+(?:a\s+)?(?:call|meeting))\b/i,
    ],
  },
  {
    intent: "CONTACT",
    patterns: [
      /\b(contact|reach|get\s+in\s+touch|email|phone\s+number)\b/i,
    ],
  },
  {
    intent: "PHD_SEARCH",
    patterns: [
      /\b(phd|ph\.d|doctorate|doctoral)\b/i,
    ],
  },
  {
    intent: "SUPERVISOR_SEARCH",
    patterns: [
      /\b(supervisor|advisor|mentor|professor)\b/i,
    ],
  },
  {
    intent: "SCHOLARSHIP_SEARCH",
    patterns: [
      /\b(scholarships?|funding|financial\s+aid|grants?|stipends?|fee\s+waivers?|full\s+ride)\b/i,
    ],
  },
  {
    intent: "DOCUMENTS",
    patterns: [
      /\b(document|paperwork|passport|transcript|degree\s+certificate|recommendation\s+letter|sop|statement\s+of\s+purpose|cv|resume|motivation\s+letter)\b/i,
    ],
  },
  {
    intent: "ELIGIBILITY",
    patterns: [
      /\b(eligib(?:le|ility)|can\s+i\s+apply|qualif|requirements?\s+for\s+me|my\s+profile|my\s+background|my\s+gpa|ielts\s+score\s+(?:need|require)|enough\s+(?:ielts|gpa|score))\b/i,
    ],
  },
  {
    intent: "APPLICATION",
    patterns: [
      /\b(how\s+(?:do|to)\s+i\s+apply|application\s+(?:process|deadline|fee|form)|apply\s+to|submit\s+application)\b/i,
    ],
  },
  {
    intent: "UNIVERSITY_SEARCH",
    patterns: [
      /\b(universit(?:y|ies)|colleges?|institutes?|institutions?)\b/i,
    ],
  },
  {
    intent: "COURSE_SEARCH",
    patterns: [
      /\b(courses?|programs?|programmes?|msc|bsc|mba|bachelors?|masters?|undergraduates?|postgraduates?|degrees?)\b/i,
    ],
  },
  {
    intent: "STUDY_DESTINATION",
    patterns: [
      /\b(countries?|destinations?|where\s+(?:to\s+)?study|best\s+(?:country|place)\s+for\s+study|which\s+country)\b/i,
      /\b(uk|usa|canada|australia|germany|netherlands|ireland|new\s+zealand|sweden|switzerland|france|finland|denmark|norway|italy|spain|belgium|austria|poland|hungary|czech|portugal|malaysia|singapore|japan|korea|china|uae|cyprus|malta)\b/i,
    ],
  },
];

/**
 * Classify a user message into an intent using keyword/regex rules.
 * Returns null if no rule matches (caller should fall back to LLM).
 */
export function classifyIntentKeyword(message: string): WhatsappIntent | null {
  const text = message.trim();
  if (!text) return null;
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) return rule.intent;
    }
  }
  return null;
}

/**
 * Classify a user message into an intent. Uses keyword rules first
 * (fast + deterministic), then optionally LLM for ambiguous inputs.
 *
 * The LLM fallback is implemented in agent.ts because it needs the
 * z-ai-web-dev-sdk which is async. This function is pure sync.
 */
export function classifyIntent(message: string): {
  intent: WhatsappIntent;
  method: "keyword" | "fallback";
  confidence: number;
} {
  const hit = classifyIntentKeyword(message);
  if (hit) {
    return { intent: hit, method: "keyword", confidence: 0.85 };
  }
  return { intent: "OTHER", method: "fallback", confidence: 0.3 };
}

/**
 * Detect if the user is requesting a human handoff.
 * Used to short-circuit AI processing and route directly to a human.
 */
export function isHumanHandoffRequest(message: string): boolean {
  return classifyIntentKeyword(message) === "HUMAN_AGENT";
}
