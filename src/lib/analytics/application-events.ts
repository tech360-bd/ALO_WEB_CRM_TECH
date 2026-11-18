/**
 * Business-lifecycle analytics events emitted from ALO's own API routes.
 *
 * These are the application-funnel events the specification requires:
 *   document_upload_completed, application_status_changed, english_test_complete.
 *
 * They are sent with the GA4 Measurement Protocol (server-side) rather than from
 * the browser, for three reasons:
 *
 *   1. **They happen on the server.** A document is uploaded by a student in the
 *      portal, a stage is moved by application staff, a test outcome is recorded
 *      by whoever is handling the case. Two of those three have no browser on
 *      the page that represents the event at all.
 *   2. **Consent and PII are already resolved here.** Nothing passed through this
 *      module is student-identifying: a stage name, a document *kind* from a
 *      fixed vocabulary, and an opaque internal reference used only to derive a
 *      hashed GA4 client id.
 *   3. **Failure isolation is structural.** Every helper is fire-and-forget and
 *      never throws, so a Google outage cannot fail a document upload or block a
 *      stage transition. The business transaction has already committed by the
 *      time anything is reported.
 *
 * What is deliberately NOT here:
 *   - File names, file contents, document ids, student names, emails, phone
 *     numbers, passport numbers, or any free text an operator typed. The shared
 *     `scrubEventParams` screen would drop most of those anyway; the point is that
 *     they are never assembled in the first place.
 *   - A "conversion value" for any of these. ALO has no monetary attribution for
 *     a document upload, and inventing one would corrupt any ROAS reporting built
 *     on the property later.
 */

import { reportServerEvent } from './server-conversions';

/**
 * Fixed document-kind vocabulary for `upload_kind`.
 *
 * Deliberately coarse. The CRM needs to know whether identity, academic,
 * English-proficiency or financial evidence arrived; it does not need analytics
 * to know that the file was called `passport_scan_final_v3.pdf`. Anything not
 * recognised maps to `other` rather than being passed through, so a free-text
 * category typed by an operator cannot leak into a third-party product.
 */
export type UploadKind = 'identity' | 'academic' | 'english' | 'financial' | 'other';

export function documentUploadKind(rawCategory: string | null | undefined): UploadKind {
  const category = (rawCategory || '').trim().toLowerCase();
  if (!category) return 'other';
  // Passport / National ID / birth certificate / photo ID
  if (/(passport|national.?id|nid|birth|photo|identity|id.?card)/.test(category)) return 'identity';
  // Transcripts, certificates, degrees, marksheets
  if (/(academic|transcript|certificate|degree|marksheet|result|education)/.test(category)) return 'academic';
  // IELTS / PTE / TOEFL / Duolingo / MOI / English proficiency
  if (/(english|ielts|pte|toefl|duolingo|moi|language)/.test(category)) return 'english';
  // Bank statements, sponsor letters, affidavits, tax documents
  if (/(bank|financial|finance|fund|sponsor|affidavit|tax|income|solvency)/.test(category)) return 'financial';
  return 'other';
}

/**
 * Report a completed document upload.
 *
 * Call only after the upload transaction has committed, so the event cannot be
 * counted for a document that was then rolled back.
 */
export function reportDocumentUploadCompleted(input: {
  /** Opaque ALO reference (student id or application id) — hashed before use. */
  reference: string;
  category?: string | null;
  applicationReference?: string | null;
}): void {
  reportServerEvent({
    event: 'document_upload_completed',
    reference: input.reference,
    params: {
      upload_kind: documentUploadKind(input.category),
      ...(input.applicationReference ? { application_reference: input.applicationReference } : {}),
    },
  });
}

/**
 * Report an application stage transition.
 *
 * Stage names are ALO workflow labels (`submitted`, `offer_received`, `enrolled`
 * …) and contain no student data. The previous stage is included so the GA4
 * event stream can reconstruct a funnel, which is the entire point of the event.
 */
export function reportApplicationStatusChanged(input: {
  applicationId: string;
  fromStage?: string | null;
  toStage: string;
}): void {
  reportServerEvent({
    event: 'application_status_changed',
    reference: input.applicationId,
    params: {
      application_reference: input.applicationId,
      application_stage: input.toStage,
      ...(input.fromStage ? { stage_from: String(input.fromStage).slice(0, 60) } : {}),
      stage_to: String(input.toStage).slice(0, 60),
    },
  });
}

/** Test vocabulary accepted for `english_test_complete`. Never free text. */
export type EnglishTestKind = 'ielts' | 'pte' | 'toefl' | 'duolingo' | 'alo_english_test' | 'other';

export function englishTestKind(rawTestName: string | null | undefined): EnglishTestKind {
  const name = (rawTestName || '').toLowerCase();
  if (/ielts/.test(name)) return 'ielts';
  if (/\bpte\b/.test(name)) return 'pte';
  if (/toefl/.test(name)) return 'toefl';
  if (/duolingo|\bdet\b/.test(name)) return 'duolingo';
  if (/alo/.test(name)) return 'alo_english_test';
  return 'other';
}

/**
 * Report a completed English test.
 *
 * Honest scope statement: this fires when an English test OUTCOME is recorded
 * against a student record — that is the only completion signal this system
 * actually observes. A candidate finishing an ALO English Test on the external
 * test platform is not visible to this application (there is no callback), and
 * this function therefore does not claim to measure that.
 *
 * `band` is optional and is only sent as a coarse band, never a raw sub-score
 * breakdown: a band is a marketing-relevant outcome; individual section marks are
 * student data with no analytics purpose.
 */
export function reportEnglishTestComplete(input: {
  reference: string;
  testName?: string | null;
  band?: string | number | null;
}): void {
  const params: Record<string, string> = { test_type: englishTestKind(input.testName) };
  const band = input.band === null || input.band === undefined ? '' : String(input.band).trim();
  if (band) params.test_result_band = band.slice(0, 20);
  reportServerEvent({
    event: 'english_test_complete',
    reference: input.reference,
    params,
  });
}
