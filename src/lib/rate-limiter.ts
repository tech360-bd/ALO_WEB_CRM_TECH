/**
 * Rate Limiter — ALO Education
 * Protects login, OTP, AI endpoints, WhatsApp send, document endpoints, admin settings, webhook
 */

const store = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  login: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 attempts per 15min
  otp: { windowMs: 10 * 60 * 1000, max: 5 },
  ai: { windowMs: 60 * 1000, max: 20 }, // 20 AI requests per minute
  whatsapp_send: { windowMs: 60 * 1000, max: 30 },
  document: { windowMs: 60 * 1000, max: 50 },
  admin_settings: { windowMs: 60 * 1000, max: 30 },
  webhook: { windowMs: 60 * 1000, max: 100 }, // Allow high for WhatsApp traffic
};

export function checkRateLimit(key: string, type: keyof typeof DEFAULT_LIMITS = 'webhook'): { allowed: boolean; remaining: number; resetAt: number } {
  const config = DEFAULT_LIMITS[type] || DEFAULT_LIMITS.webhook;
  const now = Date.now();
  const storeKey = `${type}:${key}`;

  const existing = store.get(storeKey);

  if (!existing || now > existing.resetAt) {
    store.set(storeKey, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, resetAt: now + config.windowMs };
  }

  if (existing.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  store.set(storeKey, existing);
  return { allowed: true, remaining: config.max - existing.count, resetAt: existing.resetAt };
}

export function rateLimitMiddleware(req: Request, type: keyof typeof DEFAULT_LIMITS = 'webhook'): Response | null {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const result = checkRateLimit(ip, type);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetAt),
        },
      }
    );
  }

  return null;
}

// Cleanup old entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (now > value.resetAt) store.delete(key);
    }
  }, 10 * 60 * 1000);
}
