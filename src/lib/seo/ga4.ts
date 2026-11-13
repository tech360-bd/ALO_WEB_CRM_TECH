// GA4 — consent-aware analytics (Phase 9)
// Separate from Search Console and Business Profile

export interface GA4Config {
  measurementId: string;
  apiSecret?: string;
  enabled: boolean;
  consentMode: boolean;
}

export function getGA4Config(): GA4Config {
  return {
    measurementId: process.env.GA4_MEASUREMENT_ID || "",
    apiSecret: process.env.GA4_API_SECRET || "",
    enabled: process.env.NEXT_PUBLIC_GA4_ENABLED === "true" && !!process.env.GA4_MEASUREMENT_ID,
    consentMode: process.env.NEXT_PUBLIC_CONSENT_MODE !== "false",
  };
}

// Client-side script (to be injected in layout.tsx when enabled + consent)
export function ga4Script(measurementId: string): string {
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}', { 'anonymize_ip': true, 'allow_google_signals': false });
`.trim();
}

/**
 * Server-side Measurement Protocol (for lead conversion tracking).
 *
 * Retained as the stable public entry point for this module, but it now
 * delegates to `src/lib/analytics/server-conversions.ts` so there is exactly
 * one Measurement Protocol implementation. The previous local copy had three
 * problems that the shared module fixes: it used the raw `leadId` as the GA4
 * `client_id` (an internal reference sent verbatim to a third party), it had no
 * environment gate (a local test write went to the production property), and it
 * could leak the API secret through `e.message`, which for a fetch failure
 * includes the request URL.
 *
 * Return shape is unchanged (`ok` / `status` / `error`) so existing callers keep
 * working; `status` now carries the honest outcome label as well.
 */
export async function trackLeadConversion(params: { leadId: string; value?: number; currency?: string }) {
  const { sendServerEvent } = await import("@/lib/analytics/server-conversions");
  const result = await sendServerEvent({
    event: "generate_lead",
    // The lead id is used to DERIVE an opaque client id, not sent as one.
    reference: params.leadId,
    value: params.value,
    currency: params.currency,
    params: { lead_reference: params.leadId },
  });
  return {
    ok: result.status === "SENT",
    status: result.status,
    httpStatus: result.httpStatus,
    ...(result.reason ? { error: result.reason } : {}),
  };
}
