const EDITABLE_FIELDS = {
  service: [
    "slug", "title", "shortDescription", "description", "icon", "heroImage",
    "content", "eligibility", "requirements", "documents", "faqEnabled", "ctaLabel",
    "ctaUrl", "status", "sortOrder", "lastVerifiedAt", "sourceUrl", "verificationStatus",
  ],
  resource: [
    "slug", "categoryId", "title", "excerpt", "content", "authorId", "featuredImage",
    "countrySlug", "studyLevel", "readingTime", "status", "publishedAt", "lastVerifiedAt",
    "sourceUrl", "sourceName", "verificationStatus", "seoTitle", "seoDescription", "tags",
  ],
  scholarship: [
    "slug", "scholarshipCode", "name", "countrySlug", "universitySlug", "courseSlug",
    "studyLevel", "subject", "fundingType", "amount", "currency", "coverage", "eligibility",
    "minimumRequirements", "documentsRequired", "applicationMethod", "applicationUrl",
    "openingDate", "deadline", "decisionDate", "status", "verificationStatus", "sourceUrl",
    "sourceName", "lastVerifiedAt",
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
  return Object.fromEntries(
    EDITABLE_FIELDS[kind]
      .filter((field) => Object.prototype.hasOwnProperty.call(input, field))
      .map((field) => [field, input[field]]),
  );
}
