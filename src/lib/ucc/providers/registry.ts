// ============================================================
// Unified Communication Center — Provider Capability Registry
// src/lib/ucc/providers/registry.ts
//
// Data-driven, single source of truth for what each provider's OFFICIAL
// API supports and what WE have implemented. Every entry is grounded in
// the provider research in docs/integrations/provider-research/*.md.
//
// RULES:
//  - `provider` = the official API's stance (verified against docs).
//  - `implementation` = our codebase's stance (honest; default NOT_IMPLEMENTED).
//  - NOT_SUPPORTED entries carry a `note` explaining WHY (mandate §53).
//  - Nothing here claims LIVE verification. Status is computed from
//    runtime evidence by status.ts, never hardcoded to *_VERIFIED.
// ============================================================

import type {
  Capability,
  CapabilityDeclaration,
  ProviderCode,
  ProviderDefinition,
  ProviderSupport,
  ImplementationStatus,
} from './types';

/** Helper to build a capability declaration concisely. */
function cap(
  capability: Capability,
  provider: ProviderSupport,
  implementation: ImplementationStatus = 'NOT_IMPLEMENTED',
  note?: string
): CapabilityDeclaration {
  return { capability, provider, implementation, note };
}

/**
 * The canonical registry. Ordered to match docs/integrations/PROVIDER-MATRIX.md.
 *
 * NOTE ON HONESTY: as of this commit no provider has completed live
 * verification in this environment (no credentials, sandbox egress blocked).
 * `implementation` values reflect the EXISTING codebase where adapters/routes
 * already exist (e.g. Meta/WhatsApp webhook receive) and NOT_IMPLEMENTED
 * elsewhere. Nothing is marked LIVE_TEST_VERIFIED.
 */
export const PROVIDER_REGISTRY: Record<ProviderCode, ProviderDefinition> = {
  email: {
    code: 'email',
    name: 'Email (SMTP / IMAP)',
    category: 'email',
    apiVersion: 'SMTP (RFC 5321) / IMAP (RFC 3501)',
    portalUrl: 'https://datatracker.ietf.org/doc/html/rfc5321',
    approvalRequired: false,
    capabilities: [
      cap('oauth', 'PARTIAL', 'NOT_IMPLEMENTED', 'Modern providers (Google/Microsoft) require OAuth2; plain SMTP uses app-passwords. Choose one official transport.'),
      cap('token_refresh', 'PARTIAL', 'NOT_IMPLEMENTED', 'Only for OAuth2 transports (Google/M365).'),
      cap('webhook', 'NO', 'NOT_APPLICABLE', 'Inbound email arrives via IMAP polling or provider push (e.g. SendGrid Inbound Parse), not a universal webhook.'),
      cap('signature_validation', 'PARTIAL', 'NOT_IMPLEMENTED', 'DKIM/SPF/DMARC verification where the provider exposes it.'),
      cap('receive_messages', 'YES', 'NOT_IMPLEMENTED', 'Via IMAP or provider inbound-parse webhook.'),
      cap('send_messages', 'YES', 'NOT_IMPLEMENTED', 'Via SMTP relay or provider send API.'),
      cap('attachments', 'YES', 'NOT_IMPLEMENTED'),
      cap('conversation', 'YES', 'NOT_IMPLEMENTED', 'Threading via Message-ID / In-Reply-To headers.'),
      cap('account_management', 'YES', 'NOT_IMPLEMENTED'),
      cap('revocation', 'PARTIAL', 'NOT_IMPLEMENTED', 'Revoke app-password / OAuth grant at the provider.'),
      cap('analytics', 'PARTIAL', 'NOT_IMPLEMENTED', 'Delivery/bounce via provider webhooks where available.'),
      cap('live_test', 'YES', 'NOT_IMPLEMENTED'),
    ],
  },

  whatsapp: {
    code: 'whatsapp',
    name: 'WhatsApp Business Cloud API',
    category: 'messaging',
    apiVersion: 'Graph API v21.0',
    portalUrl: 'https://developers.facebook.com/docs/whatsapp',
    approvalRequired: true,
    approvalNote: 'Business verification + display-name approval required for production messaging beyond the test number.',
    capabilities: [
      cap('oauth', 'YES', 'NOT_IMPLEMENTED', 'Via Meta Login / Business Login (System User token also supported).'),
      cap('token_refresh', 'YES', 'NOT_IMPLEMENTED', 'Long-lived tokens ~60 days.'),
      cap('webhook', 'YES', 'PARTIAL', 'Existing /api/crm/ucc/webhooks/[provider] handles Meta verification + payload.'),
      cap('signature_validation', 'YES', 'NOT_IMPLEMENTED', 'X-Hub-Signature-256 HMAC over raw body.'),
      cap('receive_messages', 'YES', 'PARTIAL', 'Inbound parse present in webhook dispatcher.'),
      cap('send_messages', 'YES', 'NOT_IMPLEMENTED', 'Session messages within 24h window; templates outside it.'),
      cap('attachments', 'YES', 'NOT_IMPLEMENTED', 'Media via uploaded media id.'),
      cap('conversation', 'YES', 'NOT_IMPLEMENTED'),
      cap('comments', 'NOT_SUPPORTED', 'NOT_APPLICABLE', 'WhatsApp has no public comment surface.'),
      cap('account_management', 'YES', 'NOT_IMPLEMENTED', 'Phone number id / WABA id.'),
      cap('revocation', 'YES', 'NOT_IMPLEMENTED'),
      cap('analytics', 'PARTIAL', 'NOT_IMPLEMENTED', 'Delivery/read receipts via webhook statuses.'),
      cap('live_test', 'YES', 'NOT_IMPLEMENTED'),
    ],
  },

  facebook: {
    code: 'facebook',
    name: 'Facebook Pages / Messenger Platform',
    category: 'social',
    apiVersion: 'Graph API v21.0',
    portalUrl: 'https://developers.facebook.com/docs/messenger-platform',
    approvalRequired: true,
    approvalNote: 'App Review for pages_messaging, pages_read_engagement, pages_manage_posts; Business verification for advanced access.',
    capabilities: [
      cap('oauth', 'YES', 'NOT_IMPLEMENTED'),
      cap('token_refresh', 'YES', 'NOT_IMPLEMENTED', 'Long-lived page tokens can be non-expiring when derived from a long-lived user token.'),
      cap('webhook', 'YES', 'PARTIAL'),
      cap('signature_validation', 'YES', 'NOT_IMPLEMENTED', 'X-Hub-Signature-256.'),
      cap('receive_messages', 'YES', 'PARTIAL'),
      cap('send_messages', 'YES', 'NOT_IMPLEMENTED', 'Send API; 24h standard messaging window.'),
      cap('attachments', 'YES', 'NOT_IMPLEMENTED'),
      cap('conversation', 'YES', 'NOT_IMPLEMENTED'),
      cap('comments', 'YES', 'NOT_IMPLEMENTED', 'Page feed comments via Graph /{comment-id}.'),
      cap('account_management', 'YES', 'NOT_IMPLEMENTED'),
      cap('revocation', 'YES', 'NOT_IMPLEMENTED'),
      cap('publishing', 'YES', 'NOT_IMPLEMENTED', 'Page feed publishing via /{page-id}/feed.'),
      cap('advertising', 'YES', 'NOT_IMPLEMENTED', 'Marketing API (separate app permissions).'),
      cap('analytics', 'YES', 'NOT_IMPLEMENTED', 'Page Insights.'),
      cap('live_test', 'YES', 'NOT_IMPLEMENTED'),
    ],
  },

  messenger: {
    code: 'messenger',
    name: 'Facebook Messenger',
    category: 'messaging',
    apiVersion: 'Graph API v21.0',
    portalUrl: 'https://developers.facebook.com/docs/messenger-platform',
    approvalRequired: true,
    approvalNote: 'pages_messaging requires App Review; broadcasting requires message tags / sponsored messages per policy.',
    capabilities: [
      cap('oauth', 'YES', 'NOT_IMPLEMENTED'),
      cap('token_refresh', 'YES', 'NOT_IMPLEMENTED'),
      cap('webhook', 'YES', 'PARTIAL'),
      cap('signature_validation', 'YES', 'NOT_IMPLEMENTED'),
      cap('receive_messages', 'YES', 'PARTIAL'),
      cap('send_messages', 'YES', 'NOT_IMPLEMENTED'),
      cap('attachments', 'YES', 'NOT_IMPLEMENTED'),
      cap('conversation', 'YES', 'NOT_IMPLEMENTED'),
      cap('account_management', 'YES', 'NOT_IMPLEMENTED'),
      cap('revocation', 'YES', 'NOT_IMPLEMENTED'),
      cap('live_test', 'YES', 'NOT_IMPLEMENTED'),
    ],
  },

  instagram: {
    code: 'instagram',
    name: 'Instagram Business / Messenger API',
    category: 'social',
    apiVersion: 'Graph API v21.0',
    portalUrl: 'https://developers.facebook.com/docs/instagram-api',
    approvalRequired: true,
    approvalNote: 'instagram_basic + instagram_manage_messages require App Review; account must be Business/Creator linked to a Facebook Page.',
    capabilities: [
      cap('oauth', 'YES', 'NOT_IMPLEMENTED'),
      cap('token_refresh', 'YES', 'NOT_IMPLEMENTED'),
      cap('webhook', 'YES', 'PARTIAL'),
      cap('signature_validation', 'YES', 'NOT_IMPLEMENTED'),
      cap('receive_messages', 'YES', 'PARTIAL', 'Instagram Messaging API (DMs).'),
      cap('send_messages', 'YES', 'NOT_IMPLEMENTED', 'DMs within the 24h window.'),
      cap('attachments', 'YES', 'NOT_IMPLEMENTED'),
      cap('conversation', 'YES', 'NOT_IMPLEMENTED'),
      cap('comments', 'YES', 'NOT_IMPLEMENTED', 'Comment moderation via /{ig-comment-id}.'),
      cap('account_management', 'YES', 'NOT_IMPLEMENTED'),
      cap('revocation', 'YES', 'NOT_IMPLEMENTED'),
      cap('publishing', 'PARTIAL', 'NOT_IMPLEMENTED', 'Content Publishing API supports feed/reels/stories for Business accounts; some formats restricted.'),
      cap('analytics', 'YES', 'NOT_IMPLEMENTED', 'Instagram Insights.'),
      cap('live_test', 'YES', 'NOT_IMPLEMENTED'),
    ],
  },

  linkedin: {
    code: 'linkedin',
    name: 'LinkedIn (Community Management API)',
    category: 'professional',
    apiVersion: 'versioned=202506 (Community Management API)',
    portalUrl: 'https://learn.microsoft.com/en-us/linkedin/',
    approvalRequired: true,
    approvalNote: 'Marketing Developer Platform was sunset April 2024. Community Management API is partner-gated and MUST be the only product on the app. Organization scopes (rw_organization_admin, r_organization_social) require partner approval.',
    capabilities: [
      cap('oauth', 'YES', 'NOT_IMPLEMENTED', 'OAuth 2.0 + PKCE. Self-serve scopes: openid, profile, email, w_member_social (member posts only).'),
      cap('token_refresh', 'YES', 'NOT_IMPLEMENTED', 'Refresh tokens issued with offline_access.'),
      cap('webhook', 'PARTIAL', 'NOT_IMPLEMENTED', 'Organization social-action notifications only; Webhooks tab hidden until LinkedIn enables it for the app.'),
      cap('signature_validation', 'PARTIAL', 'NOT_IMPLEMENTED'),
      cap('receive_messages', 'NOT_SUPPORTED', 'NOT_APPLICABLE', 'LinkedIn Messaging API is closed; DMs are NOT available to partner apps. Do not claim messaging.'),
      cap('send_messages', 'NOT_SUPPORTED', 'NOT_APPLICABLE', 'No member-to-member messaging API. Only organization posts/comments.'),
      cap('attachments', 'PARTIAL', 'NOT_IMPLEMENTED', 'Media via Images API for organization posts.'),
      cap('conversation', 'PARTIAL', 'NOT_IMPLEMENTED', 'Comment threads on organization posts, not DMs.'),
      cap('comments', 'YES', 'NOT_IMPLEMENTED', 'Organization post comments via Community Management API.'),
      cap('account_management', 'PARTIAL', 'NOT_IMPLEMENTED', 'Organization pages the member administers.'),
      cap('revocation', 'YES', 'NOT_IMPLEMENTED'),
      cap('publishing', 'YES', 'NOT_IMPLEMENTED', 'Organization posts (r_organization_social + rw_organization_admin).'),
      cap('advertising', 'YES', 'NOT_IMPLEMENTED', 'Marketing Developer Platform (partner-gated).'),
      cap('analytics', 'YES', 'NOT_IMPLEMENTED', 'Organization social analytics.'),
      cap('live_test', 'YES', 'NOT_IMPLEMENTED'),
    ],
  },

  tiktok: {
    code: 'tiktok',
    name: 'TikTok for Developers',
    category: 'video',
    apiVersion: 'v2 (open.tiktokapis.com)',
    portalUrl: 'https://developers.tiktok.com/',
    approvalRequired: true,
    approvalNote: 'Login Kit + product approval. Content Posting requires app audit; dev mode forces SELF_ONLY privacy and caps at 5 authorizing accounts / 24h.',
    capabilities: [
      cap('oauth', 'YES', 'NOT_IMPLEMENTED', 'Login Kit OAuth 2.0 + PKCE.'),
      cap('token_refresh', 'YES', 'NOT_IMPLEMENTED', 'refresh_token grant.'),
      cap('webhook', 'PARTIAL', 'NOT_IMPLEMENTED', 'Webhooks available per connected product; signature verification required.'),
      cap('signature_validation', 'PARTIAL', 'NOT_IMPLEMENTED'),
      cap('receive_messages', 'NOT_SUPPORTED', 'NOT_APPLICABLE', 'No public DM API in TikTok for Developers.'),
      cap('send_messages', 'NOT_SUPPORTED', 'NOT_APPLICABLE', 'No public DM API.'),
      cap('attachments', 'PARTIAL', 'NOT_IMPLEMENTED', 'Video/photo via Content Posting API.'),
      cap('conversation', 'NOT_SUPPORTED', 'NOT_APPLICABLE'),
      cap('comments', 'PARTIAL', 'NOT_IMPLEMENTED', 'Research API only, and only for approved research use.'),
      cap('account_management', 'PARTIAL', 'NOT_IMPLEMENTED', 'Display API: user.info.basic, video.list.'),
      cap('revocation', 'YES', 'NOT_IMPLEMENTED'),
      cap('publishing', 'YES', 'NOT_IMPLEMENTED', 'Content Posting API: video.upload (inbox) / video.publish (direct, audited).'),
      cap('advertising', 'YES', 'NOT_IMPLEMENTED', 'TikTok Business API (business-api.tiktok.com), separate onboarding.'),
      cap('analytics', 'PARTIAL', 'NOT_IMPLEMENTED', 'Display API video metrics; ads via Business API.'),
      cap('live_test', 'YES', 'NOT_IMPLEMENTED'),
    ],
  },

  youtube: {
    code: 'youtube',
    name: 'YouTube Data API v3',
    category: 'video',
    apiVersion: 'v3',
    portalUrl: 'https://developers.google.com/youtube/v3',
    approvalRequired: true,
    approvalNote: 'OAuth consent screen verification; some scopes require a security audit (YouTube API Services Audit).',
    capabilities: [
      cap('oauth', 'YES', 'NOT_IMPLEMENTED', 'Google OAuth 2.0.'),
      cap('token_refresh', 'YES', 'NOT_IMPLEMENTED'),
      cap('webhook', 'PARTIAL', 'NOT_IMPLEMENTED', 'Pub/Sub push for some resources; otherwise polling.'),
      cap('signature_validation', 'PARTIAL', 'NOT_IMPLEMENTED', 'Pub/Sub JWT verification.'),
      cap('receive_messages', 'NOT_SUPPORTED', 'NOT_APPLICABLE', 'No DM surface. Comments are the inbound channel.'),
      cap('send_messages', 'NOT_SUPPORTED', 'NOT_APPLICABLE', 'No DM API. Reply to comments instead.'),
      cap('attachments', 'PARTIAL', 'NOT_IMPLEMENTED', 'Video upload via videos.insert (resumable).'),
      cap('conversation', 'PARTIAL', 'NOT_IMPLEMENTED', 'Comment threads.'),
      cap('comments', 'YES', 'NOT_IMPLEMENTED', 'commentThreads / comments.'),
      cap('account_management', 'YES', 'NOT_IMPLEMENTED', 'channels.list.'),
      cap('revocation', 'YES', 'NOT_IMPLEMENTED'),
      cap('publishing', 'YES', 'NOT_IMPLEMENTED', 'videos.insert; scheduled publishing via publishAt.'),
      cap('advertising', 'YES', 'NOT_IMPLEMENTED', 'Google Ads API (separate).'),
      cap('analytics', 'YES', 'NOT_IMPLEMENTED', 'YouTube Analytics API.'),
      cap('live_test', 'YES', 'NOT_IMPLEMENTED'),
    ],
  },

  google_business: {
    code: 'google_business',
    name: 'Google Business Profile APIs',
    category: 'local',
    apiVersion: 'v1 (reviews/posts still on mybusiness.googleapis.com/v4)',
    portalUrl: 'https://developers.google.com/my-business',
    approvalRequired: true,
    approvalNote: 'Per-GCP-project access request + approval; quota starts at zero. OAuth only (API keys rejected with 401). Q&A API shut down 2025-11-03.',
    capabilities: [
      cap('oauth', 'YES', 'NOT_IMPLEMENTED', 'Scope: https://www.googleapis.com/auth/business.manage.'),
      cap('token_refresh', 'YES', 'NOT_IMPLEMENTED'),
      cap('webhook', 'PARTIAL', 'NOT_IMPLEMENTED', 'Notifications API (Pub/Sub) for review updates where enabled.'),
      cap('signature_validation', 'PARTIAL', 'NOT_IMPLEMENTED', 'Pub/Sub JWT verification.'),
      cap('receive_messages', 'NOT_SUPPORTED', 'NOT_APPLICABLE', 'No consumer messaging API. Reviews are the inbound channel.'),
      cap('send_messages', 'NOT_SUPPORTED', 'NOT_APPLICABLE', 'No consumer messaging API. Reply to reviews instead.'),
      cap('attachments', 'PARTIAL', 'NOT_IMPLEMENTED', 'Photos via Business Information API; review media read-only.'),
      cap('conversation', 'PARTIAL', 'NOT_IMPLEMENTED', 'Review + reply threads.'),
      cap('comments', 'YES', 'NOT_IMPLEMENTED', 'Reviews: list/read/reply/delete-reply (mybusiness.googleapis.com/v4).'),
      cap('account_management', 'YES', 'NOT_IMPLEMENTED', 'Account Management + Business Information APIs.'),
      cap('revocation', 'YES', 'NOT_IMPLEMENTED'),
      cap('publishing', 'YES', 'NOT_IMPLEMENTED', 'Local Posts (standard/event/offer) via v4.'),
      cap('advertising', 'PARTIAL', 'NOT_IMPLEMENTED', 'Local campaigns via Google Ads API, not GBP.'),
      cap('analytics', 'YES', 'NOT_IMPLEMENTED', 'Business Profile Performance API v1 (fetchMultiDailyMetricsTimeSeries).'),
      cap('live_test', 'YES', 'NOT_IMPLEMENTED'),
    ],
  },

  telegram: {
    code: 'telegram',
    name: 'Telegram Bot API',
    category: 'messaging',
    apiVersion: 'Bot API 8.x',
    portalUrl: 'https://core.telegram.org/bots/api',
    approvalRequired: false,
    approvalNote: 'No app review. Create a bot via @BotFather; secure the webhook with secret_token.',
    capabilities: [
      cap('oauth', 'NO', 'NOT_APPLICABLE', 'Bot API uses a static bot token, not OAuth. (Telegram Login Widget is a separate user-auth product.)'),
      cap('token_refresh', 'NOT_SUPPORTED', 'NOT_APPLICABLE', 'Bot tokens do not expire; rotate via BotFather /revoke.'),
      cap('webhook', 'YES', 'NOT_IMPLEMENTED', 'setWebhook with secret_token header X-Telegram-Bot-Api-Secret-Token.'),
      cap('signature_validation', 'YES', 'NOT_IMPLEMENTED', 'secret_token comparison (constant-time).'),
      cap('receive_messages', 'YES', 'NOT_IMPLEMENTED'),
      cap('send_messages', 'YES', 'NOT_IMPLEMENTED', 'sendMessage and friends.'),
      cap('attachments', 'YES', 'NOT_IMPLEMENTED', 'sendPhoto/sendDocument/sendVideo/sendVoice.'),
      cap('conversation', 'YES', 'NOT_IMPLEMENTED', 'Chat id maps to a conversation.'),
      cap('comments', 'PARTIAL', 'NOT_IMPLEMENTED', 'Channel comments via linked discussion group.'),
      cap('account_management', 'YES', 'NOT_IMPLEMENTED', 'getMe / getChat.'),
      cap('revocation', 'YES', 'NOT_IMPLEMENTED', 'deleteWebhook + BotFather token revoke.'),
      cap('analytics', 'NO', 'NOT_APPLICABLE', 'No native analytics API.'),
      cap('live_test', 'YES', 'NOT_IMPLEMENTED'),
    ],
  },

  x: {
    code: 'x',
    name: 'X (Twitter) API v2',
    category: 'social',
    apiVersion: 'v2',
    portalUrl: 'https://docs.x.com/x-api',
    approvalRequired: true,
    approvalNote: 'As of Feb 2026 the default tier is pay-per-use (no free tier for new developers). Account Activity API webhooks: Pay-Per-Use = 1 webhook / 3 subscriptions; Enterprise = 5+ / 5000+.',
    capabilities: [
      cap('oauth', 'YES', 'NOT_IMPLEMENTED', 'OAuth 2.0 with PKCE (user context) or OAuth 1.0a; App-Only bearer for app context.'),
      cap('token_refresh', 'YES', 'NOT_IMPLEMENTED', 'OAuth 2.0 refresh tokens with offline.access scope.'),
      cap('webhook', 'YES', 'NOT_IMPLEMENTED', 'V2 Webhooks API + Account Activity API; CRC challenge-response at registration.'),
      cap('signature_validation', 'YES', 'NOT_IMPLEMENTED', 'x-twitter-webhooks-signature: sha256=<base64 HMAC-SHA256 of raw body with consumer secret>. No timestamp — no replay protection.'),
      cap('receive_messages', 'YES', 'NOT_IMPLEMENTED', 'direct_message_events via Account Activity API.'),
      cap('send_messages', 'YES', 'NOT_IMPLEMENTED', 'DM endpoints + post creation (dm.write, tweet.write).'),
      cap('attachments', 'YES', 'NOT_IMPLEMENTED', 'Media upload (v2).'),
      cap('conversation', 'YES', 'NOT_IMPLEMENTED', 'DM conversations + tweet reply threads.'),
      cap('comments', 'YES', 'NOT_IMPLEMENTED', 'Replies/mentions via tweet_create_events.'),
      cap('account_management', 'YES', 'NOT_IMPLEMENTED', 'users/me.'),
      cap('revocation', 'YES', 'NOT_IMPLEMENTED', 'user_event on deauthorization.'),
      cap('publishing', 'YES', 'NOT_IMPLEMENTED', 'POST /2/tweets.'),
      cap('advertising', 'PARTIAL', 'NOT_IMPLEMENTED', 'X Ads API is a separate product/contract.'),
      cap('analytics', 'PARTIAL', 'NOT_IMPLEMENTED', 'Public metrics on tweets; deeper metrics tier-gated.'),
      cap('live_test', 'YES', 'NOT_IMPLEMENTED'),
    ],
  },
};

/** Ordered list of provider codes for stable UI/matrix rendering. */
export const PROVIDER_ORDER: ProviderCode[] = [
  'email',
  'whatsapp',
  'facebook',
  'messenger',
  'instagram',
  'linkedin',
  'tiktok',
  'youtube',
  'google_business',
  'telegram',
  'x',
];

/** Look up a provider definition by code. */
export function getProvider(code: ProviderCode): ProviderDefinition {
  return PROVIDER_REGISTRY[code];
}

/**
 * Is a capability supported by the provider's official API at all?
 * Both `NO` and `NOT_SUPPORTED` mean the provider does not offer it — the
 * distinction is only explanatory (NOT_SUPPORTED = fundamentally absent,
 * NO = not offered in this product/tier). Used to prevent the UI from ever
 * offering an unsupported action.
 */
export function isCapabilitySupportedByProvider(
  code: ProviderCode,
  capability: Capability
): boolean {
  const decl = PROVIDER_REGISTRY[code].capabilities.find((c) => c.capability === capability);
  return !!decl && decl.provider !== 'NOT_SUPPORTED' && decl.provider !== 'NO';
}

/**
 * Has WE implemented a capability? Independent of provider support.
 */
export function isCapabilityImplemented(
  code: ProviderCode,
  capability: Capability
): boolean {
  const decl = PROVIDER_REGISTRY[code].capabilities.find((c) => c.capability === capability);
  return !!decl && (decl.implementation === 'IMPLEMENTED' || decl.implementation === 'PARTIAL');
}

/**
 * Guard against the classic dishonesty of labelling a provider capability
 * NOT_SUPPORTED as merely "not implemented". Returns a human explanation.
 */
export function explainUnsupported(
  code: ProviderCode,
  capability: Capability
): string | null {
  const decl = PROVIDER_REGISTRY[code].capabilities.find((c) => c.capability === capability);
  if (!decl) return `Capability '${capability}' is not declared for '${code}'.`;
  if (decl.provider === 'NOT_SUPPORTED' || decl.provider === 'NO') {
    return `NOT SUPPORTED BY OFFICIAL API: ${decl.note ?? 'no official endpoint exists'}`;
  }
  return null;
}
