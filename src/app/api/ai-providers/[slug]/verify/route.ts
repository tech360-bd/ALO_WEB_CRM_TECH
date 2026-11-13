import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { generateText } from '@/lib/ai';
import { isFreeProviderSlug } from '@/lib/ai-providers/catalog';
import { ProviderConfigurationError } from '@/lib/ai-providers/resolve';

// ============================================================
// POST /api/ai-providers/[slug]/verify — prove a free tier actually works
//
// Named "verify" rather than "test" because .gitignore carries a bare `test`
// pattern that matches a path segment at any depth, which would have silently
// kept this file out of every commit.
//
// A catalog entry is a claim about a provider. This endpoint turns it into
// evidence: it sends one tiny request through the same code path production uses
// (src/lib/ai.ts requestText) and reports the outcome, so an operator can
// confirm connectivity before the system depends on it.
//
// It returns latency and a boolean. It never returns the key, the prompt, or the
// provider's response body.
// ============================================================

const AI_PROVIDER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'AI_OFFICER'] as const;

export const POST = withAuth(async (
  _request: Request,
  _auth,
  context?: { params: Promise<{ slug: string }> },
) => {
  const { slug } = (await context?.params) ?? { slug: '' };

  if (!isFreeProviderSlug(slug)) {
    return NextResponse.json(
      { ok: false, error: `Unknown provider "${slug}". It must be catalogued with its free-tier details first.` },
      { status: 404 },
    );
  }

  const started = Date.now();
  try {
    // One short request, capped, so a test cannot burn a free daily quota or run
    // up tokens on a one-time-credit provider.
    const result = await generateText({
      provider: slug,
      prompt: 'Reply with the single word: ready',
      maxTokens: 8,
      temperature: 0,
      timeoutMs: 20_000,
    });
    return NextResponse.json({
      ok: true,
      slug,
      provider: result.provider,
      model: result.model,
      latencyMs: Date.now() - started,
      usage: result.usage ?? null,
    });
  } catch (error) {
    // A configuration problem is the operator's to fix and gets a 422; anything
    // else (HTTP error, timeout, schema failure) is reported as a failed test
    // rather than a server fault, because the caller asked for a probe.
    const isConfig = error instanceof ProviderConfigurationError;
    return NextResponse.json(
      {
        ok: false,
        slug,
        latencyMs: Date.now() - started,
        error: error instanceof Error ? error.message : 'Provider test failed',
        // resolveFreeProvider already resolves the slug, so a config error here
        // means the key or endpoint is missing — surface which one is actionable.
        actionable: isConfig,
      },
      { status: isConfig ? 422 : 200 },
    );
  }
}, { requireUserTypes: [...AI_PROVIDER_ROLES] });
