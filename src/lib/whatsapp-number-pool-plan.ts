/**
 * Official WhatsApp sender pool — pure configuration layer.
 *
 * Split out of `whatsapp-number-pool.ts` so validation, seeding plans and
 * reconciliation can be unit-tested without booting a Prisma client. Nothing here
 * touches the database, and nothing here can claim a number is owned or registered
 * with Meta.
 *
 * Number values are deployment/operator configuration, not proof of ownership.
 */

/** Return canonical digits for a valid Bangladesh mobile number, or empty. */
export function normalizeBdPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  let digits = phone.trim().replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('01') && digits.length === 11) digits = `880${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith('1')) digits = `880${digits}`;
  return /^8801[3-9]\d{8}$/.test(digits) ? digits : '';
}

/** Normalize configured/input numbers to the local 01XXXXXXXXX display form. */
export function toBdDisplayPhone(phone: string): string {
  const normalized = normalizeBdPhone(phone);
  // `normalized` is E.164 without '+', i.e. 880 + 10 subscriber digits. Slice 3
  // removes the country code; slicing 2 left a stray leading 1 and produced
  // 001XXXXXXXXXX, which never matches a configured sender or an inbound number.
  return normalized ? `0${normalized.slice(3)}` : '';
}

function parseConfiguredList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return [...new Set(value.split(/[\s,;]+/).map(toBdDisplayPhone).filter(Boolean))];
}

// Empty values deliberately disable routing. Do not put guessed or example
// phone numbers in source code, environment templates, or seed data.
export const MAIN_NUMBER = toBdDisplayPhone(process.env.ALO_MAIN_WHATSAPP_NUMBER || '');
export const COO_NUMBER = toBdDisplayPhone(process.env.ALO_COO_WHATSAPP_NUMBER || '');
export const EMPLOYEE_POOL = parseConfiguredList(process.env.ALO_EMPLOYEE_WHATSAPP_NUMBERS)
  .filter((phone) => phone !== MAIN_NUMBER && phone !== COO_NUMBER);
export const OFFICIAL_NUMBERS = [...new Set([MAIN_NUMBER, COO_NUMBER, ...EMPLOYEE_POOL].filter(Boolean))];

export function getWhatsAppNumberConfigStatus() {
  const configuredRaw = [
    process.env.ALO_MAIN_WHATSAPP_NUMBER || '',
    process.env.ALO_COO_WHATSAPP_NUMBER || '',
    ...(process.env.ALO_EMPLOYEE_WHATSAPP_NUMBERS || '').split(/[\s,;]+/),
  ].map((value) => value.trim()).filter(Boolean);
  const validCount = configuredRaw.filter((value) => Boolean(toBdDisplayPhone(value))).length;
  return {
    configuredCount: OFFICIAL_NUMBERS.length,
    mainConfigured: Boolean(MAIN_NUMBER),
    urgentSupportConfigured: Boolean(COO_NUMBER),
    invalidConfiguredCount: configuredRaw.length - validCount,
  };
}


export function getPool(): { number: string; reason: string }[] {
  return OFFICIAL_NUMBERS.map((number) => ({ number, reason: 'operator_configured' }));
}


// ─────────────────────────────────────────────────────────────────────────────
// Pool planning and reconciliation (pure — no database, no environment)
// ─────────────────────────────────────────────────────────────────────────────
// Two separate questions, deliberately answered by two separate functions:
//
//   * `planPoolSeed`        — "what would seeding do to the registry?"
//   * `reconcilePool`       — "does runtime configuration agree with the registry,
//                              and which numbers are still unverified?"
//
// Both are pure so they can be tested without a database, and both refuse to treat
// a *configured* number as a *verified* one. Ownership of a number is a provider
// fact; nothing in this file can assert it.

export interface PoolSeedPlanEntry {
  phoneNumber: string;
  normalizedPhone: string;
  ownerType: 'ALO_MAIN' | 'COO' | 'EMPLOYEE' | 'BRANCH' | 'DEPARTMENT';
  displayName: string;
  isDefaultSender: boolean;
  isSupport247: boolean;
  connectionStatus: 'disconnected';
}

export interface PoolSeedPlan {
  ok: boolean;
  /** Rows that would be created. */
  create: PoolSeedPlanEntry[];
  /** Configured numbers already present in the registry — left exactly as they are. */
  skip: Array<{ phoneNumber: string; reason: string }>;
  /** Configured values that are not usable numbers, or that repeat another value. */
  rejected: Array<{ value: string; reason: string }>;
  /** Always true: seeding never establishes ownership or Meta registration. */
  requiresOwnershipVerification: true;
  summary: string;
}

/**
 * Decide what seeding the official pool would do.
 *
 * Existing rows are *skipped*, never updated: an administrator may have assigned the
 * number to an employee, a branch, or configured Meta identifiers, and a seed run must
 * not overwrite that (the SQL seed file enforces the same rule with a mostly no-op
 * `ON DUPLICATE KEY UPDATE`).
 */
export function planPoolSeed(input: {
  configured: string[];
  existing: Array<{ phoneNumber: string; normalizedPhone?: string }>;
}): PoolSeedPlan {
  const existingNormalized = new Set(
    input.existing.flatMap((row) => [normalizeBdPhone(row.phoneNumber), normalizeBdPhone(row.normalizedPhone || '')]).filter(Boolean),
  );

  const create: PoolSeedPlanEntry[] = [];
  const skip: Array<{ phoneNumber: string; reason: string }> = [];
  const rejected: Array<{ value: string; reason: string }> = [];
  const seen = new Set<string>();

  for (const raw of input.configured) {
    const display = toBdDisplayPhone(raw);
    const normalized = normalizeBdPhone(raw);
    if (!display || !normalized) {
      rejected.push({ value: String(raw), reason: 'Not a valid Bangladesh mobile number (expected 01XXXXXXXXX or 8801XXXXXXXXX).' });
      continue;
    }
    if (seen.has(normalized)) {
      rejected.push({ value: String(raw), reason: 'Duplicate: the same number is configured more than once.' });
      continue;
    }
    seen.add(normalized);

    if (existingNormalized.has(normalized)) {
      skip.push({ phoneNumber: display, reason: 'Already in the registry; existing assignment and verification status preserved.' });
      continue;
    }

    const isMain = display === MAIN_NUMBER;
    const isCoo = display === COO_NUMBER && !isMain;
    create.push({
      phoneNumber: display,
      normalizedPhone: normalized,
      ownerType: isMain ? 'ALO_MAIN' : isCoo ? 'COO' : 'EMPLOYEE',
      displayName: isMain ? 'Configured ALO main sender' : isCoo ? 'Configured urgent-support sender' : 'Configured employee sender',
      isDefaultSender: isMain,
      isSupport247: isCoo,
      connectionStatus: 'disconnected',
    });
  }

  return {
    ok: true,
    create,
    skip,
    rejected,
    requiresOwnershipVerification: true,
    summary:
      create.length === 0 && skip.length === 0
        ? 'No official numbers are configured, so seeding would create nothing. Configure ALO_MAIN_WHATSAPP_NUMBER / ALO_COO_WHATSAPP_NUMBER / ALO_EMPLOYEE_WHATSAPP_NUMBERS first.'
        : `Would create ${create.length} number(s), keep ${skip.length} existing row(s) untouched, reject ${rejected.length} value(s). Every created row starts disconnected.`,
  };
}

export interface PoolReconciliationEntry {
  phoneNumber: string;
  configuredInRuntime: boolean;
  registeredInDatabase: boolean;
  ownerType: string;
  connectionStatus: string;
  metaConfigured: boolean;
  /** Null when nothing is wrong. */
  issue: string | null;
}

export interface PoolReconciliation {
  ok: boolean;
  configuredCount: number;
  registeredCount: number;
  /** Configured but not in the registry: routing would select a number the DB cannot verify. */
  missingFromRegistry: string[];
  /** In the registry but not configured: it exists, yet the app may not use it to send. */
  notConfiguredInRuntime: string[];
  /** Registered but not verified with the provider: must stay blocked for live sending. */
  ownershipUnverified: string[];
  entries: PoolReconciliationEntry[];
  issues: string[];
  requiresOwnershipVerification: true;
  summary: string;
}

/**
 * Compare the runtime configuration with the registry.
 *
 * `verifiedPhoneNumbers` must come from a recent provider connection check. A number
 * absent from it is reported as unverified — never assumed working because it is
 * listed somewhere.
 */
export function reconcilePool(input: {
  configured: string[];
  registered: Array<{ phoneNumber: string; ownerType?: string; connectionStatus?: string; metaPhoneNumberId?: string | null }>;
  verifiedPhoneNumbers?: string[];
}): PoolReconciliation {
  const verified = new Set((input.verifiedPhoneNumbers ?? []).map((phone) => normalizeBdPhone(phone)).filter(Boolean));
  const configuredMap = new Map<string, string>();
  for (const phone of input.configured) {
    const normalized = normalizeBdPhone(phone);
    if (normalized && !configuredMap.has(normalized)) configuredMap.set(normalized, toBdDisplayPhone(phone));
  }
  const registeredMap = new Map<string, { phoneNumber: string; ownerType?: string; connectionStatus?: string; metaPhoneNumberId?: string | null }>();
  for (const row of input.registered) {
    const normalized = normalizeBdPhone(row.phoneNumber);
    if (normalized) registeredMap.set(normalized, row);
  }

  const entries: PoolReconciliationEntry[] = [];
  const missingFromRegistry: string[] = [];
  const notConfiguredInRuntime: string[] = [];
  const ownershipUnverified: string[] = [];
  const issues: string[] = [];

  const allPhones = new Set([...configuredMap.keys(), ...registeredMap.keys()]);
  for (const normalized of [...allPhones].sort()) {
    const configuredPhone = configuredMap.get(normalized);
    const registered = registeredMap.get(normalized);
    const isVerified = verified.has(normalized);
    const metaConfigured = Boolean(registered?.metaPhoneNumberId);
    let issue: string | null = null;

    if (configuredPhone && !registered) {
      missingFromRegistry.push(configuredPhone);
      issue = 'Configured for routing but absent from the registry: sending cannot be verified.';
    } else if (!configuredPhone && registered) {
      notConfiguredInRuntime.push(toBdDisplayPhone(registered.phoneNumber));
      issue = 'In the registry but not configured in the runtime environment, so routing will not select it.';
    }
    if (registered && !isVerified) {
      ownershipUnverified.push(toBdDisplayPhone(registered.phoneNumber));
      issue = issue || 'Ownership / Meta registration not verified recently: keep blocked for live sending.';
    }

    entries.push({
      phoneNumber: toBdDisplayPhone(registered?.phoneNumber || configuredPhone || normalized),
      configuredInRuntime: Boolean(configuredPhone),
      registeredInDatabase: Boolean(registered),
      ownerType: registered?.ownerType || '',
      connectionStatus: registered?.connectionStatus || 'not_registered',
      metaConfigured,
      issue,
    });
  }

  if (configuredMap.size === 0 && registeredMap.size === 0) {
    issues.push('No official numbers are configured or registered. Live WhatsApp sending is disabled by design.');
  }
  if (configuredMap.size === 0 && registeredMap.size > 0) {
    issues.push('The registry has numbers but the runtime configuration has none, so no route can select a sender.');
  }
  if (ownershipUnverified.length > 0) {
    issues.push(`${ownershipUnverified.length} registered number(s) have no recent provider verification and must remain blocked for sending.`);
  }
  if (missingFromRegistry.length > 0) {
    issues.push(`${missingFromRegistry.length} configured number(s) are missing from the registry; seed or register them before routing uses them.`);
  }

  return {
    ok: issues.length === 0,
    configuredCount: configuredMap.size,
    registeredCount: registeredMap.size,
    missingFromRegistry,
    notConfiguredInRuntime,
    ownershipUnverified,
    entries,
    issues,
    requiresOwnershipVerification: true,
    summary:
      issues.length === 0
        ? `Configuration and registry agree on ${registeredMap.size} number(s), all verified.`
        : `Configuration and registry do not fully agree: ${issues.length} issue(s) reported. No number is reported as working because it is listed.`,
  };
}

