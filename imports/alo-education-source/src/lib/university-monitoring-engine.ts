// ALO Education — University & Official Data Monitoring Engine (Task 21)
// Core engine that:
//   1. Fetches official source URLs (via z-ai-web-dev-sdk web-reader + web-search)
//   2. Normalizes and hashes the content
//   3. Compares against the previous snapshot
//   4. Uses AI to extract structured facts and explain changes
//   5. Creates DataChange records routed to the Super Admin approval queue
//
// MUST be used in backend only.

import { db } from "@/lib/db";
import { getZai, extractJson } from "@/lib/ai";
import crypto from "crypto";

const IMPACT_BY_CHANGE_TYPE: Record<string, "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> = {
  NEW_UNIVERSITY: "MEDIUM",
  UNIVERSITY_UPDATED: "LOW",
  UNIVERSITY_CLOSED: "CRITICAL",
  NEW_FACULTY: "LOW",
  FACULTY_UPDATED: "LOW",
  NEW_COURSE: "MEDIUM",
  COURSE_UPDATED: "LOW",
  COURSE_CLOSED: "CRITICAL",
  COURSE_RENAMED: "MEDIUM",
  COURSE_CODE_CHANGED: "MEDIUM",
  FEE_CHANGED: "HIGH",
  INTAKE_CHANGED: "HIGH",
  DEADLINE_CHANGED: "HIGH",
  REQUIREMENT_CHANGED: "HIGH",
  ENGLISH_REQUIREMENT_CHANGED: "HIGH",
  SCHOLARSHIP_NEW: "MEDIUM",
  SCHOLARSHIP_UPDATED: "HIGH",
  SCHOLARSHIP_CLOSED: "CRITICAL",
  DURATION_CHANGED: "MEDIUM",
  CAMPUS_CHANGED: "LOW",
  STUDY_MODE_CHANGED: "MEDIUM",
  APPLICATION_PROCESS_CHANGED: "MEDIUM",
  OFFICIAL_POLICY_CHANGE: "HIGH",
  GOVERNMENT_POLICY_CHANGE: "CRITICAL",
  SOURCE_CHANGED: "LOW",
  SOURCE_UNAVAILABLE: "MEDIUM",
  POSSIBLE_DATA_CONFLICT: "HIGH",
  NEEDS_MANUAL_REVIEW: "MEDIUM",
};

export interface MonitoringCounts {
  universitiesChecked: number;
  coursesChecked: number;
  sourcesChecked: number;
  changesDetected: number;
  newUniversities: number;
  newCourses: number;
  updatedCourses: number;
  closedCourses: number;
  feeChanges: number;
  intakeChanges: number;
  deadlineChanges: number;
  requirementChanges: number;
  scholarshipChanges: number;
  governmentChanges: number;
  criticalChanges: number;
  failedSources: number;
  conflicts: number;
  manualReviewItems: number;
}

export interface RunOptions {
  scope?: "all" | "verified-only" | "country:XX";
  limit?: number;
}

// Main entry: run a full monitoring cycle.
export async function runMonitoringCycle(runId: string, options: RunOptions = {}): Promise<{
  counts: MonitoringCounts;
  aiReportSummary: string;
}> {
  const counts: MonitoringCounts = {
    universitiesChecked: 0, coursesChecked: 0, sourcesChecked: 0,
    changesDetected: 0, newUniversities: 0, newCourses: 0, updatedCourses: 0, closedCourses: 0,
    feeChanges: 0, intakeChanges: 0, deadlineChanges: 0, requirementChanges: 0,
    scholarshipChanges: 0, governmentChanges: 0, criticalChanges: 0,
    failedSources: 0, conflicts: 0, manualReviewItems: 0,
  };

  // 1. Load sources to check
  const where: any = { monitoringEnabled: true, status: "ACTIVE" };
  if (options.scope === "verified-only") {
    // Only check sources attached to VERIFIED universities
    where.OR = [
      { entityType: { in: ["GOVERNMENT", "AUTHORITY", "COUNTRY"] } },
      { entityType: "UNIVERSITY", universitySlug: { not: null } },
    ];
  } else if (options.scope?.startsWith("country:")) {
    where.countrySlug = options.scope.split(":")[1];
  }

  const sources = await db.officialSource.findMany({
    where,
    take: options.limit || 50,
    orderBy: [{ priority: "asc" }, { lastCheckedAt: "asc" }],
  });

  await log(runId, "INFO", `Starting monitoring cycle for ${sources.length} sources (scope: ${options.scope || "default"})`);

  // 2. For each source: fetch, snapshot, compare, detect changes
  for (const source of sources) {
    try {
      await checkSource(runId, source, counts);
      counts.sourcesChecked++;
      if (source.entityType === "UNIVERSITY") counts.universitiesChecked++;
    } catch (err: any) {
      counts.failedSources++;
      await log(runId, "ERROR", `Source check failed: ${source.sourceUrl} — ${err.message}`, source);
      // Record the failure on the source
      await db.officialSource.update({
        where: { id: source.id },
        data: {
          consecutiveFailures: { increment: 1 },
          lastError: err.message,
        },
      });
      // If source has been unreachable for 3+ consecutive checks, mark BROKEN
      if (source.consecutiveFailures + 1 >= 3) {
        await db.officialSource.update({
          where: { id: source.id },
          data: { status: "BROKEN" },
        });
        // Create a SOURCE_UNAVAILABLE change
        await createChange(runId, source, "SOURCE_UNAVAILABLE", "source_availability",
          "ACTIVE", "UNAVAILABLE", source.sourceUrl, "Source has been unreachable for 3+ consecutive checks", 0.9, "MEDIUM");
      }
    }
  }

  // 3. Generate AI summary of the run
  const aiReportSummary = await generateRunSummary(counts, sources.length);

  await log(runId, "INFO", `Monitoring cycle complete: ${counts.sourcesChecked} sources, ${counts.changesDetected} changes, ${counts.criticalChanges} critical, ${counts.failedSources} failed`);

  return { counts, aiReportSummary };
}

// Check a single source: fetch, snapshot, compare, detect changes.
async function checkSource(runId: string, source: any, counts: MonitoringCounts) {
  const startedAt = Date.now();

  // 1. Fetch the source content via z-ai-web-dev-sdk
  const fetchResult = await fetchSourceContent(source.sourceUrl);
  const captureDurationMs = Date.now() - startedAt;

  if (!fetchResult.ok) {
    counts.failedSources++;
    await db.officialSource.update({
      where: { id: source.id },
      data: {
        lastCheckedAt: new Date(),
        lastHttpStatus: fetchResult.status,
        lastError: fetchResult.error,
        consecutiveFailures: { increment: 1 },
      },
    });
    await log(runId, "WARN", `Source fetch failed (${fetchResult.status}): ${source.sourceUrl} — ${fetchResult.error}`, source);
    return;
  }

  // 2. Normalize and hash the content
  const normalizedText = normalizeText(fetchResult.text || "");
  const contentHash = crypto.createHash("sha256").update(normalizedText).digest("hex");

  // 3. Get the previous snapshot for comparison
  const previousSnapshot = await db.sourceSnapshot.findFirst({
    where: { sourceId: source.id },
    orderBy: { capturedAt: "desc" },
  });

  // 4. Use AI to extract structured key facts from the current content
  const aiExtraction = await extractKeyFacts(source, fetchResult.text || "", fetchResult.title || "");

  // 5. Create the new snapshot
  const snapshot = await db.sourceSnapshot.create({
    data: {
      sourceId: source.id,
      capturedAt: new Date(),
      httpStatus: fetchResult.status || 200,
      contentHash,
      contentLength: normalizedText.length,
      title: fetchResult.title,
      contentType: fetchResult.contentType,
      textExtract: normalizedText.slice(0, 50000), // cap at 50KB
      aiSummary: aiExtraction.summary,
      aiKeyFacts: JSON.stringify(aiExtraction.keyFacts),
      captureDurationMs,
    },
  });

  // 6. Update source status
  await db.officialSource.update({
    where: { id: source.id },
    data: {
      lastCheckedAt: new Date(),
      lastHttpStatus: fetchResult.status || 200,
      lastContentHash: contentHash,
      lastError: null,
      consecutiveFailures: 0,
      lastVerifiedAt: new Date(),
      status: "ACTIVE",
    },
  });

  // 7. Compare against previous snapshot
  if (previousSnapshot) {
    if (previousSnapshot.contentHash === contentHash) {
      // No change — just log
      await log(runId, "DEBUG", `No change detected: ${source.sourceUrl}`, source);
      return;
    }

    // Content changed — use AI to diff and classify
    const diffs = await detectChanges(source, previousSnapshot, snapshot, aiExtraction);

    for (const diff of diffs) {
      await createChange(
        runId, source, diff.changeType, diff.fieldName,
        diff.oldValue, diff.newValue, source.sourceUrl,
        diff.aiExplanation, diff.confidence, diff.impactLevel,
        previousSnapshot.capturedAt, diff.newSourceDate
      );
      counts.changesDetected++;
      // Increment the appropriate counter
      switch (diff.changeType) {
        case "FEE_CHANGED": counts.feeChanges++; break;
        case "INTAKE_CHANGED": counts.intakeChanges++; break;
        case "DEADLINE_CHANGED": counts.deadlineChanges++; break;
        case "REQUIREMENT_CHANGED":
        case "ENGLISH_REQUIREMENT_CHANGED":
          counts.requirementChanges++; break;
        case "SCHOLARSHIP_NEW":
        case "SCHOLARSHIP_UPDATED":
        case "SCHOLARSHIP_CLOSED":
          counts.scholarshipChanges++; break;
        case "GOVERNMENT_POLICY_CHANGE": counts.governmentChanges++; break;
        case "NEW_COURSE": counts.newCourses++; break;
        case "COURSE_UPDATED": counts.updatedCourses++; break;
        case "COURSE_CLOSED": counts.closedCourses++; break;
        case "NEW_UNIVERSITY": counts.newUniversities++; break;
      }
      if (diff.impactLevel === "CRITICAL") counts.criticalChanges++;
      if (diff.changeType === "NEEDS_MANUAL_REVIEW") counts.manualReviewItems++;
      if (diff.changeType === "POSSIBLE_DATA_CONFLICT") counts.conflicts++;
    }
  } else {
    // First snapshot — just log that we have a baseline
    await log(runId, "INFO", `Baseline snapshot created for ${source.sourceUrl} (${normalizedText.length} chars)`, source);
  }
}

// Fetch source content using z-ai-web-dev-sdk web-reader (with web-search fallback).
async function fetchSourceContent(url: string): Promise<{
  ok: boolean;
  status: number;
  text?: string;
  title?: string;
  contentType?: string;
  error?: string;
}> {
  try {
    const zai = await getZai();
    // Try the web-reader API first
    const reader: any = (zai as any).webReader || (zai as any).web_reader || (zai as any).reader;
    if (reader && typeof reader.read === "function") {
      const result = await reader.read({ url });
      return {
        ok: true,
        status: 200,
        text: result.content || result.text || result.html || "",
        title: result.title || "",
        contentType: "text/html",
      };
    }
    // Fallback: use web-search to find the URL and get a snippet
    const search: any = (zai as any).webSearch || (zai as any).web_search || (zai as any).search;
    if (search && typeof search.run === "function") {
      const result = await search.run({ query: url });
      const items = result.items || result.results || [];
      if (items.length > 0) {
        return {
          ok: true,
          status: 200,
          text: items[0].content || items[0].snippet || items[0].description || "",
          title: items[0].title || "",
          contentType: "text/html",
        };
      }
    }
    // Final fallback: direct fetch
    const res = await fetch(url, {
      headers: { "User-Agent": "ALO-Education-Monitor/1.0 (+https://aloeducation.com)" },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    const text = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      text: text.slice(0, 100000),
      title: extractTitle(text),
      contentType: res.headers.get("content-type") || "text/html",
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err: any) {
    return { ok: false, status: 0, error: err.message };
  }
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : "";
}

// Normalize text: strip HTML tags, collapse whitespace, lowercase for hashing.
function normalizeText(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Use AI to extract structured key facts from a page.
async function extractKeyFacts(source: any, content: string, title: string): Promise<{
  summary: string;
  keyFacts: Record<string, string>;
}> {
  try {
    const zai = await getZai();
    const truncatedContent = content.slice(0, 8000); // limit for prompt size

    const prompt = `You are the ALO University Data Monitoring Agent. Analyze the following page content from an official source and extract structured key facts relevant to international student admissions.

SOURCE: ${source.sourceName} (${source.sourceUrl})
SOURCE TYPE: ${source.sourceType}
PAGE TITLE: ${title}

PAGE CONTENT (truncated):
${truncatedContent}

Extract the following fields if present (leave empty/missing if not found — DO NOT guess):
- tuition_international: International tuition fee (with currency and period)
- tuition_domestic: Domestic tuition fee (with currency and period)
- intake_january: January intake availability (yes/no/unknown)
- intake_september: September intake availability (yes/no/unknown)
- intake_other: Other intakes mentioned
- deadline_application: Application deadline(s)
- english_ielts: IELTS requirement
- english_toefl: TOEFL requirement
- english_pte: PTE requirement
- english_duolingo: Duolingo requirement
- academic_requirement: Academic entry requirement
- duration: Programme duration
- study_mode: Full-time / Part-time / Online / Hybrid
- campus: Campus/location
- scholarship: Scholarship information
- application_process: Application procedure summary
- visa_info: Visa-related information
- course_status: Course status (open/closed/suspended)
- accreditation: Professional accreditation

Return JSON: { "summary": "2-3 sentence summary of the page", "keyFacts": { ... } }
Only include fields where the information is clearly stated. Do not fabricate.`;

    const completion = await zai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      thinking: { type: "disabled" },
      temperature: 0.1,
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = extractJson<{ summary: string; keyFacts: Record<string, string> }>(raw);
    if (parsed) {
      return { summary: parsed.summary || "", keyFacts: parsed.keyFacts || {} };
    }
    return { summary: raw.slice(0, 500), keyFacts: {} };
  } catch (err: any) {
    return { summary: `AI extraction failed: ${err.message}`, keyFacts: {} };
  }
}

// Use AI to detect and classify changes between two snapshots.
async function detectChanges(
  source: any,
  previous: any,
  current: any,
  currentExtraction: { summary: string; keyFacts: Record<string, string> }
): Promise<Array<{
  changeType: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  aiExplanation: string;
  confidence: number;
  impactLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  newSourceDate?: string;
}>> {
  const changes: any[] = [];

  try {
    // Parse previous key facts
    let prevKeyFacts: Record<string, string> = {};
    try { prevKeyFacts = JSON.parse(previous.aiKeyFacts || "{}"); } catch {}

    // Compare each field
    const allFields = new Set([...Object.keys(prevKeyFacts), ...Object.keys(currentExtraction.keyFacts)]);

    for (const field of allFields) {
      const oldVal = prevKeyFacts[field] || null;
      const newVal = currentExtraction.keyFacts[field] || null;

      // Skip if both empty
      if (!oldVal && !newVal) continue;
      // Skip if identical
      if (oldVal === newVal) continue;

      // Classify the change
      const { changeType, impactLevel } = classifyFieldChange(field, oldVal, newVal);
      const confidence = calculateConfidence(field, oldVal, newVal);

      // Build AI explanation
      const aiExplanation = await explainChange(source, field, oldVal, newVal, changeType);

      changes.push({
        changeType,
        fieldName: field,
        oldValue: oldVal,
        newValue: newVal,
        aiExplanation,
        confidence,
        impactLevel,
      });
    }

    // If content hash changed but no specific field changes detected, log a SOURCE_CHANGED
    if (changes.length === 0 && previous.contentHash !== current.contentHash) {
      changes.push({
        changeType: "SOURCE_CHANGED",
        fieldName: "page_content",
        oldValue: `Previous hash: ${previous.contentHash?.slice(0, 16)}...`,
        newValue: `New hash: ${current.contentHash?.slice(0, 16)}...`,
        aiExplanation: "The page content has changed but the AI could not identify a specific structured field change. Super Admin should review the source manually.",
        confidence: 0.5,
        impactLevel: "LOW",
      });
    }
  } catch (err: any) {
    changes.push({
      changeType: "NEEDS_MANUAL_REVIEW",
      fieldName: "parsing_error",
      oldValue: null,
      newValue: null,
      aiExplanation: `Change detection failed: ${err.message}. Manual review required.`,
      confidence: 0.3,
      impactLevel: "MEDIUM",
    });
  }

  return changes;
}

// Map a field name + change pattern to a change type and impact level.
function classifyFieldChange(field: string, oldVal: string | null, newVal: string | null): {
  changeType: string;
  impactLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
} {
  if (field.startsWith("tuition_")) return { changeType: "FEE_CHANGED", impactLevel: IMPACT_BY_CHANGE_TYPE.FEE_CHANGED };
  if (field.startsWith("intake_")) return { changeType: "INTAKE_CHANGED", impactLevel: IMPACT_BY_CHANGE_TYPE.INTAKE_CHANGED };
  if (field === "deadline_application") return { changeType: "DEADLINE_CHANGED", impactLevel: IMPACT_BY_CHANGE_TYPE.DEADLINE_CHANGED };
  if (field.startsWith("english_")) return { changeType: "ENGLISH_REQUIREMENT_CHANGED", impactLevel: IMPACT_BY_CHANGE_TYPE.ENGLISH_REQUIREMENT_CHANGED };
  if (field === "academic_requirement") return { changeType: "REQUIREMENT_CHANGED", impactLevel: IMPACT_BY_CHANGE_TYPE.REQUIREMENT_CHANGED };
  if (field === "duration") return { changeType: "DURATION_CHANGED", impactLevel: IMPACT_BY_CHANGE_TYPE.DURATION_CHANGED };
  if (field === "study_mode") return { changeType: "STUDY_MODE_CHANGED", impactLevel: IMPACT_BY_CHANGE_TYPE.STUDY_MODE_CHANGED };
  if (field === "campus") return { changeType: "CAMPUS_CHANGED", impactLevel: IMPACT_BY_CHANGE_TYPE.CAMPUS_CHANGED };
  if (field === "scholarship") {
    if (!oldVal && newVal) return { changeType: "SCHOLARSHIP_NEW", impactLevel: IMPACT_BY_CHANGE_TYPE.SCHOLARSHIP_NEW };
    if (oldVal && !newVal) return { changeType: "SCHOLARSHIP_CLOSED", impactLevel: IMPACT_BY_CHANGE_TYPE.SCHOLARSHIP_CLOSED };
    return { changeType: "SCHOLARSHIP_UPDATED", impactLevel: IMPACT_BY_CHANGE_TYPE.SCHOLARSHIP_UPDATED };
  }
  if (field === "application_process") return { changeType: "APPLICATION_PROCESS_CHANGED", impactLevel: IMPACT_BY_CHANGE_TYPE.APPLICATION_PROCESS_CHANGED };
  if (field === "visa_info") return { changeType: "GOVERNMENT_POLICY_CHANGE", impactLevel: IMPACT_BY_CHANGE_TYPE.GOVERNMENT_POLICY_CHANGE };
  if (field === "course_status") {
    if (newVal?.toLowerCase().includes("closed") || newVal?.toLowerCase().includes("suspended")) {
      return { changeType: "COURSE_CLOSED", impactLevel: IMPACT_BY_CHANGE_TYPE.COURSE_CLOSED };
    }
    return { changeType: "COURSE_UPDATED", impactLevel: IMPACT_BY_CHANGE_TYPE.COURSE_UPDATED };
  }
  return { changeType: "COURSE_UPDATED", impactLevel: IMPACT_BY_CHANGE_TYPE.COURSE_UPDATED };
}

function calculateConfidence(field: string, oldVal: string | null, newVal: string | null): number {
  // Higher confidence when both values are present and clearly different
  if (oldVal && newVal && oldVal.length > 3 && newVal.length > 3) return 0.9;
  if (oldVal || newVal) return 0.7;
  return 0.5;
}

// Use AI to generate a human-readable explanation of a change.
async function explainChange(
  source: any,
  field: string,
  oldVal: string | null,
  newVal: string | null,
  changeType: string
): Promise<string> {
  try {
    const zai = await getZai();
    const prompt = `You are the ALO University Data Monitoring Agent. Explain the following detected change in 1-2 clear sentences for a Super Admin reviewing the approval queue.

SOURCE: ${source.sourceName} (${source.sourceUrl})
FIELD: ${field}
CHANGE TYPE: ${changeType}
OLD VALUE: ${oldVal || "(none — field did not exist before)"}
NEW VALUE: ${newVal || "(none — field was removed)"}

Explain what changed and why it matters for international student admissions. Be concise and factual. Do not speculate.`;

    const completion = await zai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      thinking: { type: "disabled" },
      temperature: 0.2,
    });
    return completion.choices[0]?.message?.content?.trim() || `${changeType}: ${field} changed from "${oldVal}" to "${newVal}"`;
  } catch {
    return `${changeType}: ${field} changed from "${oldVal}" to "${newVal}"`;
  }
}

// Create a DataChange record + ApprovalQueueItem.
async function createChange(
  runId: string,
  source: any,
  changeType: string,
  fieldName: string,
  oldValue: string | null,
  newValue: string | null,
  sourceUrl: string,
  aiExplanation: string,
  confidence: number,
  impactLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  previousVerifiedAt?: Date,
  newSourceDate?: string
) {
  const entityType = source.entityType || "UNIVERSITY";

  const change = await db.dataChange.create({
    data: {
      runId,
      sourceId: source.id,
      entityType,
      universitySlug: source.universitySlug,
      courseSlug: source.courseSlug,
      countrySlug: source.countrySlug,
      changeType,
      fieldName,
      oldValue,
      newValue,
      sourceUrl,
      detectedAt: new Date(),
      previousVerifiedAt: previousVerifiedAt || null,
      newSourceDate: newSourceDate || null,
      aiExplanation,
      confidence,
      impactLevel,
      status: "PENDING",
    },
  });

  // Enqueue for Super Admin review
  const queueType = impactLevel === "CRITICAL" ? "CRITICAL" : changeType === "NEEDS_MANUAL_REVIEW" ? "MANUAL_REVIEW" : "STANDARD";
  const priority = impactLevel === "CRITICAL" ? 10 : impactLevel === "HIGH" ? 7 : impactLevel === "MEDIUM" ? 4 : 1;

  await db.approvalQueueItem.create({
    data: {
      changeId: change.id,
      queueType,
      priority,
      status: "PENDING",
    },
  });

  return change;
}

// Recheck a specific change's source.
export async function recheckSource(source: any, change: any): Promise<{
  confidence: number;
  aiExplanation: string;
  newValue: string | null;
}> {
  // Re-fetch the source
  const fetchResult = await fetchSourceContent(source.sourceUrl);
  if (!fetchResult.ok) {
    throw new Error(`Source fetch failed: ${fetchResult.error || "HTTP " + fetchResult.status}`);
  }

  // Re-extract facts
  const extraction = await extractKeyFacts(source, fetchResult.text || "", fetchResult.title || "");

  // Find the new value for the change's field
  const newValue = extraction.keyFacts[change.fieldName] || null;

  // Recalculate confidence
  let confidence = 0.7;
  if (newValue === change.newValue) {
    confidence = 0.95; // recheck confirms the original detection
  } else if (newValue === change.oldValue) {
    confidence = 0.4; // recheck found the OLD value — the change may have been reverted
  } else if (newValue && newValue !== change.newValue) {
    confidence = 0.6; // recheck found yet another value — lower confidence
  }

  const aiExplanation = `Recheck completed. Source re-fetched and re-analyzed on ${new Date().toISOString()}. Current detected value: "${newValue || "(not found)"}". Confidence recalculated as ${confidence.toFixed(2)}.`;

  return { confidence, aiExplanation, newValue };
}

// Generate the 7-day AI report summary.
async function generateRunSummary(counts: MonitoringCounts, sourcesChecked: number): Promise<string> {
  try {
    const zai = await getZai();
    const prompt = `Generate a concise 7-day monitoring report summary for the ALO University Data Monitoring Agent. Format as 3-4 bullet points highlighting the most important findings.

STATISTICS:
- Sources checked: ${sourcesChecked}
- Universities checked: ${counts.universitiesChecked}
- Total changes detected: ${counts.changesDetected}
- New universities: ${counts.newUniversities}
- New courses: ${counts.newCourses}
- Updated courses: ${counts.updatedCourses}
- Closed courses: ${counts.closedCourses}
- Fee changes: ${counts.feeChanges}
- Intake changes: ${counts.intakeChanges}
- Deadline changes: ${counts.deadlineChanges}
- Requirement changes: ${counts.requirementChanges}
- Scholarship changes: ${counts.scholarshipChanges}
- Government policy changes: ${counts.governmentChanges}
- Critical changes: ${counts.criticalChanges}
- Failed sources: ${counts.failedSources}
- Conflicts: ${counts.conflicts}
- Manual review items: ${counts.manualReviewItems}

Be factual and concise. Highlight critical and high-impact items first.`;

    const completion = await zai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      thinking: { type: "disabled" },
      temperature: 0.3,
    });
    return completion.choices[0]?.message?.content?.trim() || `Monitoring cycle complete: ${counts.changesDetected} changes detected (${counts.criticalChanges} critical).`;
  } catch {
    return `Monitoring cycle complete: ${counts.changesDetected} changes detected (${counts.criticalChanges} critical, ${counts.failedSources} failed sources).`;
  }
}

// Helper: write a monitoring log entry.
async function log(runId: string, level: string, message: string, source?: any) {
  try {
    await db.monitoringLog.create({
      data: {
        runId,
        level,
        message,
        entityType: source?.entityType,
        entitySlug: source?.universitySlug || source?.courseSlug || source?.countrySlug,
        sourceUrl: source?.sourceUrl,
      },
    });
  } catch {
    // Logging is best-effort — don't fail the run if logging fails
  }
}
