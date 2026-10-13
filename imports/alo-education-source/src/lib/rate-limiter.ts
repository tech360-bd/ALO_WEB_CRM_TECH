/**
 * In-memory login rate limiter.
 * Locks an email after MAX_ATTEMPTS failed logins for LOCKOUT_DURATION_MS.
 * No external dependencies (Redis, etc.). Resets on successful login.
 */

interface RateLimitEntry {
  attempts: number;
  lockedUntil: number | null; // epoch ms, null = not locked
  lastAttemptAt: number;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// In-memory store: email → entry
const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to avoid memory leaks (every 10 minutes)
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [email, entry] of store) {
    // Remove entries that are not locked and last attempted > 30 min ago
    if (!entry.lockedUntil && now - entry.lastAttemptAt > 30 * 60 * 1000) {
      store.delete(email);
    }
    // Remove expired locks that were locked > 30 min ago
    if (entry.lockedUntil && now - entry.lockedUntil > 15 * 60 * 1000) {
      store.delete(email);
    }
  }
}

// Start cleanup interval
if (typeof globalThis !== "undefined" && typeof setInterval !== "undefined") {
  setInterval(cleanup, CLEANUP_INTERVAL_MS);
}

/**
 * Check if login is allowed for the given email.
 * Returns `{ allowed: true }` or `{ allowed: false, retryAfterSeconds: number }`.
 */
export function checkLoginRateLimit(email: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const key = email.toLowerCase();
  const entry = store.get(key);

  if (!entry) return { allowed: true };

  const now = Date.now();

  // Check if currently locked out
  if (entry.lockedUntil && now < entry.lockedUntil) {
    const retryAfterSeconds = Math.ceil(
      (entry.lockedUntil - now) / 1000
    );
    return { allowed: false, retryAfterSeconds };
  }

  // Lockout expired, reset
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    store.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt. Returns the updated state.
 */
export function recordFailedLogin(email: string): {
  locked: boolean;
  retryAfterSeconds?: number;
} {
  const key = email.toLowerCase();
  const entry = store.get(key) || {
    attempts: 0,
    lockedUntil: null,
    lastAttemptAt: 0,
  };

  entry.attempts += 1;
  entry.lastAttemptAt = Date.now();

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    store.set(key, entry);
    return { locked: true, retryAfterSeconds: LOCKOUT_DURATION_MS / 1000 };
  }

  store.set(key, entry);
  return { locked: false };
}

/**
 * Reset rate limit on successful login.
 */
export function resetLoginRateLimit(email: string): void {
  store.delete(email.toLowerCase());
}

/**
 * Get current attempt count for an email (useful for UI feedback).
 */
export function getLoginAttempts(email: string): number {
  const entry = store.get(email.toLowerCase());
  return entry?.attempts || 0;
}
