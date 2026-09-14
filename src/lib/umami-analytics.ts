// ============================================================
// Umami — Privacy-first analytics (38.8k★ 6753 commits)
//   "no cookies, no surveillance, self-hosted or cloud" — traffic,
//   campaigns, behavior, conversions, revenue in one place.
//   prisma + Next.js + recorder.js CORS, CH projections, /api/send.
// ALO use: complement behavior-tracking.ts (which stores AuditLog)
//   with cookieless Umami events for campaign attribution, funnel,
//   and GDPR-friendly retention. Umami stays source of truth for
//   privacy analytics; behavior-tracking stays for lead scoring.
// Env: UMAMI_URL, UMAMI_WEBSITE_ID, UMAMI_API_KEY (or UMAMI_USERNAME/PASSWORD)
// ============================================================

const UMAMI_URL = process.env.UMAMI_URL || process.env.NEXT_PUBLIC_UMAMI_URL || '';
const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID || process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || '';
const UMAMI_API_KEY = process.env.UMAMI_API_KEY || '';

export type UmamiEvent = {
  name: string; // e.g. "course_viewed" "application_started"
  url?: string;
  hostname?: string;
  language?: string;
  referrer?: string;
  screen?: string;
  title?: string;
  data?: Record<string, string | number | boolean>;
};

/**
 * Send event to self-hosted Umami via /api/send.
 * Graceful when UMAMI_URL not set (no-op, avoids breaking prod).
 * Mirrors Umami's recorder.js payload shape.
 */
export async function umamiTrack(event: UmamiEvent, opts?: { ip?: string; userAgent?: string }): Promise<{ tracked: boolean; reason?: string }> {
  if (!UMAMI_URL || !UMAMI_WEBSITE_ID) return { tracked: false, reason: 'UMAMI_URL/WEBSITE_ID not configured — tracking skipped (privacy-safe)' };

  const payload = {
    type: 'event' as const,
    payload: {
      website: UMAMI_WEBSITE_ID,
      hostname: event.hostname || (typeof window !== 'undefined' ? window.location.hostname : 'alo-education.com'),
      language: event.language || 'en-US',
      referrer: event.referrer || '',
      screen: event.screen || '1920x1080',
      title: event.title || event.name,
      url: event.url || '/',
      name: event.name,
      data: event.data || {},
    },
  };

  try {
    const res = await fetch(`${UMAMI_URL.replace(/\/$/, '')}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(UMAMI_API_KEY ? { 'x-umami-api-key': UMAMI_API_KEY } : {}),
        ...(opts?.userAgent ? { 'User-Agent': opts.userAgent } : {}),
        ...(opts?.ip ? { 'X-Forwarded-For': opts.ip } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const t = await res.text().catch(()=> '');
      console.warn('[umami] send failed', res.status, t.slice(0, 200));
      return { tracked: false, reason: `HTTP ${res.status}` };
    }
    return { tracked: true };
  } catch (e: any) {
    console.warn('[umami] send error', e?.message);
    return { tracked: false, reason: e?.message };
  }
}

// Convenience wrappers for ALO funnel
export const umamiTrackCourseViewed = (courseSlug: string, data?: Record<string,string|number>) =>
  umamiTrack({ name: 'course_viewed', url: `/courses/${courseSlug}`, data: { courseSlug, ...data } });
export const umamiTrackApplicationStarted = (destination: string) =>
  umamiTrack({ name: 'application_started', url: '/apply', data: { destination } });
export const umamiTrackConsultationBooked = (branch: string) =>
  umamiTrack({ name: 'consultation_booked', url: '/book-consultation', data: { branch } });
