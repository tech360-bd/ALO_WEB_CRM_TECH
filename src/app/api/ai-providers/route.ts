import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { EXCLUDED_PROVIDERS } from '@/lib/ai-providers/catalog';
import { listProviderStatus } from '@/lib/ai-providers/resolve';

// ============================================================
// GET /api/ai-providers — free-tier AI provider onboarding status
//
// Returns every catalogued provider, whether it is configured, and exactly what
// an operator still has to do. Deliberately read-only: a provider is onboarded
// by setting its environment variable at deploy time, never by POSTing a key to
// an endpoint. That keeps credentials out of the database, out of request logs
// and out of the browser.
//
// The response contains env var NAMES and masked key fragments only.
// ============================================================

const AI_PROVIDER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'AI_OFFICER'] as const;

export const GET = withAuth(async () => {
  const providers = listProviderStatus();
  return NextResponse.json({
    providers,
    // Paid and credential-based providers the catalog refuses to carry, with the
    // reason, so the operator sees the decision instead of wondering what is missing.
    excluded: EXCLUDED_PROVIDERS,
    summary: {
      total: providers.length,
      configured: providers.filter((p) => p.configured && !p.blocker).length,
      official: providers.filter((p) => p.provenance === 'official').length,
      unofficialBlocked: providers.filter((p) => p.provenance === 'unofficial-proxy').length,
      // PAID_AI_API_ALLOWED=false: nothing in this catalog can bill anyone.
      paidAllowed: false,
    },
    onboardingNote:
      'Set the listed environment variable on the server to connect a provider. ' +
      'No API key is ever accepted through this API.',
  });
}, { requireUserTypes: [...AI_PROVIDER_ROLES] });
