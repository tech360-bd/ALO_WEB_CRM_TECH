/**
 * Study Guide Generator — produces structured course/uni study guides from REAL DB data.
 *
 * generateStudyGuide(courseSlug):
 *   - Pulls CoursePage + linked UniversityPage from DB.
 *   - Marks any missing field as "UNVERIFIED".
 *   - Returns a structured Guide object ready for JSON or HTML rendering.
 *
 * renderGuideAsHTML(guide):
 *   - Renders the structured guide as a standalone HTML document.
 */

import { db } from "@/lib/db";
import { loadOpenConflicts, passesPublicCoursePagePolicy, publicCoursePageWhere } from './course-finder/public-content-page-policy';

export interface StudyGuide {
  courseSlug: string;
  generatedAt: string;
  verificationStatus: "VERIFIED" | "PARTIAL" | "UNVERIFIED";
  course: {
    name: string;
    slug: string;
    level: string | null;
    subject: string | null;
    duration: string | null;
    intake: string | null;
    tuition: string | null;
    scholarship: string | null;
    englishRequirement: string | null;
    academicRequirement: string | null;
    overview: string | null;
    modules: any[];
    careerOutcomes: any[];
    documents: any[];
    faqs: any[];
    deadline: string | null;
    sourceUrl: string | null;
    lastVerifiedAt: string | null;
    verificationStatus: string;
  };
  university: {
    name: string | null;
    slug: string | null;
    countrySlug: string | null;
    city: string | null;
    overview: string | null;
    strengths: any[];
    quickFacts: any;
    entryRequirements: any;
    tuition: any;
    applicationSteps: any[];
    documents: any[];
    faqs: any[];
    sourceUrl: string | null;
    lastVerifiedAt: string | null;
    verificationStatus: string;
  } | null;
  unverifiedFields: string[];
}

function safeParseArr(s: string | null | undefined): any[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function safeParseObj(s: string | null | undefined): any {
  if (!s) return {};
  try {
    return JSON.parse(s) || {};
  } catch {
    return {};
  }
}

export async function generateStudyGuide(courseSlug: string): Promise<StudyGuide | null> {
  // Phase 1 review (P0-C): the public guide endpoint previously returned any
  // CoursePage by slug, including drafts and unverified records. It now uses
  // the shared public catalogue policy.
  const conflicts = await loadOpenConflicts();
  const loaded = await db.coursePage.findFirst({
    where: publicCoursePageWhere(conflicts, [{ slug: courseSlug }]),
    include: { university: true },
  });
  const course = passesPublicCoursePagePolicy(loaded, conflicts) ? loaded : null;

  if (!course) return null;

  const unverifiedFields: string[] = [];

  // Build course object — mark missing/empty fields
  const courseData = {
    name: course.name,
    slug: course.slug,
    level: course.level || null,
    subject: course.subject || null,
    duration: course.duration || null,
    intake: course.intake || null,
    tuition: course.tuition || null,
    scholarship: course.scholarship || null,
    englishRequirement: course.englishRequirement || null,
    academicRequirement: course.academicRequirement || null,
    overview: course.overview || null,
    modules: safeParseArr(course.modules),
    careerOutcomes: safeParseArr(course.careerOutcomes),
    documents: safeParseArr(course.documents),
    faqs: safeParseArr(course.faqs),
    deadline: course.deadline || null,
    sourceUrl: course.sourceUrl || null,
    lastVerifiedAt: course.lastVerifiedAt ? course.lastVerifiedAt.toISOString() : null,
    verificationStatus: course.verificationStatus || "UNVERIFIED",
  };

  // Track unverified fields
  if (!courseData.overview) unverifiedFields.push("course.overview");
  if (!courseData.tuition) unverifiedFields.push("course.tuition");
  if (!courseData.englishRequirement) unverifiedFields.push("course.englishRequirement");
  if (!courseData.academicRequirement) unverifiedFields.push("course.academicRequirement");
  if (courseData.modules.length === 0) unverifiedFields.push("course.modules");
  if (courseData.careerOutcomes.length === 0) unverifiedFields.push("course.careerOutcomes");
  if (!courseData.sourceUrl) unverifiedFields.push("course.sourceUrl");

  // Build university object if linked
  let universityData: StudyGuide["university"] = null;
  if (course.university) {
    const uni = course.university;
    universityData = {
      name: uni.name,
      slug: uni.slug,
      countrySlug: uni.countrySlug,
      city: uni.city,
      overview: uni.overview || null,
      strengths: safeParseArr(uni.strengths),
      quickFacts: safeParseObj(uni.quickFacts),
      entryRequirements: safeParseObj(uni.entryRequirements),
      tuition: safeParseObj(uni.tuition),
      applicationSteps: safeParseArr(uni.applicationSteps),
      documents: safeParseArr(uni.documents),
      faqs: safeParseArr(uni.faqs),
      sourceUrl: uni.sourceUrl || null,
      lastVerifiedAt: uni.lastVerifiedAt ? uni.lastVerifiedAt.toISOString() : null,
      verificationStatus: uni.verificationStatus || "UNVERIFIED",
    };

    if (!universityData.overview) unverifiedFields.push("university.overview");
    if (universityData.strengths.length === 0) unverifiedFields.push("university.strengths");
    if (!universityData.sourceUrl) unverifiedFields.push("university.sourceUrl");
  } else {
    unverifiedFields.push("university");
  }

  // Overall verification status
  let verificationStatus: StudyGuide["verificationStatus"] = "VERIFIED";
  if (unverifiedFields.length > 0 && unverifiedFields.length <= 4) {
    verificationStatus = "PARTIAL";
  } else if (unverifiedFields.length > 4) {
    verificationStatus = "UNVERIFIED";
  }

  return {
    courseSlug,
    generatedAt: new Date().toISOString(),
    verificationStatus,
    course: courseData,
    university: universityData,
    unverifiedFields,
  };
}

export function renderGuideAsHTML(guide: StudyGuide): string {
  const c = guide.course;
  const u = guide.university;

  const listItems = (items: any[]) =>
    items
      .map((it) => {
        if (typeof it === "string") return `<li>${escapeHtml(it)}</li>`;
        const label = escapeHtml(it.title || it.name || it.heading || it.q || "");
        const body = escapeHtml(it.body || it.description || it.explanation || it.a || "");
        return `<li><strong>${label}</strong>${body ? ` — ${body}` : ""}</li>`;
      })
      .join("");

  const factsList = (facts: any) => {
    if (!facts || typeof facts !== "object") return "<li>No data</li>";
    return Object.entries(facts)
      .map(([k, v]) => `<li><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v))}</li>`)
      .join("");
  };

  const badge = (status: string) => {
    const color =
      status === "VERIFIED"
        ? "#10b981"
        : status === "PARTIAL" || status === "NEEDS_REVIEW"
        ? "#f59e0b"
        : "#ef4444";
    return `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">${escapeHtml(
      status
    )}</span>`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${escapeHtml(c.name)} — Study Guide | ALO Education</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:900px;margin:0 auto;padding:24px;color:#1f2937;line-height:1.6;}
  h1{color:#0f172a;border-bottom:3px solid #0057B8;padding-bottom:8px;}
  h2{color:#1e40af;margin-top:32px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;}
  h3{color:#374151;margin-top:20px;}
  .meta{background:#f8fafc;padding:12px 16px;border-radius:8px;margin:12px 0;font-size:14px;}
  ul{padding-left:20px;}
  .unverified{background:#fef3c7;padding:8px 12px;border-left:4px solid #f59e0b;margin:12px 0;font-size:13px;}
</style>
</head>
<body>
<h1>${escapeHtml(c.name)}</h1>
<div class="meta">
  ${badge(guide.verificationStatus)} Generated: ${escapeHtml(guide.generatedAt)} | Course Slug: ${escapeHtml(c.slug)}
</div>

${guide.verificationStatus !== "VERIFIED" ? `<div class="unverified">⚠️ This guide contains ${guide.unverifiedFields.length} unverified field(s): ${guide.unverifiedFields.map(escapeHtml).join(", ")}. Verify before publishing.</div>` : ""}

<h2>Course Overview</h2>
<p>${c.overview ? escapeHtml(c.overview) : '<em style="color:#EF4444;">UNVERIFIED — overview missing</em>'}</p>

<h3>Quick Facts</h3>
<ul>
  <li><strong>Level:</strong> ${c.level || '<em style="color:#EF4444;">UNVERIFIED</em>'}</li>
  <li><strong>Subject:</strong> ${c.subject || '<em style="color:#EF4444;">UNVERIFIED</em>'}</li>
  <li><strong>Duration:</strong> ${c.duration || '<em style="color:#EF4444;">UNVERIFIED</em>'}</li>
  <li><strong>Intake:</strong> ${c.intake || '<em style="color:#EF4444;">UNVERIFIED</em>'}</li>
  <li><strong>Tuition:</strong> ${c.tuition || '<em style="color:#EF4444;">UNVERIFIED</em>'}</li>
  <li><strong>Scholarship:</strong> ${c.scholarship || '<em style="color:#EF4444;">UNVERIFIED</em>'}</li>
  <li><strong>Deadline:</strong> ${c.deadline || '<em style="color:#EF4444;">UNVERIFIED</em>'}</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>English:</strong> ${c.englishRequirement || '<em style="color:#EF4444;">UNVERIFIED</em>'}</li>
  <li><strong>Academic:</strong> ${c.academicRequirement || '<em style="color:#EF4444;">UNVERIFIED</em>'}</li>
</ul>

${c.modules.length > 0 ? `<h3>Modules</h3><ul>${listItems(c.modules)}</ul>` : ""}
${c.careerOutcomes.length > 0 ? `<h3>Career Outcomes</h3><ul>${listItems(c.careerOutcomes)}</ul>` : ""}
${c.documents.length > 0 ? `<h3>Documents Required</h3><ul>${listItems(c.documents)}</ul>` : ""}
${c.faqs.length > 0 ? `<h3>FAQs</h3><ul>${listItems(c.faqs)}</ul>` : ""}

${u ? `
<h2>University: ${escapeHtml(u.name || "")}</h2>
<p>${u.overview ? escapeHtml(u.overview) : '<em style="color:#EF4444;">UNVERIFIED — overview missing</em>'}</p>

<h3>University Facts</h3>
<ul>
  <li><strong>Country:</strong> ${escapeHtml(u.countrySlug || "—")}</li>
  <li><strong>City:</strong> ${escapeHtml(u.city || "—")}</li>
  <li><strong>Verification:</strong> ${badge(u.verificationStatus)}</li>
</ul>

${u.strengths.length > 0 ? `<h3>Strengths</h3><ul>${listItems(u.strengths)}</ul>` : ""}
${Object.keys(u.quickFacts).length > 0 ? `<h3>Quick Facts</h3><ul>${factsList(u.quickFacts)}</ul>` : ""}
${u.applicationSteps.length > 0 ? `<h3>Application Steps</h3><ul>${listItems(u.applicationSteps)}</ul>` : ""}
${u.documents.length > 0 ? `<h3>University Documents</h3><ul>${listItems(u.documents)}</ul>` : ""}
${u.faqs.length > 0 ? `<h3>University FAQs</h3><ul>${listItems(u.faqs)}</ul>` : ""}
` : '<h2>University</h2><p><em style="color:#EF4444;">UNVERIFIED — university not linked</em></p>'}

<hr style="margin-top:40px;border-top:1px solid #e5e7eb;" />
<p style="font-size:12px;color:#6b7280;">
  Generated by ALO Education Study Guide Engine. Source data may need verification — always confirm with official university sources before publishing.
</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
