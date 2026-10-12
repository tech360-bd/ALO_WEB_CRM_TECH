/**
 * Client helper for the public language-prep lead form.
 *
 * A visitor is told their request was received ONLY when the HTTP response is
 * OK and the body reports success. Network errors, 4xx and 5xx responses are
 * reported as failures, so the UI never shows a false confirmation.
 */

export const LEAD_SUBMIT_FAILURE_MESSAGE =
  'We could not save your request right now. Please try again, or message us on WhatsApp.';

export type LeadSubmitResult = { ok: true; message: string } | { ok: false; message: string };

export async function submitLanguagePrepLead(
  payload: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<LeadSubmitResult> {
  try {
    const res = await fetchImpl('/api/language-prep/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data: unknown = await res.json().catch(() => null);
    const success = typeof data === 'object' && data !== null && (data as { success?: unknown }).success === true;
    if (res.ok && success) {
      return { ok: true, message: 'Request received. Our team will contact you shortly.' };
    }
    return { ok: false, message: LEAD_SUBMIT_FAILURE_MESSAGE };
  } catch {
    return { ok: false, message: LEAD_SUBMIT_FAILURE_MESSAGE };
  }
}
