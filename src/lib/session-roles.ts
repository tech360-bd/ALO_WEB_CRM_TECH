/**
 * Session-role vocabulary shared by the proxy route guard (`src/proxy.ts`) and
 * the portal login handler (`src/app/api/portal-auth/login/route.ts`).
 *
 * WHY THIS MODULE EXISTS
 * ----------------------
 * The login handler minted the session role by upper-casing a value from its
 * own `crmRoleMap`, while the proxy authorised against its own `ROLE_ROUTES`
 * keys. Nothing tied the two vocabularies together, so they drifted: `crmRoleMap`
 * emitted `hr` and `support_agent`, the proxy only knew `HR_MANAGER` and
 * `SUPPORT_STAFF`. For an unrecognised role `ROLE_ROUTES[token.role]` is
 * `undefined`, so *every* portal page failed the allow-list check and the proxy
 * redirected to `getDashboardRoute()`'s `default` branch — `"/"`. HR and Support
 * staff were therefore dumped on the public homepage from their own dashboards,
 * with no error message anywhere.
 *
 * Both files now resolve roles through here, and
 * `tests/unit/session-role-vocabulary.test.ts` fails the build if a role the
 * login handler can emit is missing from the proxy's allow-list.
 */

/**
 * Every session role the proxy can authorise. Must stay in sync with the
 * `ROLE_ROUTES` keys in `src/proxy.ts`; the regression test enforces it.
 */
export const SESSION_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'COUNSELOR',
  'APPLICATION_TEAM',
  'EMPLOYEE',
  'VISA_OFFICER',
  'VISA_INTERVIEW_OFFICER',
  'MARKETING_MANAGER',
  'MARKETING',
  'FINANCE',
  'HR_MANAGER',
  'BRANCH_MANAGER',
  'FRONT_DESK',
  'SUPPORT_STAFF',
  'PARTNER',
  'STUDENT',
  'ENGLISH_TRAINER',
  'MOCK_TEST_ADMIN',
] as const;

export type SessionRole = (typeof SESSION_ROLES)[number];

const KNOWN: ReadonlySet<string> = new Set(SESSION_ROLES);

export function isKnownSessionRole(role: string | null | undefined): role is SessionRole {
  return !!role && KNOWN.has(role);
}

/**
 * CRM role aliases that resolve to a canonical session role.
 *
 * Only aliases whose permission grants are PROVABLY identical to the canonical
 * role are listed, so normalising them cannot widen anyone's access. Evidence —
 * `prisma/seed-rbac.ts` resolves both spellings of each pair through the same
 * `DEFAULT_ROLE_PERMISSIONS` entry (or the same `grantModules` list), which was
 * verified by diffing the resolved grant sets:
 *
 *   hr              vs hr_manager        14/14 grants identical
 *   support_agent   vs support_staff      9/9  grants identical
 *   finance         vs finance_officer   12/12 grants identical
 *   marketing       vs marketing_manager 14/14 grants identical
 *
 * Roles with no proven equivalent (CEO, DOCUMENT_OFFICER, DATA_MANAGER,
 * AI_MANAGER, PARTNER_MANAGER) are deliberately NOT mapped here. Inventing a
 * route allow-list for them would be a permission grant disguised as a bug fix;
 * they fall back to the baseline staff role instead, which is the access their
 * `Employee` record already implies.
 */
export const CRM_ROLE_ALIASES: Readonly<Record<string, SessionRole>> = {
  hr: 'HR_MANAGER',
  support_agent: 'SUPPORT_STAFF',
  // `finance_officer` is a seeded legacy alias whose grants match FINANCE
  // exactly (12/12). `marketing` is deliberately NOT aliased to
  // MARKETING_MANAGER even though their grants also match: MARKETING is itself a
  // canonical session role, and aliasing it would silently promote marketing
  // staff to the manager role. normalizeCrmRole resolves canonical roles before
  // consulting this map, and a test asserts no key collides with SESSION_ROLES.
  finance_officer: 'FINANCE',
};

/**
 * Normalise a CRM role slug (`branch_manager`) to a session role
 * (`BRANCH_MANAGER`), applying the proven-equivalent aliases above.
 *
 * The result is NOT guaranteed to be a role the proxy knows — callers must
 * still check `isKnownSessionRole` before relying on it.
 */
export function normalizeCrmRole(crmRole: string | null | undefined): string | null {
  if (!crmRole) return null;
  const key = crmRole.trim().toLowerCase();
  if (!key) return null;
  // A canonical role always wins over an alias. Without this precedence an alias
  // key that happens to match a canonical role name (MARKETING vs marketing)
  // would rewrite it, silently changing that role's access.
  const upper = key.toUpperCase();
  if (KNOWN.has(upper)) return upper;
  return CRM_ROLE_ALIASES[key] ?? upper;
}

/**
 * Resolve a role claim read back off an existing session token.
 *
 * Page-session JWTs live for 7 days, so tokens minted before the alias fix still
 * carry `HR` / `SUPPORT_AGENT`. Resolving at request time keeps those staff
 * working without forcing a re-login, and is idempotent for canonical roles
 * (the alias keys are legacy slugs only, so `HR_MANAGER` resolves to itself).
 */
export function resolveSessionRole(raw: string | null | undefined): string {
  return normalizeCrmRole(raw) ?? '';
}

/**
 * Derive the role claim stored in the page-session JWT.
 *
 * Non-staff user types keep their `userType` verbatim. Staff types use their
 * CRM role when the proxy can resolve it, and otherwise fall back to the
 * baseline `EMPLOYEE` role rather than emitting an unresolvable string.
 *
 * The fallback is a deliberate fail-safe, not a grant: `EMPLOYEE` is already
 * the role every staff account holds by virtue of its `Employee` record, and it
 * resolves to the `/employee` workspace. Emitting an unknown role instead left
 * the user with an empty allow-list, which is how the homepage bounce happened.
 */
export function pageSessionRole(userType: string, crmRole: string | null): string {
  if (
    userType === 'SUPER_ADMIN' ||
    userType === 'ADMIN' ||
    userType === 'PARTNER' ||
    userType === 'STUDENT'
  ) {
    return userType;
  }
  const candidate = normalizeCrmRole(crmRole);
  if (isKnownSessionRole(candidate)) return candidate;
  return 'EMPLOYEE';
}

/** Use explicit persisted staff assignments; unknown and non-staff roles grant nothing. */
export function storedStaffRole(roleNames: readonly string[]): SessionRole | null {
  for (const name of roleNames) {
    const candidate = normalizeCrmRole(name);
    if (isKnownSessionRole(candidate) && candidate !== 'STUDENT' && candidate !== 'PARTNER') return candidate;
  }
  return null;
}
