// ============================================================
// Unified Communication Center — Provider Architecture barrel
// src/lib/ucc/providers/index.ts
//
// Public surface of the canonical provider-adapter architecture. Import
// from here rather than the individual modules so the contract stays
// single-sourced.
// ============================================================

export * from './types';
export * from './registry';
export * from './status';
export * from './webhook-security';
export { BaseProviderAdapter, ok, fail, unsupported, notImplemented } from './base-adapter';
export { TelegramAdapter } from './adapters/telegram-adapter';

import type { ProviderAdapter, ProviderCode } from './types';
import { TelegramAdapter } from './adapters/telegram-adapter';

/**
 * Adapter factory. Returns the concrete adapter for a provider, or null when
 * no adapter has been implemented yet. Callers MUST treat null as
 * NOT_IMPLEMENTED and never synthesise a stand-in (mandate §44, §103).
 *
 * Secret material is injected via getters so adapters never read globals
 * directly and can be unit-tested with mocks.
 */
export function createAdapter(
  code: ProviderCode,
  secrets: { telegramBotToken?: () => string | undefined } = {}
): ProviderAdapter | null {
  switch (code) {
    case 'telegram':
      return new TelegramAdapter(secrets.telegramBotToken ?? (() => process.env.TELEGRAM_BOT_TOKEN));
    default:
      // No adapter implemented for this provider yet. Honest null.
      return null;
  }
}

/** Which providers currently have a concrete adapter in code. */
export const IMPLEMENTED_ADAPTERS: ProviderCode[] = ['telegram'];
