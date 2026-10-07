// ============================================================================
// ALO Post-Offer Requirement System (spec: POST-OFFER REQUIREMENT SYSTEM).
// After offer approval, the system analyzes university conditions and creates
// categorized requirements:
//   MANDATORY    — must complete before visa/payment stage
//   RECOMMENDED  — improves admission/visa/student profile strength
//   OPTIONAL     — not required, cannot block progress
// ALO records where each requirement came from, without claiming official
// publisher status. Public functions are pure; persistence stays in routes.
// ============================================================================

export const POST_OFFER_REQUIREMENT_TIERS = ["MANDATORY", "RECOMMENDED", "OPTIONAL"] as const;
export type PostOfferRequirementTier = (typeof POST_OFFER_REQUIREMENT_TIERS)[number];

export interface PostOfferRequirement {
  key: string;
  tier: PostOfferRequirementTier;
  title: string;
  blocks: "payment" | "visa" | "none";
  reason: string;
  sourceOrigin: "ALO_STANDARD" | "UNIVERSITY_CONDITION" | "COUNTRY_RULE";
}

interface ConditionRule {
  pattern: RegExp;
  requirement: (matched: string) => PostOfferRequirement;
}

/**
 * Condition-keyword → requirement mapping. ALO-records provenance:
 * sourceOrigin marks whether the rule is an ALO standard or derived from the
 * university's own condition text.
 */
const CONDITION_RULES: ConditionRule[] = [
  {
    pattern: /english|ielts|toefl|pte|duolingo|language/i,
    requirement: () => ({
      key: "english_condition", tier: "MANDATORY", title: "Meet English language condition",
      blocks: "visa", reason: "University requires an English-language condition to be met before progression.",
      sourceOrigin: "UNIVERSITY_CONDITION",
    }),
  },
  {
    pattern: /deposit|pre.?payment|advance payment/i,
    requirement: () => ({
      key: "deposit_payment", tier: "MANDATORY", title: "Pay university deposit",
      blocks: "payment", reason: "University requires a deposit before confirmation; payment must follow the verified-instruction flow.",
      sourceOrigin: "UNIVERSITY_CONDITION",
    }),
  },
  {
    pattern: /final (transcript|certificate|result)/i,
    requirement: () => ({
      key: "final_academics", tier: "MANDATORY", title: "Submit final academic documents",
      blocks: "visa", reason: "University requires final transcripts/certificates before unconditional confirmation.",
      sourceOrigin: "UNIVERSITY_CONDITION",
    }),
  },
  {
    pattern: /interview|credibility/i,
    requirement: () => ({
      key: "credibility_interview", tier: "MANDATORY", title: "Complete credibility/interview stage",
      blocks: "visa", reason: "A credibility or university interview is conditional to the offer.",
      sourceOrigin: "UNIVERSITY_CONDITION",
    }),
  },
  {
    pattern: /medical|health|tuberculosis|tb test/i,
    requirement: () => ({
      key: "medical", tier: "MANDATORY", title: "Complete required medical/tests",
      blocks: "visa", reason: "Country/university rules require medical clearance for the visa stage.",
      sourceOrigin: "COUNTRY_RULE",
    }),
  },
];

/** Baseline requirements ALO prepares for every approved offer. */
const BASELINE_REQUIREMENTS: PostOfferRequirement[] = [
  { key: "visa_file_prep", tier: "RECOMMENDED", title: "Prepare visa file early", blocks: "none", reason: "Early visa-file preparation reduces risk of deadline pressure at peak seasons.", sourceOrigin: "ALO_STANDARD" },
  { key: "bank_statement", tier: "RECOMMENDED", title: "Arrange sponsor bank evidence", blocks: "visa", reason: "Financial evidence is typically required at visa stage; preparing early de-risks the file.", sourceOrigin: "ALO_STANDARD" },
  { key: "statement_of_purpose", tier: "RECOMMENDED", title: "Strengthen statement of purpose", blocks: "none", reason: "A stronger SOP improves admission and interview outcomes.", sourceOrigin: "ALO_STANDARD" },
  { key: "reference_letters", tier: "OPTIONAL", title: "Collect additional reference letters", blocks: "none", reason: "Optional supporting profile evidence.", sourceOrigin: "ALO_STANDARD" },
  { key: "alumni_contacts", tier: "OPTIONAL", title: "Connect with alumni (if applicable)", blocks: "none", reason: "Optional networking support for the destination.", sourceOrigin: "ALO_STANDARD" },
  { key: "scholarship_updates", tier: "OPTIONAL", title: "Track scholarship updates", blocks: "none", reason: "Optional — scholarships may open post-offer.", sourceOrigin: "ALO_STANDARD" },
];

/** Spec example (buried in the spec text): bank statement, sponsor documents, final transcripts/certificates/offer verification are MANDATORY for every file. */
const ALWAYS_MANDATORY: PostOfferRequirement[] = [
  { key: "sponsor_documents", tier: "MANDATORY", title: "Sponsor documents verified", blocks: "visa", reason: "Sponsor identity/financial evidence must be verified before the visa stage.", sourceOrigin: "ALO_STANDARD" },
  { key: "offer_verification", tier: "MANDATORY", title: "Offer letter verification (PAU/chairman-flag flow)", blocks: "payment", reason: "Visa file cannot start until the offer is VERIFIED by an authorized approver.", sourceOrigin: "ALO_STANDARD" },
];

/**
 * Analyze offer conditions and produce the categorized requirement set.
 * Deduplicates by key; MANDATORY wins if a key appears in multiple tiers.
 */
export function analyzePostOfferRequirements(conditions: string | string[] | null | undefined): PostOfferRequirement[] {
  const text = Array.isArray(conditions) ? conditions.join(" ") : String(conditions || "");
  const out: PostOfferRequirement[] = [...ALWAYS_MANDATORY];
  for (const rule of CONDITION_RULES) {
    const m = text.match(rule.pattern);
    if (m) out.push(rule.requirement(m[0]));
  }
  out.push(...BASELINE_REQUIREMENTS);
  const rank: Record<PostOfferRequirementTier, number> = { MANDATORY: 0, RECOMMENDED: 1, OPTIONAL: 2 };
  const seen = new Map<string, PostOfferRequirement>();
  for (const r of out) {
    const ex = seen.get(r.key);
    if (!ex || rank[r.tier] < rank[ex.tier]) seen.set(r.key, r);
  }
  return [...seen.values()].sort((a, b) => rank[a.tier] - rank[b.tier] || a.title.localeCompare(b.title));
}

/**
 * Gate check: can the file proceed to `stage` given completed requirement keys?
 * OPTIONAL requirements never block.
 */
export function checkPostOfferGate(requirements: PostOfferRequirement[], completedKeys: string[], stage: "payment" | "visa"):
  { allowed: boolean; blockedBy: string[] } {
  const blockedBy = requirements
    .filter((r) => r.tier === "MANDATORY" && (r.blocks === stage || r.blocks === "none" ? r.blocks === stage : false))
    .filter((r) => !completedKeys.includes(r.key))
    .map((r) => r.key);
  return { allowed: blockedBy.length === 0, blockedBy };
}
