import { describe, expect, it } from "vitest";
import {
  assertConversationAccess,
  buildFormPrefill,
  buildReplySuggestions,
  canAccessConversation,
  summarizeConversation,
  type UccConversationView,
  type UccMessageView,
} from "@/lib/ucc/ai-assistant-core";

const conversation: UccConversationView = {
  id: "conv-1",
  channel: "whatsapp",
  participantName: "Ayesha Rahman",
  participantPhone: "+8801700000001",
  participantEmail: "ayesha@example.com",
  studentId: "stu-123",
  leadId: null,
  assignedToUserId: "emp-42",
  destinationCountry: "United Kingdom",
  status: "open",
  priority: "high",
  lastMessageText: "Do I need a bank statement?",
  lastMessageAt: new Date("2026-10-01T10:00:00Z"),
  unreadCount: 2,
};

const messages: UccMessageView[] = [
  {
    id: "m1",
    direction: "inbound",
    senderName: "Ayesha",
    messageType: "text",
    content: "Sir, university asked for bank statement. What should I send?",
    status: "read",
    createdAt: new Date("2026-10-01T09:00:00Z"),
  },
  {
    id: "m2",
    direction: "outbound",
    senderName: "Counselor",
    messageType: "text",
    content: "Please upload the latest 6 months bank statement.",
    status: "delivered",
    createdAt: new Date("2026-10-01T09:30:00Z"),
  },
  {
    id: "m3",
    direction: "inbound",
    senderName: "Ayesha",
    messageType: "text",
    content: "Do I need a bank statement?",
    status: "read",
    createdAt: new Date("2026-10-01T10:00:00Z"),
  },
  {
    id: "m4",
    direction: "inbound",
    senderName: "Ayesha",
    messageType: "document",
    content: "passport.pdf",
    status: "delivered",
    createdAt: new Date("2026-10-01T10:05:00Z"),
  },
];

describe("§166 — AI context protection (permission before retrieval)", () => {
  it("denies unassigned staff", () => {
    expect(canAccessConversation({ userId: "emp-99", role: "COUNSELOR" }, conversation)).toBe(false);
    expect(() =>
      assertConversationAccess({ userId: "emp-99", role: "COUNSELOR" }, conversation),
    ).toThrowError(/Forbidden/);
  });

  it("allows the assigned employee by userId or employeeId", () => {
    expect(canAccessConversation({ userId: "emp-42" }, conversation)).toBe(true);
    expect(canAccessConversation({ employeeId: "emp-42" }, conversation)).toBe(true);
  });

  it("allows supervisor roles regardless of assignment", () => {
    for (const role of ["SUPER_ADMIN", "admin", "branch_manager"]) {
      expect(canAccessConversation({ userId: "emp-99", role }, conversation)).toBe(true);
    }
  });

  it("throws 404-style error for missing conversation", () => {
    try {
      assertConversationAccess({ userId: "emp-42" }, null);
      expect.unreachable();
    } catch (e: any) {
      expect(e.statusCode).toBe(404);
    }
  });

  it("never grants access to unassigned conversations for non-supervisors", () => {
    const unassigned = { ...conversation, assignedToUserId: null };
    expect(canAccessConversation({ userId: "emp-42", role: "COUNSELOR" }, unassigned)).toBe(false);
  });
});

describe("§165 — conversation summary is derived only from data", () => {
  it("summarizes counts, linkage, last inbound and open issue", () => {
    const s = summarizeConversation(conversation, messages);
    expect(s.summary).toContain("Ayesha Rahman");
    expect(s.summary).toContain("whatsapp");
    expect(s.openIssues).toContain("Do I need a bank statement?");
    expect(s.attachmentCount).toBe(1); // passport.pdf
    expect(s.awaitingResponse).toBe(true);
    expect(s.linked.studentId).toBe("stu-123");
    expect(s.basisNote).toMatch(/no invented content/i);
  });

  it("does not include the already-answered question as an open issue", () => {
    const s = summarizeConversation(conversation, messages);
    // m1 was answered by outbound m2 → not open; m3 unanswered → open.
    expect(s.openIssues).not.toContain("Sir, university asked for bank statement. What should I send?");
  });

  it("handles an empty conversation without fabricating content", () => {
    const s = summarizeConversation(conversation, []);
    expect(s.summary).toContain("0 message(s)");
    expect(s.openIssues).toEqual([]);
    expect(s.lastInboundMessage).toBeUndefined();
    expect(s.awaitingResponse).toBe(false);
  });

  it("marks unlinked conversations without inventing identity", () => {
    const s = summarizeConversation({ ...conversation, studentId: null }, messages);
    expect(s.summary).toContain("No student/lead matched");
  });

  it("never mentions institutions, prices or claims absent from the data", () => {
    const s = summarizeConversation(conversation, messages);
    expect(s.summary + s.nextAction + s.basisNote).not.toMatch(/university of|£|\$|guarantee|visa approved/i);
  });
});

describe("reply suggestions — approved-template drafts only (§130/§175)", () => {
  const templates = [
    { templateCode: "TPL-WA-DOC", templateName: "Doc request (WA)", channel: "whatsapp", body: "Dear {{name}}, please upload your documents for {{country}}." },
    { templateCode: "TPL-MAIL-1", templateName: "Email", channel: "email", body: "Email body" },
  ];

  it("fills only channel-compatible approved templates with conversation facts", () => {
    const out = buildReplySuggestions(templates, conversation);
    expect(out).toEqual([
      "Dear Ayesha Rahman, please upload your documents for United Kingdom.",
    ]);
  });

  it("returns zero suggestions instead of inventing content when no template fits", () => {
    expect(buildReplySuggestions([], conversation)).toEqual([]);
  });

  it("never injects counselor identities that do not exist in data", () => {
    const tpl = [{ templateCode: "X", templateName: "x", channel: "whatsapp", body: "From {{counselor}} to {{name}}" }];
    const out = buildReplySuggestions(tpl, conversation);
    expect(out[0]).not.toMatch(/From\s+\w+.*\w\s+to/);
    expect(out[0]).toContain("Ayesha Rahman");
  });
});

describe("form prefill — real fields only", () => {
  it("fills data-backed fields and leaves the rest empty", () => {
    const p = buildFormPrefill(conversation);
    expect(p).toEqual({
      studentName: "Ayesha Rahman",
      email: "ayesha@example.com",
      phone: "+8801700000001",
      destinationCountry: "United Kingdom",
      studentId: "stu-123",
      leadId: "",
      targetIntake: "",
      preferredCourse: "",
      fundingSponsor: "",
      englishScore: "",
    });
  });

  it("missing optional fields stay empty — no placeholder person", () => {
    const p = buildFormPrefill({ ...conversation, participantEmail: null, participantPhone: null });
    expect(p.email).toBe("");
    expect(p.phone).toBe("");
    expect(Object.values(p).join("|")).not.toMatch(/Rafiqul|example\.org|\+880170000000\d{2,}/);
  });
});
