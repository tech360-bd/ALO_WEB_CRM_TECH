const EDITABLE_FIELDS = {
  service: [
    "slug", "title", "shortDescription", "description", "icon", "heroImage",
    "content", "eligibility", "requirements", "documents", "faqEnabled", "ctaLabel",
    "ctaUrl", "status", "sortOrder", "lastVerifiedAt", "sourceUrl", "verificationStatus",
    "longDescription", "heroTitle", "heroSubtitle", "whatIs", "whyNeeded", "whoIsFor", "whatAloDoes", "processSteps", "requiredInfo", "documentsNeeded", "timeline", "whatStudentsReceive", "whatNotGuaranteed", "commonMistakes", "documentPreparation", "checklist", "financialGuidance", "credibilityPrep", "documentConsistency", "applicationReview", "refusalRiskPrep", "officialDisclaimer", "findingScholarships", "eligibilityReview", "deadlineTracking", "statementSupport", "profileAssessment", "academicMatching", "englishMatching", "budgetMatching", "destinationMatching", "intakeMatching", "careerGoalMatching", "seoTitle", "seoDescription", "canonicalUrl", "ogTitle", "ogDescription", "sourceName",
  ],
  resource: [
    "slug", "categoryId", "title", "excerpt", "content", "authorId", "featuredImage",
    "countrySlug", "studyLevel", "readingTime", "status", "publishedAt", "lastVerifiedAt",
    "sourceUrl", "sourceName", "verificationStatus", "seoTitle", "seoDescription", "tags",
    "summary", "keyTakeaways", "detailedExplanation", "whoAppliesTo", "requirements", "processSteps", "documents", "timeline", "fees", "deadlines", "commonMistakes", "aloGuidance", "officialSources", "canonicalUrl", "ogTitle", "ogDescription", "imageUrl", "sortOrder",
  ],
  scholarship: [
    "slug", "scholarshipCode", "name", "countrySlug", "universitySlug", "courseSlug",
    "studyLevel", "subject", "fundingType", "amount", "currency", "coverage", "eligibility",
    "minimumRequirements", "documentsRequired", "applicationMethod", "applicationUrl",
    "openingDate", "deadline", "decisionDate", "status", "verificationStatus", "sourceUrl",
    "sourceName", "lastVerifiedAt",
    "country", "university", "fundingAmount", "fundingAmountNumber", "fundingCurrency", "deadlineDate", "closingDate", "overview", "whoCanApply", "academicRequirements", "englishRequirements", "nationalityRequirements", "courseEligibility", "universityEligibility", "whatCovers", "whatNotCovers", "requiredDocuments", "howToApply", "applicationSteps", "selectionProcess", "resultTimeline", "renewalConditions", "commonMistakes", "howAloHelps", "officialSourceUrl", "officialSourceName", "seoTitle", "seoDescription", "canonicalUrl", "isFeatured", "sortOrder", "scholarshipType", "intake",
  ],
  resourceCategory: ["slug", "name", "description", "icon", "sortOrder", "status"],
} as const;

export type EditableContentKind = keyof typeof EDITABLE_FIELDS;

export const CONTENT_RELATIONSHIP_TYPES = [
  "SERVICE",
  "SCHOLARSHIP",
  "RESOURCE",
  "COURSE",
  "UNIVERSITY",
  "COUNTRY",
] as const;

export function normalizeContentRelationshipType(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return (CONTENT_RELATIONSHIP_TYPES as readonly string[]).includes(normalized)
    ? normalized
    : null;
}

/**
 * Prevent mass assignment in admin content PATCH handlers. Relations,
 * identifiers, and timestamps are intentionally not accepted here.
 */
export function pickEditableContentFields(
  value: unknown,
  kind: EditableContentKind,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  const jsonFields = new Set(["content", "tags", "processSteps", "requiredInfo", "documentsNeeded", "whatStudentsReceive", "commonMistakes", "checklist", "keyTakeaways", "documents", "officialSources", "documentsRequired", "requiredDocuments", "applicationSteps"]);
  for (const field of EDITABLE_FIELDS[kind]) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) continue;
    let item = input[field];
    if (jsonFields.has(field) && item !== null && typeof item === "object") item = JSON.stringify(item);
    // Text columns cannot receive array/object values or null. Nullable dates and
    // scholarship references retain null to support clearing those values.
    const nullable = ["lastVerifiedAt", "publishedAt", "openingDate", "deadlineDate", "closingDate", "categoryId", "countrySlug", "universitySlug", "courseSlug", "studyLevel", "subject", "applicationMethod", "applicationUrl", "decisionDate", "sourceUrl", "sourceName"];
    if (item === null && !(nullable.includes(field) && (kind === "scholarship" || ["lastVerifiedAt", "publishedAt", "categoryId"].includes(field)))) item = "";
    if (item !== null && typeof item === "object") continue;
    if ((field.endsWith("Url") || field === "ctaUrl") && typeof item === "string" && item) {
      // Only site-relative paths and web URLs are usable public content links.
      if (!item.startsWith("/") || item.startsWith("//")) {
        try { if (!["https:", "http:"].includes(new URL(item).protocol)) continue; } catch { continue; }
      }
    }
    result[field] = item;
  }
  return result;
}
