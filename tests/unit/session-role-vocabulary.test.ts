/**
 * Regression coverage for the session-role vocabulary and the proxy's
 * public-route / fallback-dashboard contracts.
 *
 * Three production defects are locked down here. All three were silent: every
 * affected request returned HTTP 200, and nothing was logged.
 *
 *  1. `/course/{slug}` was missing from PUBLIC_ROUTES while `/courses` and
 *     `/course-finder` were present, so the canonical public course-detail hub
 *     redirected anonymous visitors (and the crawlers sitemap.ts sends there) to
 *     /login?callbackUrl=...
 *
 *  2. The login handler upper-cased its `crmRoleMap` values straight into the
 *     session claim, while the proxy authorised against its own `ROLE_ROUTES`
 *     keys. `hr` and `support_agent` produced `HR` and `SUPPORT_AGENT`, which
 *     the proxy did not know, so those staff got an empty allow-list and were
 *     redirected to the public homepage from their own dashboards.
 *
 *  3. `getDashboardRoute()` returned `/visa/dashboard`, `/finance/dashboard` and
 *     `/hrm/dashboard`. None of those pages exist, so Visa, Finance and HR staff
 *     hitting any route outside their allow-list got a 404 instead of their
 *     dashboard.
 *
 * Defect 2 and 3 are structural, so the assertions are derived from the real
 * source files rather than from a hand-maintained list: a new role or a new
 * fallback target that breaks either contract fails here.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROLE_ROUTES, getDashboardRoute, isPublicApiRequest, isPublicPageRequest } from '@/proxy';
import { CRM_ROLE_ALIASES, SESSION_ROLES, isKnownSessionRole, normalizeCrmRole, pageSessionRole, resolveSessionRole, storedStaffRole } from '@/lib/session-roles';

const ROOT = resolve(__dirname, '..', '..');

/**
 * Alias map declared in next.config.ts, from both `redirects()` and
 * `rewrites()` — e.g. /marketing/dashboard -> /crm/marketing (rewrite) and
 * /course -> /course-finder (redirect). Both stop a path from 404ing, so both
 * count here; the distinction matters for caching, not for reachability.
 */
function aliasMapFromConfig(): Map<string, string> {
  const src = readFileSync(resolve(ROOT, 'next.config.ts'), 'utf8');
  const aliases = new Map<string, string>();
  for (const fn of ['redirects', 'rewrites']) {
    const block = src.match(new RegExp(`async ${fn}\\(\\)[\\s\\S]*?\\n  \\},`));
    if (!block) continue;
    for (const m of block[0].matchAll(/source:\s*"([^"]+)"\s*,\s*destination:\s*"([^"]+)"/g)) {
      aliases.set(m[1], m[2]);
    }
  }
  if (aliases.size === 0) throw new Error('no redirects/rewrites parsed from next.config.ts');
  return aliases;
}

const ALIASES = aliasMapFromConfig();

/** Follow an alias chain to its first non-alias destination (loop-guarded). */
function resolveAlias(route: string): string {
  let current = route;
  for (let i = 0; i < 5 && ALIASES.has(current); i += 1) current = ALIASES.get(current)!;
  return current;
}

/** Does a route resolve to a real App Router page, after following aliases? */
function routeResolvesToAPage(route: string): boolean {
  const target = resolveAlias(route);
  const segments = target.split('/').filter(Boolean);
  // Walk the app directory, allowing dynamic segments to stand in for a literal.
  let dir = resolve(ROOT, 'src/app');
  for (const segment of segments) {
    const literal = resolve(dir, segment);
    if (existsSync(literal)) {
      dir = literal;
      continue;
    }
    const dynamic = existsSync(resolve(dir, '[slug]'))
      ? resolve(dir, '[slug]')
      : null;
    if (!dynamic) return false;
    dir = dynamic;
  }
  return existsSync(resolve(dir, 'page.tsx'));
}

describe('session-role vocabulary closure', () => {
  it('resolves every role the login handler can mint to a role the proxy knows', () => {
    const map = Object.fromEntries(SESSION_ROLES.map(role => [role, role]));
    const unresolved: string[] = [];
    for (const [email, crmRole] of Object.entries(map)) {
      // Staff accounts carry userType EMPLOYEE, which is the branch that
      // consults crmRole.
      const claim = pageSessionRole('EMPLOYEE', crmRole);
      if (!isKnownSessionRole(claim)) unresolved.push(`${email} -> ${crmRole} -> ${claim}`);
      expect(ROLE_ROUTES[claim], `${email}: ${claim} has no ROLE_ROUTES allow-list`).toBeDefined();
    }
    expect(unresolved, `unresolvable session roles: ${unresolved.join(', ')}`).toEqual([]);
  });

  it('uses persisted roles and rejects identities and non-staff assignments as authority', () => {
    expect(storedStaffRole([])).toBeNull();
    expect(storedStaffRole(['admin@alo.edu.bd'])).toBeNull();
    expect(storedStaffRole(['PARTNER', 'STUDENT', 'unknown'])).toBeNull();
    expect(storedStaffRole(['hr'])).toBe('HR_MANAGER');
    expect(storedStaffRole(['COUNSELOR'])).toBe('COUNSELOR');
    expect(storedStaffRole(['SUPER_ADMIN'])).toBe('SUPER_ADMIN');
  });

  it('has a ROLE_ROUTES allow-list for every declared session role', () => {
    for (const role of SESSION_ROLES) {
      expect(ROLE_ROUTES[role], `${role} is declared but the proxy cannot authorise it`).toBeDefined();
    }
  });

  it('maps the proven-equivalent CRM aliases onto the canonical roles', () => {
    // prisma/seed-rbac.ts resolves both spellings of each pair through the same
    // DEFAULT_ROLE_PERMISSIONS entry, so the grant sets are identical
    // (hr/hr_manager 14/14, support_agent/support_staff 9/9). Normalising them
    // is therefore permission-neutral.
    expect(normalizeCrmRole('hr')).toBe('HR_MANAGER');
    expect(normalizeCrmRole('support_agent')).toBe('SUPPORT_STAFF');
    expect(pageSessionRole('EMPLOYEE', 'hr')).toBe('HR_MANAGER');
    expect(pageSessionRole('EMPLOYEE', 'support_agent')).toBe('SUPPORT_STAFF');
  });

  it('is idempotent for canonical roles so existing sessions keep working', () => {
    for (const role of SESSION_ROLES) {
      expect(resolveSessionRole(role), role).toBe(role);
    }
    // Legacy claims already inside 7-day JWTs resolve without a re-login.
    expect(resolveSessionRole('HR')).toBe('HR_MANAGER');
    expect(resolveSessionRole('SUPPORT_AGENT')).toBe('SUPPORT_STAFF');
  });

  it('never aliases a key that is itself a canonical role', () => {
    // An alias key colliding with SESSION_ROLES would rewrite a real role into a
    // different one. `marketing` -> MARKETING_MANAGER was exactly this bug: it
    // would have silently promoted marketing staff to the manager role.
    const canonical = new Set(SESSION_ROLES as readonly string[]);
    for (const [alias, target] of Object.entries(CRM_ROLE_ALIASES)) {
      expect(canonical.has(alias.toUpperCase()), `alias "${alias}" shadows a canonical role`).toBe(false);
      expect(canonical.has(target), `alias "${alias}" targets unknown role "${target}"`).toBe(true);
      expect(target === alias.toUpperCase(), `alias "${alias}" maps to itself`).toBe(false);
    }
  });

  it('preserves non-staff user types verbatim', () => {
    for (const userType of ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'STUDENT']) {
      expect(pageSessionRole(userType, 'counselor'), userType).toBe(userType);
    }
  });

  it('fails back to the baseline staff role instead of minting an unknown one', () => {
    // CEO, DOCUMENT_OFFICER, DATA_MANAGER, AI_MANAGER and PARTNER_MANAGER have
    // no proven canonical equivalent. Inventing an allow-list for them would be
    // a permission grant disguised as a bug fix, so they fall back to EMPLOYEE,
    // which every staff account already holds and which resolves to a real page.
    for (const crmRole of ['ceo', 'document_officer', 'data_manager', 'ai_manager', 'partner_manager']) {
      const claim = pageSessionRole('EMPLOYEE', crmRole);
      expect(claim, crmRole).toBe('EMPLOYEE');
      expect(isKnownSessionRole(claim)).toBe(true);
    }
    expect(pageSessionRole('EMPLOYEE', null)).toBe('EMPLOYEE');
  });
});

describe('proxy fallback dashboards', () => {
  it('sends every role to a route that actually resolves', () => {
    const dead: string[] = [];
    for (const role of Object.keys(ROLE_ROUTES)) {
      const target = getDashboardRoute(role);
      if (!routeResolvesToAPage(target)) dead.push(`${role} -> ${target}`);
    }
    expect(dead, `fallback dashboards with no page: ${dead.join(', ')}`).toEqual([]);
  });

  it('resolves every alias target to a real page, so no alias dead-ends', () => {
    const dead: string[] = [];
    for (const [source, destination] of ALIASES) {
      // Parameterised sources (:slug, :path*) legitimately have no single page.
      if (/[:*]/.test(source)) continue;
      if (!routeResolvesToAPage(source)) dead.push(`${source} -> ${destination}`);
    }
    expect(dead, `aliases that dead-end: ${dead.join(', ')}`).toEqual([]);
  });

  it('sends every role to a route inside its own allow-list, so it cannot loop', () => {
    // A fallback outside the role's allow-list fails the same check that
    // produced it and redirects to itself forever.
    const looping: string[] = [];
    for (const [role, allowed] of Object.entries(ROLE_ROUTES)) {
      const target = getDashboardRoute(role);
      if (target === '/') continue; // deliberate loop-safe terminator
      const inAllowList = allowed.some((prefix) => target === prefix || target.startsWith(`${prefix}/`));
      if (!inAllowList) looping.push(`${role} -> ${target} not in [${allowed.join(', ')}]`);
    }
    expect(looping, `redirect loops: ${looping.join('; ')}`).toEqual([]);
  });

  it('terminates on the public root for a role it cannot resolve', () => {
    expect(getDashboardRoute('NOT_A_REAL_ROLE')).toBe('/');
  });
});

describe('public course discovery', () => {
  it('keeps the canonical course-detail hub reachable without a session', () => {
    for (const path of [
      '/course',
      '/course/foundation-certificate-in-medicine',
      '/courses/anything',
      '/course-finder',
    ]) {
      expect(isPublicPageRequest(path), path).toBe(true);
    }
  });

  it('gives bare /course a destination rather than a 404', () => {
    // src/app/course contains only [slug]/page.tsx, so the bare listing path has
    // no page. next.config.ts redirects it to the Course Finder exactly as it
    // already does for the plural /courses alias. The proxy must still treat it
    // as public for that redirect to run - the same reason the legacy
    // /eligibility-checker and /visa-support aliases are allow-listed.
    expect(ALIASES.get('/course')).toBe('/course-finder');
    expect(routeResolvesToAPage('/course')).toBe(true);
    expect(isPublicPageRequest('/course')).toBe(true);
  });

  it('does not let the /course prefix expose private course tooling', () => {
    // matchesPath is boundary-aware, so "/course" must not swallow sibling
    // routes or the authenticated course-finder APIs.
    for (const path of ['/course-finder/saved', '/course-finder/shortlist', '/course-finder/compare', '/course-finder/eligible', '/course-finder/admin']) {
      expect(isPublicApiRequest(path, 'GET'), path).toBe(false);
    }
    expect(isPublicApiRequest('/api/course-finder/saved', 'GET')).toBe(false);
    expect(isPublicApiRequest('/api/course-finder/admin', 'GET')).toBe(false);
    expect(isPublicApiRequest('/api/course-finder/shortlist', 'POST')).toBe(false);
  });

  it('still keeps portal, admin and student pages behind authentication', () => {
    for (const path of [
      '/student/dashboard',
      '/employee/dashboard',
      '/employee/hr-dashboard',
      '/crm/dashboard',
      '/crm/hrm',
      '/admin/dashboard',
      '/super-admin/dashboard',
      '/partner-admin/dashboard',
      '/application-manager/applications',
    ]) {
      expect(isPublicPageRequest(path), path).toBe(false);
    }
  });
});
