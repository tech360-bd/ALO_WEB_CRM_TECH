#!/usr/bin/env node
/**
 * Read-only Hostinger/MySQL readiness diagnostic.
 *
 * Loads the same Next.js dotenv files as the app, then checks DNS, TCP, Prisma
 * SELECT 1, and a non-sensitive User.id read. It never prints DATABASE_URL,
 * host/user/schema names, passwords, exception messages, or query results.
 */
import { lookup } from 'node:dns/promises';
import { createConnection } from 'node:net';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;

const ENV_FILE_PRECEDENCE = ['.env.production.local', '.env.local', '.env.production', '.env'];
const SAFE_CODE = /^[A-Z0-9_-]{1,32}$/;

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

function parseDatabaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return { error: 'DATABASE_URL_INVALID' };
  }
  if (url.protocol !== 'mysql:') return { error: 'DATABASE_URL_SCHEME_UNSUPPORTED' };

  const port = url.port ? Number(url.port) : 3306;
  const hasSchema = url.pathname.replace(/^\/+/, '').length > 0;
  if (!url.hostname || !Number.isInteger(port) || port < 1 || port > 65535 || !hasSchema) {
    return { error: 'DATABASE_URL_FIELDS_INCOMPLETE' };
  }
  return {
    host: url.hostname,
    port,
    hasSchema,
    hasUsername: Boolean(url.username),
    hasPassword: Boolean(url.password),
  };
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
  if (['P1001', 'P1002', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'EHOSTUNREACH'].includes(code)) {
    return { code, category: 'MYSQL_HOST_OR_NETWORK_UNREACHABLE' };
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

function printFailure(label, error) {
  const summary = classifyDatabaseError(error);
  console.log(`${label}: FAIL (${summary.category}; code=${summary.code})`);
}

async function run() {
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
    console.log('DATABASE_URL: MISSING (no network checks attempted; value not shown)');
    process.exitCode = 2;
    return;
  }

  const target = parseDatabaseUrl(databaseUrl);
  if ('error' in target) {
    console.log(`DATABASE_URL: INVALID (${target.error}; value not shown)`);
    process.exitCode = 2;
    return;
  }
  console.log(`MySQL URL fields: host=<redacted>; port=${target.port}; schema=${target.hasSchema ? '<configured, redacted>' : '<missing>'}; username=${target.hasUsername ? '<configured, redacted>' : '<missing>'}; password=${target.hasPassword ? '<configured, redacted>' : '<missing>'}`);

  try {
    await lookup(target.host);
    console.log('DNS lookup: PASS (resolved address withheld)');
  } catch (error) {
    printFailure('DNS lookup', error);
    console.log('TCP, Prisma, and model checks: SKIPPED');
    process.exitCode = 1;
    return;
  }

  try {
    await checkTcp(target.host, target.port);
    console.log('TCP connection: PASS');
  } catch (error) {
    printFailure('TCP connection', error);
    console.log('Prisma and model checks: SKIPPED');
    process.exitCode = 1;
    return;
  }

  let prisma;
  try {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient({ datasourceUrl: databaseUrl, log: [] });
    await prisma.$queryRaw`SELECT 1`;
    console.log('Prisma connection / SELECT 1: PASS');
  } catch (error) {
    printFailure('Prisma connection / SELECT 1', error);
    process.exitCode = 1;
  }

  if (prisma && process.exitCode !== 1) {
    try {
      // Read one identifier only; no personal data is selected or printed.
      await prisma.user.findFirst({ select: { id: true } });
      console.log('Prisma User model read: PASS (result withheld)');
    } catch (error) {
      printFailure('Prisma User model read', error);
      process.exitCode = 1;
    }
  }

  if (prisma) {
    try {
      await prisma.$disconnect();
    } catch {
      console.log('Prisma disconnect: WARN (error details withheld)');
      process.exitCode = 1;
    }
  }
  if (process.exitCode !== 1) console.log('Database readiness diagnostics: PASS');
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  run().catch(() => {
    console.error('Database readiness diagnostics: FAIL (UNEXPECTED_DIAGNOSTIC_FAILURE; details withheld)');
    process.exitCode = 1;
  });
}
