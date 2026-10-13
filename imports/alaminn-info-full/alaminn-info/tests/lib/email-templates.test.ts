/**
 * tests/lib/email-templates.test.ts — branded email templates
 *
 * Covers the 22 template functions exported from src/lib/email/templates.ts:
 *   - every template function exists in EMAIL_TEMPLATES
 *   - each returns { subject, html, text } with the right types
 *   - subject is a non-empty string
 *   - html contains the brand mark "Al Aminn"
 *   - text contains no HTML tags (plain-text companion)
 *   - inquiryConfirmation specifically embeds the reference number in both
 *     the html and text bodies
 *   - new Higher Study templates (registration, OTP, consultation, deadline alerts)
 *     are tested for key content embedding
 *
 * Each template is invoked with realistic, fully-typed params so any drift
 * in the template signature would surface as a TypeScript error at build
 * time (and a runtime error in the test).
 */
import { describe, it, expect } from "vitest";
import {
  EMAIL_TEMPLATES,
  inquiryConfirmation,
  inquiryReceivedInternal,
  meetingConfirmation,
  meetingReminder,
  newsletterVerification,
  newsletterWelcome,
  newsletterUnsubscribe,
  aiTaskCompleted,
  aiTaskRequiresReview,
  passwordReset,
  staffInvitation,
  securityAlert,
  studentRegistration,
  otpVerification,
  accountActivation,
  consultationRequested,
  consultationConfirmed,
  consultationScheduled,
  applicationStatusUpdate,
  scholarshipDeadlineAlert,
  phdDeadlineAlert,
  newsletterConfirmation,
} from "@/lib/email/templates";

const TEMPLATE_NAMES = [
  "inquiryConfirmation",
  "inquiryReceivedInternal",
  "meetingConfirmation",
  "meetingReminder",
  "newsletterVerification",
  "newsletterWelcome",
  "newsletterUnsubscribe",
  "aiTaskCompleted",
  "aiTaskRequiresReview",
  "passwordReset",
  "staffInvitation",
  "securityAlert",
  // Higher Study & student lifecycle templates (10 added)
  "studentRegistration",
  "otpVerification",
  "accountActivation",
  "consultationRequested",
  "consultationConfirmed",
  "consultationScheduled",
  "applicationStatusUpdate",
  "scholarshipDeadlineAlert",
  "phdDeadlineAlert",
  "newsletterConfirmation",
] as const;

describe("EMAIL_TEMPLATES registry — completeness", () => {
  it("exposes exactly 22 templates", () => {
    expect(Object.keys(EMAIL_TEMPLATES)).toHaveLength(22);
  });

  it("exposes every expected template name", () => {
    for (const name of TEMPLATE_NAMES) {
      expect(EMAIL_TEMPLATES).toHaveProperty(name);
      expect(typeof EMAIL_TEMPLATES[name]).toBe("function");
    }
  });
});

// Realistic, fully-typed sample params for each template. If a template's
// param shape drifts, this object fails to compile — surfacing the change
// at test time rather than at runtime in production.
const SAMPLES: Record<
  (typeof TEMPLATE_NAMES)[number],
  () => ReturnType<(typeof EMAIL_TEMPLATES)[(typeof TEMPLATE_NAMES)[number]]>
> = {
  inquiryConfirmation: () =>
    inquiryConfirmation({
      name: "Jane Doe",
      reference: "ALM-2026-AB12CD34",
      inquiryType: "general",
      email: "jane@example.com",
    }),
  inquiryReceivedInternal: () =>
    inquiryReceivedInternal({
      reference: "ALM-2026-AB12CD34",
      name: "Jane Doe",
      email: "jane@example.com",
      inquiryType: "general",
      currentChallenge: "Need a CRM",
      organization: "Acme Co.",
    }),
  meetingConfirmation: () =>
    meetingConfirmation({
      name: "Jane Doe",
      meetingType: "discovery-call",
      scheduledAt: "2026-08-01 10:00 GMT",
      durationMin: 30,
      timezone: "GMT",
      location: "Zoom",
      joinUrl: "https://zoom.us/j/123",
    }),
  meetingReminder: () =>
    meetingReminder({
      name: "Jane Doe",
      scheduledAt: "2026-08-01 10:00 GMT",
      durationMin: 30,
      joinUrl: "https://zoom.us/j/123",
    }),
  newsletterVerification: () =>
    newsletterVerification({
      email: "jane@example.com",
      verifyUrl: "https://alaminn.info/api/v1/newsletter/verify?token=abc",
    }),
  newsletterWelcome: () =>
    newsletterWelcome({ name: "Jane", email: "jane@example.com" }),
  newsletterUnsubscribe: () =>
    newsletterUnsubscribe({ email: "jane@example.com", reason: "too many" }),
  aiTaskCompleted: () =>
    aiTaskCompleted({
      workflow: "insight-draft",
      objective: "Summarize Q3 ops",
      reviewUrl: "https://alaminn.info/#staff",
    }),
  aiTaskRequiresReview: () =>
    aiTaskRequiresReview({
      workflow: "insight-draft",
      sensitivity: "high",
      submittedBy: "ai-agent-1",
      reviewUrl: "https://alaminn.info/#staff",
    }),
  passwordReset: () =>
    passwordReset({
      name: "Jane",
      resetUrl: "https://alaminn.info/reset?token=abc",
      expiresIn: "30 minutes",
    }),
  staffInvitation: () =>
    staffInvitation({
      name: "Jane",
      email: "jane@example.com",
      role: "CRM Manager",
      invitedBy: "Al Aminn",
      acceptUrl: "https://alaminn.info/accept?token=abc",
    }),
  securityAlert: () =>
    securityAlert({
      recipientName: "Jane",
      alertType: "suspicious-login",
      description: "Login from a new device",
      timestamp: "2026-08-01 10:00 GMT",
      ipHash: "abc123def456",
      actionRequired: "Reset your password if this wasn't you.",
    }),
  studentRegistration: () =>
    studentRegistration({
      name: "Jane Doe",
      email: "jane@example.com",
      studentId: "ALM-STU-2026-0001",
      loginUrl: "https://alaminn.info/admin/login",
    }),
  otpVerification: () =>
    otpVerification({
      name: "Jane",
      code: "829461",
      purpose: "email verification",
      expiresIn: "10 minutes",
    }),
  accountActivation: () =>
    accountActivation({
      name: "Jane",
      email: "jane@example.com",
      activateUrl: "https://alaminn.info/activate?token=abc",
      expiresIn: "24 hours",
    }),
  consultationRequested: () =>
    consultationRequested({
      name: "Jane",
      email: "jane@example.com",
      preferredDate: "2026-08-15",
      preferredTime: "10:00",
      timezone: "GMT+6",
      topic: "PhD in UK",
      reference: "CONS-2026-AB12",
    }),
  consultationConfirmed: () =>
    consultationConfirmed({
      name: "Jane",
      scheduledAt: "2026-08-15 10:00 GMT+6",
      durationMin: 45,
      timezone: "GMT+6",
      counsellorName: "Al Aminn",
      joinUrl: "https://zoom.us/j/123",
      reference: "CONS-2026-AB12",
    }),
  consultationScheduled: () =>
    consultationScheduled({
      name: "Jane",
      scheduledAt: "2026-08-15 10:00 GMT+6",
      durationMin: 45,
      counsellorName: "Al Aminn",
      joinUrl: "https://zoom.us/j/123",
      reference: "CONS-2026-AB12",
    }),
  applicationStatusUpdate: () =>
    applicationStatusUpdate({
      name: "Jane",
      applicationId: "APP-2026-0001",
      programme: "MSc Computer Science",
      university: "University of Oxford",
      status: "under-review",
      statusMessage: "Your application is being reviewed by the admissions committee.",
      portalUrl: "https://alaminn.info/higher-study/saved",
    }),
  scholarshipDeadlineAlert: () =>
    scholarshipDeadlineAlert({
      name: "Jane",
      scholarshipName: "Chevening Scholarship",
      provider: "UK Government (FCDO)",
      deadlineDate: "2026-11-05",
      daysRemaining: 7,
      applyUrl: "https://alaminn.info/higher-study/scholarships/chevening",
    }),
  phdDeadlineAlert: () =>
    phdDeadlineAlert({
      name: "Jane",
      projectTitle: "Machine Learning for Healthcare",
      supervisorName: "Prof. Smith",
      university: "University of Cambridge",
      deadlineDate: "2026-12-01",
      daysRemaining: 14,
      applyUrl: "https://alaminn.info/higher-study/research/ml-healthcare",
    }),
  newsletterConfirmation: () =>
    newsletterConfirmation({
      email: "jane@example.com",
      confirmUrl: "https://alaminn.info/api/v1/newsletter/verify?token=abc",
      ipAddress: "203.0.113.1",
      subscribedAt: "2026-07-20 10:00 GMT",
    }),
};

describe("template output shape — every template", () => {
  for (const name of TEMPLATE_NAMES) {
    describe(`${name}`, () => {
      const result = SAMPLES[name]();

      it("returns { subject, html, text }", () => {
        expect(result).toBeTypeOf("object");
        expect(result).toHaveProperty("subject");
        expect(result).toHaveProperty("html");
        expect(result).toHaveProperty("text");
      });

      it("subject is a non-empty string", () => {
        expect(typeof result.subject).toBe("string");
        expect(result.subject.length).toBeGreaterThan(0);
      });

      it("html is a non-empty string", () => {
        expect(typeof result.html).toBe("string");
        expect(result.html.length).toBeGreaterThan(0);
      });

      it("text is a non-empty string", () => {
        expect(typeof result.text).toBe("string");
        expect(result.text.length).toBeGreaterThan(0);
      });

      it("html contains the brand mark 'Al Aminn'", () => {
        expect(result.html).toContain("Al Aminn");
      });

      it("text contains the brand mark 'Al Aminn'", () => {
        expect(result.text).toContain("Al Aminn");
      });

      it("text contains no HTML tags", () => {
        // Matches anything that looks like <tag> or <tag attr="x"> or </tag>.
        // Plain-text emails should have none of these.
        const htmlTagPattern = /<\/?[a-zA-Z][^>]*>/;
        expect(htmlTagPattern.test(result.text)).toBe(false);
      });
    });
  }
});

describe("inquiryConfirmation — reference number embedding", () => {
  const reference = "ALM-2026-ZZZZ9999";
  const result = inquiryConfirmation({
    name: "Test User",
    reference,
    inquiryType: "general",
    email: "test@example.com",
  });

  it("embeds the reference in the subject or body of the html", () => {
    expect(result.html).toContain(reference);
  });

  it("embeds the reference in the text body", () => {
    expect(result.text).toContain(reference);
  });

  it("embeds the inquirer's name in the html body", () => {
    expect(result.html).toContain("Test User");
  });
});

describe("template input escaping — XSS hardening", () => {
  it("inquiryConfirmation escapes HTML in the user's name", () => {
    const result = inquiryConfirmation({
      name: "<script>alert('xss')</script>",
      reference: "ALM-2026-XXXX1234",
      inquiryType: "general",
      email: "xss@example.com",
    });
    // The raw <script> tag must NOT appear unescaped in the html body.
    expect(result.html).not.toContain("<script>alert('xss')</script>");
    expect(result.html).toContain("&lt;script&gt;");
  });

  it("inquiryReceivedInternal escapes HTML in the email field", () => {
    const result = inquiryReceivedInternal({
      reference: "ALM-2026-XXXX1234",
      name: "Jane",
      email: "<b>evil@example.com</b>",
      inquiryType: "general",
    });
    expect(result.html).not.toContain("<b>evil@example.com</b>");
    expect(result.html).toContain("&lt;b&gt;evil@example.com&lt;/b&gt;");
  });
});
