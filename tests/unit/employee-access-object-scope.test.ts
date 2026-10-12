// ALO Employee Access System — object-scope kernel + contact identity
import { describe, it, expect } from "vitest";
import {
  evaluateObjectScope,
  deriveCountryCode,
  channelFeatureKey,
  isCommunicationChannel,
  COMMUNICATION_CHANNELS,
  MASTER_ROLES,
} from "@/lib/access-control/object-scope";

describe("evaluateObjectScope (record-level authorization kernel)", () => {
  it("master roles get GLOBAL access", () => {
    for (const role of [...MASTER_ROLES]) {
      expect(evaluateObjectScope({ roles: [role] }).allowed).toBe(true);
    }
  });

  it("role matching is case-insensitive", () => {
    expect(evaluateObjectScope({ roles: ["super_admin"] }).allowed).toBe(true);
    expect(evaluateObjectScope({ roles: ["Super_Admin"] }).allowed).toBe(true);
  });

  it("ASSIGNED-scope records open only for the assignee", () => {
    expect(evaluateObjectScope({ roles: ["COUNSELOR"], isAssigned: true }).allowed).toBe(true);
    const denied = evaluateObjectScope({ roles: ["COUNSELOR"], isAssigned: false, isOwner: false });
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toContain("least privilege");
  });

  it("OWN scope records open for the owner", () => {
    expect(evaluateObjectScope({ roles: ["EMPLOYEE"], isOwner: true }).allowed).toBe(true);
  });

  it("BRANCH_MANAGER opens own-branch records only", () => {
    expect(evaluateObjectScope({ roles: ["BRANCH_MANAGER"], sameBranch: true }).allowed).toBe(true);
    expect(evaluateObjectScope({ roles: ["BRANCH_MANAGER"], sameBranch: false }).allowed).toBe(false);
  });

  it("an explicit FeatureAccessRule grants access", () => {
    expect(evaluateObjectScope({ roles: ["MARKETING"], hasExplicitRule: true }).allowed).toBe(true);
  });
});

describe("communication channel validation + feature keys", () => {
  it("accepts all spec channels", () => {
    expect(COMMUNICATION_CHANNELS).toContain("whatsapp");
    for (const ch of ["whatsapp", "email", "phone", "sms", "facebook", "instagram", "linkedin", "x", "youtube", "tiktok"]) {
      expect(isCommunicationChannel(ch)).toBe(true);
    }
    expect(isCommunicationChannel("smoke-signals")).toBe(false);
  });

  it("maps phone calls to the phone_call feature key", () => {
    expect(channelFeatureKey("phone")).toBe("communication.phone_call");
    expect(channelFeatureKey("whatsapp")).toBe("communication.whatsapp");
    expect(channelFeatureKey("EMAIL")).toBe("communication.email");
  });
});

describe("deriveCountryCode (external contact identity)", () => {
  it("recognizes the BD/UK/IN codes used by ALO operations", () => {
    expect(deriveCountryCode("8801712345678")).toBe("880");
    expect(deriveCountryCode("447911123456")).toBe("44");
    expect(deriveCountryCode("919876543210")).toBe("91");
    expect(deriveCountryCode("971501234567")).toBe("971");
  });
  it("strips non-digits and returns empty for unknown shapes", () => {
    expect(deriveCountryCode("+880 171-234-5678")).toBe("880");
    expect(deriveCountryCode("")).toBe("");
  });
});
