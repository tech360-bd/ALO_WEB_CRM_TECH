import { detectUniversityDuplicate, detectCourseDuplicate } from "./duplicate-detector";

// Phase 4: AI Processing and Lead Validation
// Extract structured data, normalize, validate, confidence scoring, manual review

export interface StructuredLead {
  fullName: string;
  email?: string;
  phone: string;
  altPhone?: string;
  source: string;
  sourceUrl?: string;
  retrievedAt: string;
  preferredCountry?: string;
  preferredCourse?: string;
  confidence: number; // 0-100
  verified: boolean;
  requiresReview: boolean;
  reviewReason?: string;
  duplicateOfId?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s\-()]{7,20}$/;

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^0-9+]/g, "");
  // Bangladesh +880, UK +44 etc — keep as is, just clean
  return digits;
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export interface ValidationResult {
  valid: boolean;
  lead: StructuredLead;
  errors: string[];
  warnings: string[];
}

export function validateLead(input: {
  fullName: string;
  email?: string;
  phone: string;
  source: string;
  sourceUrl?: string;
  preferredCountry?: string;
  preferredCourse?: string;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const fullName = normalizeName(input.fullName || "");
  const email = input.email ? normalizeEmail(input.email) : undefined;
  const phone = normalizePhone(input.phone || "");
  const sourceUrl = input.sourceUrl?.trim();
  const retrievedAt = new Date().toISOString();

  if (!fullName || fullName.length < 2) errors.push("fullName required (≥2 chars)");
  if (!phone || !PHONE_RE.test(phone)) errors.push("phone required (valid international format)");
  if (email && !EMAIL_RE.test(email)) errors.push("email invalid format");
  if (!input.source) errors.push("source required");

  // Confidence scoring
  let confidence = 100;
  if (!email) { confidence -= 15; warnings.push("email missing — confidence -15"); }
  if (!input.preferredCountry) { confidence -= 10; warnings.push("preferredCountry missing"); }
  if (!input.preferredCourse) { confidence -= 10; warnings.push("preferredCourse missing"); }
  if (fullName.split(" ").length < 2) { confidence -= 20; warnings.push("single name only"); }
  if (phone.length < 10) { confidence -= 20; warnings.push("phone too short"); }

  // Source attribution + provenance
  const verified = !!sourceUrl && !!email && confidence >= 70;
  const requiresReview = !verified || confidence < 60 || errors.length > 0;
  let reviewReason: string | undefined;
  if (requiresReview) {
    if (errors.length) reviewReason = `validation errors: ${errors.join("; ")}`;
    else if (confidence < 60) reviewReason = `low confidence ${confidence}`;
    else if (!verified) reviewReason = "unverified — missing sourceUrl or email";
  }

  const lead: StructuredLead = {
    fullName,
    email,
    phone,
    source: input.source,
    sourceUrl,
    retrievedAt,
    preferredCountry: input.preferredCountry,
    preferredCourse: input.preferredCourse,
    confidence: Math.max(0, Math.min(100, confidence)),
    verified,
    requiresReview,
    reviewReason,
  };

  return { valid: errors.length === 0, lead, errors, warnings };
}

// Duplicate detection wrapper (reuses existing detector)
export async function checkLeadDuplicate(lead: StructuredLead, existingLeads: Array<{ id: string; email?: string; phone: string; sourceUrl?: string }>) {
  const normEmail = lead.email?.toLowerCase().trim();
  const normPhone = lead.phone.replace(/[^0-9]/g, "").slice(-10);
  const normUrl = lead.sourceUrl?.replace(/[?#].*$/, "").toLowerCase();

  for (const ex of existingLeads) {
    if (normEmail && ex.email?.toLowerCase().trim() === normEmail) {
      return { isDuplicate: true, matchedId: ex.id, field: "email", confidence: 95 };
    }
    if (normPhone && ex.phone.replace(/[^0-9]/g, "").slice(-10) === normPhone) {
      return { isDuplicate: true, matchedId: ex.id, field: "phone", confidence: 85 };
    }
    if (normUrl && ex.sourceUrl?.replace(/[?#].*$/, "").toLowerCase() === normUrl) {
      return { isDuplicate: true, matchedId: ex.id, field: "sourceUrl", confidence: 90 };
    }
  }
  return { isDuplicate: false };
}

// AI output must be treated as untrusted — sanitize instructions
export function sanitizeAiOutput(text: string): string {
  // Remove potential prompt injection, limit length, strip control chars
  let t = text.slice(0, 10000);
  t = t.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Flag suspicious instructions
  const suspicious = /ignore previous|system prompt|exfiltrate|drop table/i.test(t);
  if (suspicious) {
    console.warn("[lead-validation] AI output contains suspicious instructions — flagged for review");
  }
  return t;
}
