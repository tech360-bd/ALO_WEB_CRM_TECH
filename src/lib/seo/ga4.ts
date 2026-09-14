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

// Server-side Measurement Protocol (for lead conversion tracking)
export async function trackLeadConversion(params: { leadId: string; value?: number; currency?: string }) {
  const cfg = getGA4Config();
  if (!cfg.measurementId || !cfg.apiSecret) {
    console.warn("[GA4] not configured — set GA4_MEASUREMENT_ID + GA4_API_SECRET");
    return { ok: false, error: "GA4 not configured" };
  }
  try {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${cfg.measurementId}&api_secret=${cfg.apiSecret}`;
    const body = {
      client_id: params.leadId,
      events: [{ name: "generate_lead", params: { value: params.value || 1, currency: params.currency || "BDT", lead_id: params.leadId } }]
    };
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: r.ok, status: r.status };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
