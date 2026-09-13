/**
 * Study Guide Generator
 *
 * Pulls REAL data from CoursePage + UniversityPage tables, assembles a
 * structured study-guide document, and marks any missing sections as
 * UNVERIFIED so consumers can flag gaps to humans.
 *
 * Exports:
 *   - generateStudyGuide(courseSlug) — assembles a StudyGuide object
 *   - renderGuideAsHTML(guide)       — renders to a self-contained HTML string
 */

import { db } from "@/lib/db";

// ─── Types ─────────────────────────────────────────────────────

export interface StudyGuideSection {
  title: string;
  body: string | string[] | Record<string, unknown> | null;
  verificationStatus: "VERIFIED" | "UNVERIFIED" | "NEEDS_REVIEW";
  sourceUrl?: string | null;
  lastVerifiedAt?: Date | null;
}

export interface StudyGuide {
  course: {
    slug: string;
    name: string;
    level: string;
    subject: string;
    city: string;
    duration: string;
    intake: string;
    tuition: string;
    scholarship: string | null;
    deadline: string | null;
    sourceUrl: string | null;
    verificationStatus: string;
    lastVerifiedAt: Date | null;
  };
  university: {
    slug: string;
    name: string;
    countrySlug: string;
    city: string;
    overview: string;
    sourceUrl: string | null;
    verificationStatus: string;
    lastVerifiedAt: Date | null;
  } | null;
  sections: StudyGuideSection[];
  generatedAt: Date;
  overallVerification: "VERIFIED" | "UNVERIFIED" | "PARTIAL";
}

// ─── Generator ─────────────────────────────────────────────────

function parseJsonArray<T = any>(s: string | null | undefined): T[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function parseJsonObject<T = Record<string, unknown>>(s: string | null | undefined): T {
  if (!s) return {} as T;
  try {
    const v = JSON.parse(s);
    return (v && typeof v === "object" && !Array.isArray(v)) ? v : {} as T;
  } catch {
    return {} as T;
  }
}

/**
 * Generate a structured study guide for a course.
 *
 * - Pulls CoursePage + linked UniversityPage from the DB.
 * - Each section inherits the course/university's verificationStatus.
 * - If a section's data is empty, it is marked UNVERIFIED regardless.
 * - If no course is found, returns a minimal UNVERIFIED guide.
 */
export async function generateStudyGuide(courseSlug: string): Promise<StudyGuide> {
  const generatedAt = new Date();

  const course = await db.coursePage.findUnique({
    where: { slug: courseSlug },
    include: { university: true },
  });

  if (!course) {
    return {
      course: {
        slug: courseSlug,
        name: "(Unknown course)",
        level: "Unknown",
        subject: "Unknown",
        city: "Unknown",
        duration: "Unknown",
        intake: "Unknown",
        tuition: "Unknown",
        scholarship: null,
        deadline: null,
        sourceUrl: null,
        verificationStatus: "UNVERIFIED",
        lastVerifiedAt: null,
      },
      university: null,
      sections: [
        {
          title: "Course not found",
          body: `No CoursePage with slug "${courseSlug}" was found in the database.`,
          verificationStatus: "UNVERIFIED",
        },
      ],
      generatedAt,
      overallVerification: "UNVERIFIED",
    };
  }

  const uni = course.university;
  const sections: StudyGuideSection[] = [];

  // 1. Overview
  sections.push({
    title: "Course Overview",
    body: course.overview || null,
    verificationStatus: course.overview ? (course.verificationStatus as StudyGuideSection["verificationStatus"]) : "UNVERIFIED",
    sourceUrl: course.sourceUrl,
    lastVerifiedAt: course.lastVerifiedAt,
  });

  // 2. Academic Requirements
  sections.push({
    title: "Academic Requirements",
    body: course.academicRequirement || null,
    verificationStatus: course.academicRequirement ? (course.verificationStatus as StudyGuideSection["verificationStatus"]) : "UNVERIFIED",
    sourceUrl: course.sourceUrl,
    lastVerifiedAt: course.lastVerifiedAt,
  });

  // 3. English Requirements
  sections.push({
    title: "English Language Requirements",
    body: course.englishRequirement || null,
    verificationStatus: course.englishRequirement ? (course.verificationStatus as StudyGuideSection["verificationStatus"]) : "UNVERIFIED",
    sourceUrl: course.sourceUrl,
    lastVerifiedAt: course.lastVerifiedAt,
  });

  // 4. Modules / Curriculum
  const modules = parseJsonArray(course.modules);
  sections.push({
    title: "Modules / Curriculum",
    body: modules.length > 0 ? modules : null,
    verificationStatus: modules.length > 0 ? (course.verificationStatus as StudyGuideSection["verificationStatus"]) : "UNVERIFIED",
    sourceUrl: course.sourceUrl,
    lastVerifiedAt: course.lastVerifiedAt,
  });

  // 5. Career Outcomes
  const careers = parseJsonArray(course.careerOutcomes);
  sections.push({
    title: "Career Outcomes",
    body: careers.length > 0 ? careers : null,
    verificationStatus: careers.length > 0 ? (course.verificationStatus as StudyGuideSection["verificationStatus"]) : "UNVERIFIED",
    sourceUrl: course.sourceUrl,
    lastVerifiedAt: course.lastVerifiedAt,
  });

  // 6. Documents Required
  const documents = parseJsonArray(course.documents);
  sections.push({
    title: "Documents Required",
    body: documents.length > 0 ? documents : null,
    verificationStatus: documents.length > 0 ? (course.verificationStatus as StudyGuideSection["verificationStatus"]) : "UNVERIFIED",
    sourceUrl: course.sourceUrl,
    lastVerifiedAt: course.lastVerifiedAt,
  });

  // 7. FAQs
  const faqs = parseJsonArray(course.faqs);
  sections.push({
    title: "Frequently Asked Questions",
    body: faqs.length > 0 ? faqs : null,
    verificationStatus: faqs.length > 0 ? (course.verificationStatus as StudyGuideSection["verificationStatus"]) : "UNVERIFIED",
    sourceUrl: course.sourceUrl,
    lastVerifiedAt: course.lastVerifiedAt,
  });

  // 8. University Overview (if available)
  if (uni) {
    sections.push({
      title: `About ${uni.name}`,
      body: uni.overview || null,
      verificationStatus: uni.overview ? (uni.verificationStatus as StudyGuideSection["verificationStatus"]) : "UNVERIFIED",
      sourceUrl: uni.sourceUrl,
      lastVerifiedAt: uni.lastVerifiedAt,
    });

    // 9. University Quick Facts
    const uniFacts = parseJsonObject(uni.quickFacts);
    sections.push({
      title: "University Quick Facts",
      body: Object.keys(uniFacts).length > 0 ? uniFacts : null,
      verificationStatus: Object.keys(uniFacts).length > 0 ? (uni.verificationStatus as StudyGuideSection["verificationStatus"]) : "UNVERIFIED",
      sourceUrl: uni.sourceUrl,
      lastVerifiedAt: uni.lastVerifiedAt,
    });

    // 10. University Strengths
    const strengths = parseJsonArray(uni.strengths);
    sections.push({
      title: "University Strengths",
      body: strengths.length > 0 ? strengths : null,
      verificationStatus: strengths.length > 0 ? (uni.verificationStatus as StudyGuideSection["verificationStatus"]) : "UNVERIFIED",
      sourceUrl: uni.sourceUrl,
      lastVerifiedAt: uni.lastVerifiedAt,
    });

    // 11. Tuition & Fees
    const tuition = parseJsonObject(uni.tuition);
    sections.push({
      title: "Tuition & Fees",
      body: Object.keys(tuition).length > 0 ? tuition : (course.tuition || null),
      verificationStatus: (Object.keys(tuition).length > 0 || course.tuition)
        ? (uni.verificationStatus as StudyGuideSection["verificationStatus"])
        : "UNVERIFIED",
      sourceUrl: uni.sourceUrl,
      lastVerifiedAt: uni.lastVerifiedAt,
    });

    // 12. Application Steps
    const steps = parseJsonArray(uni.applicationSteps);
    sections.push({
      title: "Application Steps",
      body: steps.length > 0 ? steps : null,
      verificationStatus: steps.length > 0 ? (uni.verificationStatus as StudyGuideSection["verificationStatus"]) : "UNVERIFIED",
      sourceUrl: uni.sourceUrl,
      lastVerifiedAt: uni.lastVerifiedAt,
    });
  }

  // Compute overall verification
  const verifiedCount = sections.filter((s) => s.verificationStatus === "VERIFIED").length;
  const unverifiedCount = sections.filter((s) => s.verificationStatus === "UNVERIFIED").length;
  const overallVerification: StudyGuide["overallVerification"] =
    unverifiedCount === sections.length ? "UNVERIFIED"
    : unverifiedCount === 0 ? "VERIFIED"
    : "PARTIAL";

  return {
    course: {
      slug: course.slug,
      name: course.name,
      level: course.level,
      subject: course.subject,
      city: course.city,
      duration: course.duration,
      intake: course.intake,
      tuition: course.tuition,
      scholarship: course.scholarship,
      deadline: course.deadline,
      sourceUrl: course.sourceUrl,
      verificationStatus: course.verificationStatus,
      lastVerifiedAt: course.lastVerifiedAt,
    },
    university: uni ? {
      slug: uni.slug,
      name: uni.name,
      countrySlug: uni.countrySlug,
      city: uni.city,
      overview: uni.overview,
      sourceUrl: uni.sourceUrl,
      verificationStatus: uni.verificationStatus,
      lastVerifiedAt: uni.lastVerifiedAt,
    } : null,
    sections,
    generatedAt,
    overallVerification,
  };
}

// ─── HTML Renderer ─────────────────────────────────────────────

function escapeHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBody(body: StudyGuideSection["body"]): string {
  if (body === null || body === undefined || body === "") {
    return `<p class="missing">— Data not available —</p>`;
  }
  if (typeof body === "string") {
    return `<p>${escapeHtml(body)}</p>`;
  }
  if (Array.isArray(body)) {
    if (body.length === 0) return `<p class="missing">— No entries —</p>`;
    const items = body.map((item) => {
      if (typeof item === "string") return `<li>${escapeHtml(item)}</li>`;
      if (item && typeof item === "object") {
        return `<li><pre>${escapeHtml(JSON.stringify(item, null, 2))}</pre></li>`;
      }
      return `<li>${escapeHtml(String(item))}</li>`;
    }).join("");
    return `<ul>${items}</ul>`;
  }
  if (typeof body === "object") {
    const rows = Object.entries(body).map(([k, v]) => {
      const valStr = typeof v === "object" ? JSON.stringify(v) : String(v);
      return `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(valStr)}</td></tr>`;
    }).join("");
    return `<table>${rows}</table>`;
  }
  return `<p>${escapeHtml(String(body))}</p>`;
}

function verificationBadge(status: string): string {
  const cls = status === "VERIFIED" ? "verified" : status === "UNVERIFIED" ? "unverified" : "needs-review";
  return `<span class="badge ${cls}">${escapeHtml(status)}</span>`;
}

/**
 * Render a StudyGuide as a self-contained HTML document.
 * (Inline styles — no external CSS needed.)
 */
export function renderGuideAsHTML(guide: StudyGuide): string {
  const { course, university, sections, overallVerification, generatedAt } = guide;

  const sectionsHtml = sections.map((s) => `
    <section>
      <h2>${escapeHtml(s.title)} ${verificationBadge(s.verificationStatus)}</h2>
      ${renderBody(s.body)}
      ${s.sourceUrl ? `<p class="source">Source: <a href="${escapeHtml(s.sourceUrl)}" rel="nofollow noopener">${escapeHtml(s.sourceUrl)}</a></p>` : ""}
      ${s.lastVerifiedAt ? `<p class="meta">Last verified: ${escapeHtml(new Date(s.lastVerifiedAt).toLocaleDateString())}</p>` : ""}
    </section>
  `).join("");

  const uniBlock = university ? `
    <div class="uni-card">
      <h3>About the University</h3>
      <p><strong>${escapeHtml(university.name)}</strong> — ${escapeHtml(university.city)}, ${escapeHtml(university.countrySlug)}</p>
      <p>${escapeHtml(university.overview)}</p>
      ${university.sourceUrl ? `<p class="source">Source: <a href="${escapeHtml(university.sourceUrl)}" rel="nofollow noopener">${escapeHtml(university.sourceUrl)}</a></p>` : ""}
    </div>
  ` : `<div class="uni-card missing"><p>University data not linked.</p></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Study Guide — ${escapeHtml(course.name)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 880px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 28px; margin: 0 0 4px 0; }
    h2 { font-size: 20px; margin: 24px 0 8px 0; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    h3 { font-size: 16px; margin: 12px 0 4px 0; }
    .meta-row { color: #555; font-size: 14px; margin-bottom: 12px; }
    .meta-row span { margin-right: 12px; }
    .badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; vertical-align: middle; margin-left: 8px; }
    .badge.verified { background: #dcfce7; color: #166534; }
    .badge.unverified { background: #fee2e2; color: #991b1b; }
    .badge.needs-review { background: #fef9c3; color: #854d0e; }
    .overall { padding: 8px 12px; border-radius: 6px; margin: 16px 0; font-weight: 600; }
    .overall.VERIFIED { background: #dcfce7; color: #166534; }
    .overall.PARTIAL { background: #fef9c3; color: #854d0e; }
    .overall.UNVERIFIED { background: #fee2e2; color: #991b1b; }
    .uni-card { background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .uni-card.missing { background: #fef2f2; }
    .missing { color: #991b1b; font-style: italic; }
    .source { font-size: 12px; color: #6b7280; }
    .source a { color: #2563eb; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0; }
    th, td { border: 1px solid #e5e7eb; padding: 6px 10px; text-align: left; vertical-align: top; }
    th { background: #f9fafb; font-weight: 600; width: 30%; }
    pre { background: #f3f4f6; padding: 8px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
    ul { padding-left: 20px; }
    li { margin: 4px 0; }
    section { margin: 16px 0; padding: 12px 0; }
    footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(course.name)}</h1>
  <div class="meta-row">
    <span><strong>Level:</strong> ${escapeHtml(course.level)}</span>
    <span><strong>Subject:</strong> ${escapeHtml(course.subject)}</span>
    <span><strong>City:</strong> ${escapeHtml(course.city)}</span>
    <span><strong>Duration:</strong> ${escapeHtml(course.duration)}</span>
    <span><strong>Intake:</strong> ${escapeHtml(course.intake)}</span>
  </div>
  <div class="meta-row">
    <span><strong>Tuition:</strong> ${escapeHtml(course.tuition)}</span>
    ${course.scholarship ? `<span><strong>Scholarship:</strong> ${escapeHtml(course.scholarship)}</span>` : ""}
    ${course.deadline ? `<span><strong>Deadline:</strong> ${escapeHtml(course.deadline)}</span>` : ""}
  </div>

  <div class="overall ${overallVerification}">
    Overall verification: ${escapeHtml(overallVerification)}
    (${sections.filter((s) => s.verificationStatus === "VERIFIED").length}/${sections.length} sections verified)
  </div>

  ${uniBlock}

  ${sectionsHtml}

  <footer>
    Generated by ALO Education Study Guide Engine on ${escapeHtml(generatedAt.toISOString())}.
    ${course.sourceUrl ? `Course source: <a href="${escapeHtml(course.sourceUrl)}" rel="nofollow noopener">${escapeHtml(course.sourceUrl)}</a>` : ""}
  </footer>
</body>
</html>`;
}
