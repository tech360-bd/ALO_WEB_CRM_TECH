/**
 * Dev-only helper: mint a NextAuth session JWT for a fixture identity so the
 * HTTP probes can authenticate without driving the login form.
 *
 *   NEXTAUTH_SECRET=dev-secret-please-change \
 *     node scripts/dev-sqlite/mint-dev-jwt.mjs super.admin@aloeducation.dev SUPER_ADMIN
 *
 * Prints the raw JWT on stdout. The probes pass it as
 *   Cookie: next-auth.session-token=<jwt>
 *
 * Requires a `file:` DATABASE_URL: it refuses to run against a real database so
 * this helper can never mint production sessions.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(`${process.cwd()}/`);
const { encode } = require('next-auth/jwt');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { PrismaClient } = require('.prisma/client/wasm');

const url = process.env.DATABASE_URL || '';
if (!url.startsWith('file:')) {
  console.error('Refusing to run: DATABASE_URL must be a file: SQLite URL (dev sandbox only).');
  process.exit(1);
}

const secret = process.env.NEXTAUTH_SECRET;
if (!secret) {
  console.error('NEXTAUTH_SECRET is required (the same value the dev server runs with).');
  process.exit(1);
}

const email = process.argv[2];
const role = process.argv[3];
if (!email || !role) {
  console.error('Usage: mint-dev-jwt.mjs <email> <ROLE>');
  process.exit(1);
}

async function main() {
  const dbFile = url.replace(/^file:/, '');
  const db = new PrismaClient({ adapter: new PrismaLibSQL({ url }) });
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No users row for ${email}. Run seed-super-admin-proof.ts first.`);
    process.exit(1);
  }

  const token = await encode({
    secret,
    token: {
      id: user.id,
      sub: user.id,
      email: user.email,
      name: user.name,
      role,
      identityDomain: 'user',
      userType: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'EMPLOYEE',
    },
  });

  // Keep the raw token on stdout only; diagnostics go to stderr.
  process.stderr.write(`minted for ${email} (${role}) from ${path.basename(dbFile)}\n`);
  process.stdout.write(token);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
