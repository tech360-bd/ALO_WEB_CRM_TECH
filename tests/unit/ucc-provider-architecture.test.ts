// ============================================================
// Unified Communication Center — provider architecture tests
// Verifies the honest-status engine cannot fake a verified state,
// the capability registry refuses unsupported operations, and the
// base adapter never fabricates a provider success.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  PROVIDER_REGISTRY,
  PROVIDER_ORDER,
  isCapabilitySupportedByProvider,
  isCapabilityImplemented,
  explainUnsupported,
  computeIntegrationStatus,
  computeOAuthStatus,
  computeWebhookStatus,
  computeLiveTestStatus,
  mayShowAsConnected,
  statusColour,
  providerImplementationSummary,
  type ConnectionFacts,
} from '@/lib/ucc/providers';
import { BaseProviderAdapter } from '@/lib/ucc/providers/base-adapter';
import { TelegramAdapter } from '@/lib/ucc/providers/adapters/telegram-adapter';

function facts(overrides: Partial<ConnectionFacts> = {}): ConnectionFacts {
  return {
    provider: 'whatsapp',
    configurationPresent: true,
    credentialsPresent: true,
    oauthCompleted: true,
    webhookConfigured: true,
    providerApprovalRequired: false,
    providerApproved: false,
    notSupported: false,
    ...overrides,
  };
}

describe('provider capability registry', () => {
  it('declares every provider in the canonical order', () => {
    for (const code of PROVIDER_ORDER) {
      expect(PROVIDER_REGISTRY[code]).toBeDefined();
      expect(PROVIDER_REGISTRY[code].code).toBe(code);
    }
  });

  it('marks LinkedIn/YouTube/Google/Telegram DMs as NOT_SUPPORTED by the official API', () => {
    // These providers genuinely have no consumer-messaging API. The registry
    // must say NOT_SUPPORTED, never silently "not implemented" (mandate §53).
    expect(isCapabilitySupportedByProvider('linkedin', 'send_messages')).toBe(false);
    expect(isCapabilitySupportedByProvider('youtube', 'receive_messages')).toBe(false);
    expect(isCapabilitySupportedByProvider('google_business', 'send_messages')).toBe(false);
    expect(isCapabilitySupportedByProvider('telegram', 'oauth')).toBe(false);
  });

  it('explains WHY an unsupported capability is unsupported', () => {
    const why = explainUnsupported('linkedin', 'receive_messages');
    expect(why).toMatch(/NOT SUPPORTED BY OFFICIAL API/);
    // A supported capability returns no "unsupported" explanation.
    expect(explainUnsupported('whatsapp', 'send_messages')).toBeNull();
  });

  it('never marks any provider implementation as verified at rest', () => {
    // The registry is a code-state map; it must not assert live verification.
    for (const code of PROVIDER_ORDER) {
      const summary = providerImplementationSummary(code);
      expect(['CODE_COMPLETE', 'NOT_STARTED']).toContain(summary.headline);
      expect(summary.headline).not.toMatch(/VERIFIED/);
    }
  });
});

describe('honest status engine (mandate §83, §117)', () => {
  it('returns CONFIGURATION_REQUIRED when nothing is configured', () => {
    const s = computeIntegrationStatus(
      facts({ configurationPresent: false, credentialsPresent: false, oauthCompleted: false, webhookConfigured: false })
    );
    expect(s).toBe('CONFIGURATION_REQUIRED');
  });

  it('returns OAUTH_REQUIRED when config exists but no OAuth', () => {
    const s = computeIntegrationStatus(
      facts({ oauthCompleted: false, webhookConfigured: false })
    );
    expect(s).toBe('OAUTH_REQUIRED');
  });

  it('REFUSES to show OAUTH_VERIFIED without OAuth evidence', () => {
    // OAuth completed but NO evidence record => only OAUTH_CONFIGURED.
    const s = computeIntegrationStatus(facts({ webhookConfigured: false }), {});
    expect(s).not.toBe('OAUTH_VERIFIED');
    expect(s).toBe('OAUTH_CONFIGURED');
  });

  it('reports OAUTH_VERIFIED on the OAuth axis only when OAuth evidence exists', () => {
    const noEv = computeOAuthStatus(facts({ webhookConfigured: false }), {});
    const withEv = computeOAuthStatus(facts({ webhookConfigured: false }), {
      oauth: { verifiedAt: new Date().toISOString(), kind: 'oauth', environment: 'PRODUCTION' },
    });
    expect(noEv).toBe('OAUTH_CONFIGURED');
    expect(withEv).toBe('OAUTH_VERIFIED');
  });

  it('advances the overall status to WEBHOOK_REQUIRED once OAuth is verified', () => {
    // OAuth verified, but the provider supports webhooks and none is configured:
    // the honest headline is the NEXT unmet gate, not the rosier OAuth state.
    const s = computeIntegrationStatus(facts({ webhookConfigured: false }), {
      oauth: { verifiedAt: new Date().toISOString(), kind: 'oauth', environment: 'PRODUCTION' },
    });
    expect(s).toBe('WEBHOOK_REQUIRED');
  });

  it('REFUSES LIVE_TEST_VERIFIED without live-message evidence', () => {
    // Fully configured + all evidence EXCEPT a real live message.
    const s = computeIntegrationStatus(facts(), {
      oauth: { verifiedAt: 't', kind: 'oauth', environment: 'PRODUCTION' },
      webhook: { verifiedAt: 't', kind: 'webhook', environment: 'PRODUCTION' },
    });
    expect(s).not.toBe('LIVE_TEST_VERIFIED');
    expect(s).toBe('LIVE_TEST_PENDING');
  });

  it('returns LIVE_TEST_VERIFIED only with live-message evidence', () => {
    const s = computeIntegrationStatus(facts(), {
      oauth: { verifiedAt: 't', kind: 'oauth', environment: 'PRODUCTION' },
      webhook: { verifiedAt: 't', kind: 'webhook', environment: 'PRODUCTION' },
      liveMessage: { verifiedAt: 't', kind: 'live_message', environment: 'PRODUCTION' },
    });
    expect(s).toBe('LIVE_TEST_VERIFIED');
  });

  it('surfaces PROVIDER_APPROVAL_REQUIRED as the blocking status', () => {
    const s = computeIntegrationStatus(
      facts({ provider: 'linkedin', providerApprovalRequired: true, providerApproved: false })
    );
    expect(s).toBe('PROVIDER_APPROVAL_REQUIRED');
  });

  it('surfaces ERROR above rosier signals', () => {
    const s = computeIntegrationStatus(facts({ hasError: true }), {
      liveMessage: { verifiedAt: 't', kind: 'live_message', environment: 'PRODUCTION' },
    });
    expect(s).toBe('ERROR');
  });

  it('never lets a non-verified status render as connected/green', () => {
    expect(mayShowAsConnected('LIVE_TEST_PENDING')).toBe(false);
    expect(mayShowAsConnected('OAUTH_CONFIGURED')).toBe(false);
    expect(mayShowAsConnected('WEBHOOK_CONFIGURED')).toBe(false);
    expect(mayShowAsConnected('LIVE_TEST_VERIFIED')).toBe(true);
    // Colour discipline (§47): green only for verified.
    expect(statusColour('LIVE_TEST_PENDING')).toBe('YELLOW');
    expect(statusColour('CONFIGURATION_REQUIRED')).toBe('YELLOW');
    expect(statusColour('ERROR')).toBe('RED');
    expect(statusColour('NOT_STARTED')).toBe('GRAY');
    expect(statusColour('LIVE_TEST_VERIFIED')).toBe('GREEN');
  });

  it('skips the webhook axis for providers without webhook support', () => {
    // Email has webhook=NO; status must not demand WEBHOOK_REQUIRED.
    const s = computeIntegrationStatus(
      facts({ provider: 'email', webhookConfigured: false }),
      { oauth: { verifiedAt: 't', kind: 'oauth', environment: 'PRODUCTION' } }
    );
    expect(s).not.toBe('WEBHOOK_REQUIRED');
  });
});

describe('base adapter anti-fake guard', () => {
  class EmptyAdapter extends BaseProviderAdapter {
    readonly code = 'telegram' as const;
    readonly definition = PROVIDER_REGISTRY.telegram;
  }

  it('declines an operation the provider does not support as UNSUPPORTED_FEATURE', async () => {
    const a = new EmptyAdapter();
    // Telegram has no OAuth — must be UNSUPPORTED_FEATURE, not a fake URL.
    const url = a.getAuthorizationUrl({ redirectUri: 'https://x/cb', scopes: [], csrf: 's' });
    expect(url.ok).toBe(false);
    expect(url.error?.class).toBe('UNSUPPORTED_FEATURE');
  });

  it('returns notImplemented (never a fake success) for a supported-but-unwired op', async () => {
    const a = new EmptyAdapter();
    const res = await a.sendMessage('tok', '123', {
      provider: 'telegram',
      connectedAccountId: '123',
      externalMessageId: 'x',
      direction: 'OUTBOUND',
      type: 'TEXT',
      text: 'hi',
      timestamp: new Date().toISOString(),
      deliveryStatus: 'QUEUED',
    });
    expect(res.ok).toBe(false);
    // Telegram DOES support send_messages, so this is "not implemented", not "unsupported".
    expect(res.error?.class).toBe('CONFIGURATION');
    expect(res.error?.message).toMatch(/not yet implemented/);
  });

  it('normalizers return null on unknown shapes rather than inventing data', () => {
    const a = new EmptyAdapter();
    expect(a.normalizeMessage({ unexpected: true })).toBeNull();
    expect(a.normalizeContact({})).toBeNull();
  });
});

describe('telegram reference adapter', () => {
  it('normalizes a real Telegram Update shape', () => {
    const a = new TelegramAdapter(() => 'token');
    const msg = a.normalizeMessage({
      message: {
        message_id: 42,
        date: 1700000000,
        text: 'hello',
        chat: { id: 999, type: 'private' },
        from: { id: 555 },
      },
    });
    expect(msg).not.toBeNull();
    expect(msg?.externalMessageId).toBe('42');
    expect(msg?.externalContactId).toBe('555');
    expect(msg?.direction).toBe('INBOUND');
    expect(msg?.text).toBe('hello');
  });

  it('declines OAuth honestly (Bot API uses a static token)', () => {
    const a = new TelegramAdapter(() => 'token');
    const url = a.getAuthorizationUrl();
    expect(url.ok).toBe(false);
    expect(url.error?.class).toBe('UNSUPPORTED_FEATURE');
    expect(url.error?.message).toMatch(/static bot token/i);
  });

  it('fails sendMessage with CONFIGURATION when no token is configured', async () => {
    const a = new TelegramAdapter(() => undefined);
    const res = await a.sendMessage('ignored', '123', {
      provider: 'telegram',
      connectedAccountId: '123',
      externalMessageId: 'x',
      direction: 'OUTBOUND',
      type: 'TEXT',
      text: 'hi',
      timestamp: new Date().toISOString(),
      deliveryStatus: 'QUEUED',
    });
    expect(res.ok).toBe(false);
    expect(res.error?.class).toBe('CONFIGURATION');
  });

  it('reports implementation summary as CODE_COMPLETE, never VERIFIED', () => {
    expect(isCapabilityImplemented('telegram', 'send_messages')).toBe(false);
    const summary = providerImplementationSummary('telegram');
    expect(summary.headline).not.toMatch(/VERIFIED/);
  });
});
