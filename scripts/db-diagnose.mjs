#!/usr/bin/env node
/**
 * Read-only Hostinger/MySQL readiness diagnostic.
 *
 * Loads the same Next.js dotenv files as the app and uses Prisma's MySQL
 * datasource. It runs metadata/read-only queries only; it never prints the
 * connection URL, password, exception message, grant SQL, or query parameters.
 * Run only from an authorized server-side shell; this is not a public route.
 *
 * Optional: --expected-database=<verified-name> compares the live schema to
 * the operator-confirmed production database name. It does not change config.
 */
import { lookup } from 'node:dns/promises';
import { createConnection } from 'node:net';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;

const ENV_FILE_PRECEDENCE = ['.env.production.local', '.env.local', '.env.production', '.env'];
const SAFE_CODE = /^[A-Z0-9_-]{1,32}$/;
const REQUIRED_RUNTIME_PRIVILEGES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
const SAFE_IDENTIFIER = /^[A-Za-z0-9_$.-]{1,128}$/;
const DNS_TIMEOUT_MS = 8_000;
const TCP_TIMEOUT_MS = 8_000;
const QUERY_TIMEOUT_MS = 12_000;
const DISCONNECT_TIMEOUT_MS = 3_000;

export function withTimeout(promise, timeoutMs, code = 'DIAGNOSTIC_TIMEOUT') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error('Diagnostic operation timed out');
      error.code = code;
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

export function compareExpectedDatabase(actual, expected) {
  if (!expected) return 'NOT CHECKED';
  return actual === expected ? 'PASS' : 'FAIL';
}

function diagnosticDatasourceUrl(value) {
  const url = new URL(value);
  // Bounds are applied only to this diagnostic connection; the application's
  // stored/protected DATABASE_URL is not changed.
  url.searchParams.set('connect_timeout', String(Math.ceil(DNS_TIMEOUT_MS / 1000)));
  url.searchParams.set('socket_timeout', String(Math.ceil(QUERY_TIMEOUT_MS / 1000)));
  return url.toString();
}

function hasDatabaseUrlAssignment(contents) {
  return /^(?:\s|export\s+)*DATABASE_URL\s*=\s*\S/m.test(contents ?? '');
}

function identifyDatabaseUrlSource(preloadedUrl, preloadedKey, loadedEnvFiles, resolvedUrl) {
  if (preloadedUrl) return 'process environment (takes precedence over dotenv files; value hidden)';
  if (preloadedKey && !preloadedUrl) return 'process environment variable is present but empty';

  const filesWithUrl = new Set(
    (loadedEnvFiles ?? [])
      .filter((file) => hasDatabaseUrlAssignment(file.contents))
      .map((file) => basename(file.path)),
  );
  const selectedFile = ENV_FILE_PRECEDENCE.find((file) => filesWithUrl.has(file));
  if (selectedFile) return `Next.js dotenv file ${selectedFile} (contents hidden)`;
  if (resolvedUrl) return 'process environment after Next.js dotenv loading (source not identified)';
  return 'not set';
}

function safeIdentity(value) {
  if (typeof value !== 'string' || !value) return '<unavailable>';
  return SAFE_IDENTIFIER.test(value) ? value : '<configured, sanitized>';
}

function parseDatabaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return { error: 'DATABASE_URL_INVALID' };
  }
  if (url.protocol !== 'mysql:') return { error: 'DATABASE_URL_SCHEME_UNSUPPORTED' };

  const port = url.port ? Number(url.port) : 3306;
  let databaseName = '';
  try {
    databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  } catch {
    return { error: 'DATABASE_URL_INVALID' };
  }
  if (!url.hostname || !Number.isInteger(port) || port < 1 || port > 65535 || !databaseName) {
    return { error: 'DATABASE_URL_FIELDS_INCOMPLETE' };
  }

  let configuredUsername = '';
  try {
    configuredUsername = decodeURIComponent(url.username);
  } catch {
    return { error: 'DATABASE_URL_INVALID' };
  }
  return {
    host: url.hostname,
    port,
    databaseName,
    configuredUsername,
    hasUsername: Boolean(url.username),
    hasPassword: Boolean(url.password),
  };
}

function expectedDatabaseFromArgs(argv) {
  const values = argv.filter((arg) => arg.startsWith('--expected-database='));
  if (values.length > 1) return { error: 'EXPECTED_DATABASE_OPTION_REPEATED' };
  if (!values.length) return { value: '' };
  const value = values[0].slice('--expected-database='.length);
  if (!value || value.length > 128 || /[\r\n\0]/.test(value)) {
    return { error: 'EXPECTED_DATABASE_OPTION_INVALID' };
  }
  return { value };
}

function currentUserName(value) {
  // CURRENT_USER() is returned as user@grant-host. The host half is not needed
  // to identify the authenticated account and may expose internal host details.
  return typeof value === 'string' ? value.split('@', 1)[0] : '';
}

function assessRuntimePrivileges(grantRows, databaseName) {
  const grants = (grantRows ?? []).flatMap((row) =>
    row && typeof row === 'object'
      ? Object.values(row).filter((value) => typeof value === 'string')
      : [],
  );
  const granted = new Set();
  let matchingGrantFound = false;

  for (const statement of grants) {
    const match = statement.match(/^\s*GRANT\s+(.+?)\s+ON\s+(.+?)\s+TO\s+/i);
    if (!match) continue;
    const scope = match[2].trim();
    const globalScope = /^\*\.\*$/.test(scope);
    const databaseScope = scope.match(/^`((?:``|[^`])+)`\.\*$/);
    const unquotedDatabaseScope = scope.match(/^([^`\s]+)\.\*$/);
    const scopeDatabase = databaseScope
      ? databaseScope[1].replace(/``/g, '`')
      : unquotedDatabaseScope?.[1];
    if (!globalScope && scopeDatabase !== databaseName) continue;

    matchingGrantFound = true;
    const privileges = match[1].toUpperCase().split(',').map((item) => item.trim());
    if (privileges.includes('ALL PRIVILEGES') || privileges.includes('ALL')) {
      REQUIRED_RUNTIME_PRIVILEGES.forEach((privilege) => granted.add(privilege));
    } else {
      privileges.forEach((privilege) => granted.add(privilege));
    }
  }

  const missing = REQUIRED_RUNTIME_PRIVILEGES.filter((privilege) => !granted.has(privilege));
  return {
    status: missing.length === 0 ? 'PASS' : matchingGrantFound ? 'FAIL' : 'UNKNOWN',
    verified: REQUIRED_RUNTIME_PRIVILEGES.filter((privilege) => granted.has(privilege)),
    missing,
  };
}

function safeHost(host) {
  // URL parsing has already separated credentials. Restrict output to a host
  // literal only; never echo URL/path/query text into an operator log.
  return typeof host === 'string' && /^[A-Za-z0-9.:[\]-]{1,253}$/.test(host)
    ? host
    : '<configured, sanitized>';
}

function safeVersion(version) {
  if (typeof version !== 'string') return '<unavailable>';
  const clean = version.replace(/[^A-Za-z0-9._+()-]/g, '').slice(0, 80);
  return clean || '<unavailable>';
}

function errorCode(error) {
  let current = error;
  for (let depth = 0; depth < 3 && current && typeof current === 'object'; depth += 1) {
    const candidate = 'code' in current ? current.code : undefined;
    if (typeof candidate === 'string' && (SAFE_CODE.test(candidate) || /^\d{3,5}$/.test(candidate))) {
      return candidate;
    }
    current = 'cause' in current ? current.cause : undefined;
  }
  return 'UNKNOWN';
}

export function classifyDatabaseError(error) {
  const code = errorCode(error);
  if (['P1000', 'P1010', 'ER_ACCESS_DENIED_ERROR', 'ER_DBACCESS_DENIED_ERROR', 'ER_TABLEACCESS_DENIED_ERROR', '1044', '1045'].includes(code)) {
    return { code, category: 'MYSQL_AUTHENTICATION_OR_ACCESS_DENIED' };
  }
  if (code === 'DIAGNOSTIC_TIMEOUT') {
    return { code, category: 'DATABASE_OPERATION_TIMEOUT' };
  }
  if (['P1001', 'P1002', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'EHOSTUNREACH'].includes(code)) {
    return { code, category: code === 'P1002' || code === 'ETIMEDOUT'
      ? 'MYSQL_CONNECT_OR_QUERY_TIMEOUT'
      : 'MYSQL_HOST_OR_NETWORK_UNREACHABLE' };
  }
  if (['P1003', 'ER_BAD_DB_ERROR', '1049'].includes(code)) {
    return { code, category: 'MYSQL_DATABASE_SCHEMA_NOT_FOUND' };
  }
  if (['P1011', 'HANDSHAKE_SSL_ERROR', 'ERR_SSL_WRONG_VERSION_NUMBER'].includes(code)) {
    return { code, category: 'MYSQL_TLS_CONFIGURATION_FAILED' };
  }
  if (['P1012', 'P1013', 'DATABASE_URL_INVALID'].includes(code)) {
    return { code, category: 'PRISMA_CONFIGURATION_ERROR' };
  }
  if (['P2021', 'P2022'].includes(code)) {
    return { code, category: 'PRISMA_MODEL_OR_SCHEMA_MISMATCH' };
  }
  if (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND') {
    return { code, category: 'PRISMA_CLIENT_NOT_AVAILABLE' };
  }
  return { code, category: 'DATABASE_QUERY_FAILED' };
}

function checkTcp(host, port, timeoutMs = 8000) {
  return new Promise((resolveTcp, rejectTcp) => {
    const socket = createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      const timeout = new Error('TCP connection timed out');
      timeout.code = 'ETIMEDOUT';
      rejectTcp(timeout);
    }, timeoutMs);
    socket.once('connect', () => {
      clearTimeout(timer);
      socket.destroy();
      resolveTcp();
    });
    socket.once('error', (error) => {
      clearTimeout(timer);
      rejectTcp(error);
    });
  });
}

export function formatFailure(label, error) {
  const summary = classifyDatabaseError(error);
  return `${label}: FAIL (${summary.category}; code=${summary.code})`;
}

function printFailure(label, error) {
  console.log(formatFailure(label, error));
}

function printPrivilegeResult(result) {
  if (result.status === 'PASS') {
    console.log(`Runtime database privileges (SELECT/INSERT/UPDATE/DELETE): PASS (${result.verified.join(', ')})`);
  } else if (result.status === 'FAIL') {
    console.log(`Runtime database privileges (SELECT/INSERT/UPDATE/DELETE): FAIL (missing ${result.missing.join(', ')})`);
  } else {
    console.log('Runtime database privileges (SELECT/INSERT/UPDATE/DELETE): UNKNOWN (no direct global or database grant could be verified)');
  }
}

async function run() {
  const expected = expectedDatabaseFromArgs(process.argv.slice(2));
  if (expected.error) {
    console.log(`Expected database comparison: NOT RUN (${expected.error})`);
    process.exitCode = 2;
    return;
  }

  const preloadedUrl = process.env.DATABASE_URL?.trim() ?? '';
  const preloadedKey = Object.hasOwn(process.env, 'DATABASE_URL');
  if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

  let loadedEnvFiles = [];
  try {
    const silentLogger = { info() {}, warn() {}, error() {} };
    ({ loadedEnvFiles = [] } = loadEnvConfig(
      process.cwd(),
      process.env.NODE_ENV === 'development',
      silentLogger,
    ));
  } catch {
    console.log('Next.js dotenv loading: FAIL (ENV_FILE_LOAD_FAILED; file contents hidden)');
    process.exitCode = 2;
    return;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim() ?? '';
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`DATABASE_URL source: ${identifyDatabaseUrlSource(preloadedUrl, preloadedKey, loadedEnvFiles, databaseUrl)}`);
  if (!databaseUrl) {
    console.log('DATABASE_URL configured: NO (no network checks attempted; value hidden)');
    process.exitCode = 2;
    return;
  }

  const target = parseDatabaseUrl(databaseUrl);
  if ('error' in target) {
    console.log(`DATABASE_URL configured: INVALID (${target.error}; value hidden)`);
    process.exitCode = 2;
    return;
  }
  console.log(`DATABASE_URL configured: YES; password configured: ${target.hasPassword ? 'YES' : 'NO'}`);
  console.log(`Configured endpoint: host=${safeHost(target.host)}; port=${target.port}`);
  console.log(`Configured database: ${safeIdentity(target.databaseName)}`);
  console.log(`Configured database username: ${safeIdentity(target.configuredUsername)}`);
  if (expected.value) console.log(`Expected production database: ${safeIdentity(expected.value)} (source: explicit operator argument)`);
  else console.log('Expected production database: NOT PROVIDED (comparison will be reported as NOT CHECKED)');
  console.log('Diagnostic timeouts: DNS/TCP 8s; MySQL connect 8s; each Prisma query 12s; disconnect 3s (diagnostic-only)');

  try {
    await withTimeout(lookup(target.host), DNS_TIMEOUT_MS);
    console.log('DNS lookup: PASS (resolved address withheld)');
  } catch (error) {
    printFailure('DNS lookup', error);
    console.log('TCP, Prisma, identity, grants, and model checks: SKIPPED');
    process.exitCode = 1;
    return;
  }

  try {
    await checkTcp(target.host, target.port, TCP_TIMEOUT_MS);
    console.log('TCP connection: PASS');
  } catch (error) {
    printFailure('TCP connection', error);
    console.log('Prisma, identity, grants, and model checks: SKIPPED');
    process.exitCode = 1;
    return;
  }

  let prisma;
  let effectiveDatabase = '';
  try {
    const { PrismaClient } = await import('@prisma/client');
    // Preserve the target's verified URL components while bounding only this
    // diagnostic connection. The protected application URL is never modified.
    prisma = new PrismaClient({ datasourceUrl: diagnosticDatasourceUrl(databaseUrl), log: [] });

    const queryStartedAt = process.hrtime.bigint();
    const probe = await withTimeout(
      prisma.$queryRaw`SELECT 1 AS connectionCheck`,
      QUERY_TIMEOUT_MS,
    );
    const probeLatencyMs = Number(process.hrtime.bigint() - queryStartedAt) / 1e6;
    if (probe?.[0]?.connectionCheck !== 1) {
      const error = new Error('Read-only database probe returned an unexpected result');
      error.code = 'DATABASE_PROBE_FAILED';
      throw error;
    }
    console.log('Prisma client initialization / read-only SELECT 1: PASS');
    console.log(`SELECT 1 latency: ${probeLatencyMs.toFixed(1)} ms`);

    const [identity] = await withTimeout(
      prisma.$queryRaw`
        SELECT DATABASE() AS effectiveDatabase,
               CURRENT_USER() AS effectiveUser,
               VERSION() AS serverVersion
      `,
      QUERY_TIMEOUT_MS,
    );
    effectiveDatabase = typeof identity?.effectiveDatabase === 'string'
      ? identity.effectiveDatabase
      : '';
    const effectiveUser = currentUserName(identity?.effectiveUser);
    console.log(`Database server version: ${safeVersion(identity?.serverVersion)}`);
    console.log(`Effective database: ${safeIdentity(effectiveDatabase)}`);
    console.log(`Effective database username: ${safeIdentity(effectiveUser)}`);

    const comparison = compareExpectedDatabase(effectiveDatabase, expected.value);
    console.log(`Expected production database matches runtime: ${comparison}`);
    if (comparison === 'FAIL') process.exitCode = 1;
    if (comparison === 'NOT CHECKED') process.exitCode = 1;

    try {
      const grantRows = await withTimeout(
        prisma.$queryRawUnsafe('SHOW GRANTS FOR CURRENT_USER()'),
        QUERY_TIMEOUT_MS,
      );
      const grantsResult = assessRuntimePrivileges(grantRows, effectiveDatabase);
      printPrivilegeResult(grantsResult);
      if (grantsResult.status !== 'PASS') process.exitCode = 1;
    } catch (error) {
      printFailure('Read-only grant inspection', error);
      console.log('Runtime database privileges (SELECT/INSERT/UPDATE/DELETE): UNKNOWN');
      process.exitCode = 1;
    }

    try {
      // Read one identifier only; no personal or business data is selected or printed.
      await withTimeout(
        prisma.user.findFirst({ select: { id: true } }),
        QUERY_TIMEOUT_MS,
      );
      console.log('Prisma User model read: PASS (result withheld)');
    } catch (error) {
      printFailure('Prisma User model read', error);
      process.exitCode = 1;
    }
  } catch (error) {
    printFailure('Prisma client initialization / read-only query', error);
    console.log('Database identity, grants, and model checks: SKIPPED');
    process.exitCode = 1;
  } finally {
    if (prisma) {
      try {
        await withTimeout(prisma.$disconnect(), DISCONNECT_TIMEOUT_MS);
      } catch {
        console.log('Prisma disconnect: WARN (operation timed out or failed; details withheld)');
        process.exitCode = 1;
      }
    }
  }

  if (process.exitCode !== 1) console.log('Database readiness diagnostics: PASS');
  else console.log('Database readiness diagnostics: FAIL (read-only; no changes made)');
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  run().catch(() => {
    console.error('Database readiness diagnostics: FAIL (UNEXPECTED_DIAGNOSTIC_FAILURE; details withheld)');
    process.exitCode = 1;
  });
}

export {
  assessRuntimePrivileges,
  expectedDatabaseFromArgs,
  identifyDatabaseUrlSource,
  parseDatabaseUrl,
};
