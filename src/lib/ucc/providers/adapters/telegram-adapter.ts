// ============================================================
// Telegram Bot API Adapter — reference implementation
// src/lib/ucc/providers/adapters/telegram-adapter.ts
//
// A concrete adapter proving the BaseProviderAdapter contract works against
// a real official API shape. Telegram Bot API uses a static bot token (no
// OAuth) and a secret_token webhook handshake.
//
// HONESTY: this adapter implements the request/response SHAPES from the
// official Bot API. It performs real HTTPS calls when a bot token is
// configured; it has NOT been live-verified in this environment (no bot
// token, sandbox egress blocked). Status is therefore CODE_COMPLETE /
// CONFIGURATION_REQUIRED, never LIVE_TEST_VERIFIED.
// ============================================================

import { BaseProviderAdapter, ok, fail } from '../base-adapter';
import { getProvider } from '../registry';
import type {
  DeliveryStatus,
  NormalizedContact,
  NormalizedMessage,
  ProviderCode,
  ProviderDefinition,
  ProviderResult,
  WebhookRequest,
} from '../types';
import { verifyTelegramSecret } from '../webhook-security';

const TELEGRAM_API = 'https://api.telegram.org';

export class TelegramAdapter extends BaseProviderAdapter {
  readonly code: ProviderCode = 'telegram';
  readonly definition: ProviderDefinition = getProvider('telegram');

  /** Bot token is injected at construction; never read from a global. */
  constructor(private readonly getToken: () => string | undefined) {
    super();
  }

  /** Telegram has no OAuth — decline honestly rather than fake a URL. */
  getAuthorizationUrl(): ProviderResult<{ url: string }> {
    return fail(
      'UNSUPPORTED_FEATURE',
      'telegram: Bot API uses a static bot token, not OAuth. Configure TELEGRAM_BOT_TOKEN server-side.',
      false
    );
  }

  async validateConnection(): Promise<ProviderResult<{ valid: boolean; externalAccountId?: string; accountName?: string }>> {
    const token = this.getToken();
    if (!token) return fail('CONFIGURATION', 'telegram: bot token not configured', false);
    const res = await this.call<{ id: number; username: string }>('getMe', {});
    if (!res.ok || !res.data) return fail(res.error?.class ?? 'INTERNAL', res.error?.message ?? 'getMe failed', false);
    return ok({ valid: true, externalAccountId: String(res.data.id), accountName: res.data.username });
  }

  async sendMessage(
    _token: string,
    to: string,
    message: NormalizedMessage
  ): Promise<ProviderResult<{ externalMessageId: string; deliveryStatus: DeliveryStatus }>> {
    const gated = this.gate<{ externalMessageId: string; deliveryStatus: DeliveryStatus }>(
      'send_messages',
      'sendMessage'
    );
    if (gated) return gated;
    const token = this.getToken();
    if (!token) return fail('CONFIGURATION', 'telegram: bot token not configured', false);
    const res = await this.call<{ message_id: number }>('sendMessage', {
      chat_id: to,
      text: message.text ?? '',
    });
    if (!res.ok || !res.data) return fail(res.error?.class ?? 'INTERNAL', res.error?.message ?? 'sendMessage failed', false);
    return ok({ externalMessageId: String(res.data.message_id), deliveryStatus: 'SENT' });
  }

  /**
   * Verify the webhook secret_token handshake. Telegram echoes the secret
   * we set via setWebhook in X-Telegram-Bot-Api-Secret-Token.
   */
  verifyWebhook(req: WebhookRequest): ProviderResult<{ verified: boolean; challenge?: string }> {
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
    const v = verifyTelegramSecret(req.headers['x-telegram-bot-api-secret-token'] ?? req.headers['X-Telegram-Bot-Api-Secret-Token'], expected);
    return v.verified ? ok({ verified: true }) : fail('WEBHOOK', v.reason ?? 'verification failed', false);
  }

  /** Normalize a Telegram Update into our canonical inbound message. */
  normalizeMessage(raw: unknown): NormalizedMessage | null {
    const update = raw as {
      message?: {
        message_id: number;
        date: number;
        text?: string;
        chat: { id: number; type: string };
        from?: { id: number };
      };
    };
    const m = update?.message;
    if (!m) return null;
    return {
      provider: 'telegram',
      connectedAccountId: String(m.chat.id),
      externalMessageId: String(m.message_id),
      externalConversationId: String(m.chat.id),
      externalContactId: m.from ? String(m.from.id) : undefined,
      direction: 'INBOUND',
      type: 'TEXT',
      text: m.text,
      timestamp: new Date(m.date * 1000).toISOString(),
      deliveryStatus: 'NOT_APPLICABLE',
    };
  }

  normalizeContact(raw: unknown): NormalizedContact | null {
    const u = raw as { id?: number; username?: string; first_name?: string };
    if (!u?.id) return null;
    return {
      provider: 'telegram',
      externalContactId: String(u.id),
      displayName: u.first_name ?? u.username,
    };
  }

  /** Thin wrapper over the Bot API HTTP surface. */
  private async call<T>(method: string, body: Record<string, unknown>): Promise<ProviderResult<T>> {
    const token = this.getToken();
    if (!token) return fail('CONFIGURATION', 'telegram: bot token not configured', false);
    try {
      const r = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await r.json()) as { ok: boolean; result?: T; description?: string; error_code?: number };
      if (!json.ok) {
        const cls = json.error_code === 429 ? 'RATE_LIMIT' : json.error_code === 401 ? 'AUTHENTICATION' : 'VALIDATION';
        return fail(cls as never, json.description ?? 'telegram api error', cls === 'RATE_LIMIT', String(json.error_code ?? ''));
      }
      return ok(json.result as T);
    } catch (e) {
      const err = this.handleProviderError(e);
      return { ok: false, error: err };
    }
  }
}
