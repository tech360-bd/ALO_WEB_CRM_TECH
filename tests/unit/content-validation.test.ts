import { describe, expect, it } from "vitest";
import {
  normalizeContentRelationshipType,
  pickEditableContentFields,
} from "@/lib/content-validation";

describe("content PATCH field allowlists", () => {
  it("keeps service fields but rejects relations, ids, and timestamps", () => {
    expect(
      pickEditableContentFields(
        {
          title: "Updated service",
          status: "DRAFT",
          faqs: [{ question: "should not be written" }],
          id: "attacker-controlled-id",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        "service",
      ),
    ).toEqual({ title: "Updated service", status: "DRAFT" });
  });

  it("allows only resource fields for a resource patch", () => {
    expect(
      pickEditableContentFields(
        {
          categoryId: "category-1",
          tags: ["visa", "study"],
          role: "SUPER_ADMIN",
          relationships: [],
        },
        "resource",
      ),
    ).toEqual({ categoryId: "category-1", tags: JSON.stringify(["visa", "study"]) });
  });

  it("normalizes JSON sections and rejects executable link protocols", () => {
    expect(pickEditableContentFields({ processSteps: ["Apply"], ctaUrl: "javascript:alert(1)", sourceUrl: "https://example.org", heroImage: null }, "service")).toEqual({ processSteps: '["Apply"]', sourceUrl: "https://example.org", heroImage: "" });
  });

  it("returns an empty patch for non-object JSON", () => {
    expect(pickEditableContentFields(null, "scholarship")).toEqual({});
    expect(pickEditableContentFields(["status", "CLOSED"], "resourceCategory")).toEqual({});
  });

  it("normalizes only supported relationship types", () => {
    expect(normalizeContentRelationshipType(" service ")).toBe("SERVICE");
    expect(normalizeContentRelationshipType("COUNTRY")).toBe("COUNTRY");
    expect(normalizeContentRelationshipType("users")).toBeNull();
    expect(normalizeContentRelationshipType(42)).toBeNull();
  });
});
