// GET /api/super-admin/security-tests
//
// Returns the result of the security negative-test suite, COMPUTED from the
// repository source at request time. The previous implementation returned a
// hardcoded array of `result: 'PASS'` strings, including for routes that did
// not exist, which could never fail and therefore proved nothing.

import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { runSuperAdminSecurityChecks } from '@/lib/super-admin/security-tests';

export const dynamic = 'force-dynamic';

async function handleGet(_request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  const tests = runSuperAdminSecurityChecks();
  const count = (result: string) => tests.filter((test) => test.result === result).length;

  return NextResponse.json({
    success: true,
    methodology:
      'Each test is verified by reading the named source file and asserting that the required guard is present. '
      + 'A test whose file is missing is reported FAIL. This is source-level verification; execute the suite '
      + 'against a running server for request-level proof.',
    totals: {
      tests: tests.length,
      pass: count('PASS'),
      fail: count('FAIL'),
      notVerified: count('NOT_VERIFIED'),
    },
    tests,
  });
}

export const GET = withAuth(handleGet);
