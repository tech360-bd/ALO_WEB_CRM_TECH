const SAFE_CODE = /^[A-Z0-9_-]{1,32}$/;

/** Return only a short, non-secret error identifier from driver/Prisma errors. */
export function getSafeDatabaseErrorCode(error: unknown): string {
  let current = error;
  for (let depth = 0; depth < 3 && current && typeof current === 'object'; depth += 1) {
    if ('code' in current) {
      const candidate = (current as { code?: unknown }).code;
      if (typeof candidate === 'string' && SAFE_CODE.test(candidate)) return candidate;
      if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate >= 0 && candidate <= 99999) {
        return String(candidate);
      }
    }
    if ('meta' in current && current.meta && typeof current.meta === 'object' && 'code' in current.meta) {
      const candidate = (current.meta as { code?: unknown }).code;
      if (typeof candidate === 'string' && SAFE_CODE.test(candidate)) return candidate;
    }
    current = 'cause' in current ? current.cause : undefined;
  }
  return 'DATABASE_OPERATION_FAILED';
}

/** Log a useful server-side diagnostic without logging exception messages. */
export function logSafeDatabaseFailure(scope: string, error: unknown): string {
  const code = getSafeDatabaseErrorCode(error);
  console.error(`[${scope}] Database operation failed.`, { code });
  return code;
}

/** Preserve failure semantics without attaching the original secret-bearing error. */
export function throwSanitizedDatabaseFailure(
  scope: string,
  error: unknown,
  publicCode: string,
): never {
  logSafeDatabaseFailure(scope, error);
  throw new Error(publicCode);
}
