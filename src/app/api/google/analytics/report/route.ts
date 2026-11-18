import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireGoogleAccess } from '@/lib/google/access';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import {
  REPORT_PRESETS,
  describeAnalyticsDataConfig,
  isReportPreset,
  runPreset,
  runReport,
  validateReportRequest,
  type ReportPresetKey,
} from '@/lib/google/analytics-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/google/analytics/report
 *
 * Read-only GA4 reporting for the Admin → Integrations → Google Ecosystem
 * acquisition panel. This is the "Acquisition dashboard" data source required by
 * the specification: traffic source, organic / referral / direct split, campaign
 * performance, landing-page performance and the daily trend.
 *
 * Query parameters:
 *   preset      — one of REPORT_PRESETS (acquisition|channels|campaigns|
 *                 landingPages|daily|events|countries|devices). Default acquisition.
 *   startDate   — GA4 relative date (28daysAgo) or YYYY-MM-DD. Default 28daysAgo.
 *   endDate     — default yesterday (GA4 daily reports are incomplete for today).
 *   dimensions  — only with preset=custom; allowlisted names.
 *   metrics     — only with preset=custom; allowlisted names.
 *   limit       — 1–10000.
 *
 * Status semantics are identical to every other ALO Google endpoint:
 *   `READY`            Google answered. `rows: []` is a real "no data" answer.
 *   `NOT_CONFIGURED`   No GA4_PROPERTY_ID or no credential — never a fake zero.
 *   `NO_ACCESS`        Credential valid but not a viewer on the property, or the
 *                      Analytics Data API is not enabled for the Cloud project.
 *   `AUTH_FAILED` / `API_ERROR` / `TIMEOUT` — surfaced with Google's reason.
 *
 * Access: `google.analytics.view` (module `google` in src/lib/permissions.ts),
 * layered on top of the pre-existing SEO-staff gate by requireGoogleAccess.
 * Nothing here can write to GA4 and nothing here can create a paid resource.
 */

const querySchema = z.object({
  preset: z.string().trim().max(40).default('acquisition'),
  startDate: z.string().trim().max(20).default('28daysAgo'),
  endDate: z.string().trim().max(20).default('yesterday'),
  dimensions: z.string().trim().max(400).optional(),
  metrics: z.string().trim().max(400).optional(),
  limit: z.coerce.number().int().min(1).max(10_000).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireGoogleAccess(request, 'google.analytics.view');
  if (auth instanceof NextResponse) return auth;

  // Each call is an outbound Google request against a shared property quota.
  const limited = rateLimitMiddleware(request, 'admin_settings');
  if (limited) return limited;

  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, status: 'API_ERROR', error: 'Invalid report request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const query = parsed.data;

  let result;
  if (query.preset === 'custom') {
    const dimensions = (query.dimensions ?? '').split(',').map((part) => part.trim()).filter(Boolean);
    const metrics = (query.metrics ?? '').split(',').map((part) => part.trim()).filter(Boolean);
    const problems = validateReportRequest({
      startDate: query.startDate,
      endDate: query.endDate,
      dimensions,
      metrics,
      limit: query.limit,
    });
    if (problems.length > 0) {
      return NextResponse.json({ success: false, status: 'API_ERROR', error: problems.join(' ') }, { status: 400 });
    }
    result = await runReport({
      startDate: query.startDate,
      endDate: query.endDate,
      dimensions,
      metrics,
      limit: query.limit,
    });
  } else {
    if (!isReportPreset(query.preset)) {
      return NextResponse.json(
        {
          success: false,
          status: 'API_ERROR',
          error: `Unknown preset "${query.preset}". Use one of: ${Object.keys(REPORT_PRESETS).join(', ')}, or custom.`,
        },
        { status: 400 },
      );
    }
    const preset: ReportPresetKey = query.preset as ReportPresetKey;
    result = await runPreset(preset, { startDate: query.startDate, endDate: query.endDate });
  }

  const config = describeAnalyticsDataConfig();
  const ok = result.status === 'READY';

  return NextResponse.json(
    {
      success: ok,
      status: result.status,
      // Explicitly separate from `status`: an operator needs to know whether the
      // number is missing because nothing is configured, because Google refused,
      // or because there is genuinely no traffic.
      configured: config.configured,
      propertyId: config.propertyId || null,
      preset: query.preset,
      label: isReportPreset(query.preset) ? REPORT_PRESETS[query.preset].label : 'Custom report',
      rows: result.data?.rows ?? [],
      totals: result.data?.totals ?? {},
      rowCount: result.data?.rowCount ?? 0,
      sampled: result.data?.sampled ?? null,
      dataFreshness: result.data?.dataFreshness ?? null,
      period: result.data?.period ?? { startDate: query.startDate, endDate: query.endDate },
      fetchedAt: result.fetchedAt ?? null,
      ...(result.reason ? { reason: result.reason } : {}),
      ...(result.httpStatus ? { httpStatus: result.httpStatus } : {}),
      note: ok
        ? 'These figures come from the GA4 Analytics Data API for the configured property. Nothing here is derived from ALO CRM data.'
        : 'No metric is shown because the report did not succeed. ALO never substitutes a zero for a failed Google request.',
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
