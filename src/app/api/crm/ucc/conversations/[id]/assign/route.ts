import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { canUseUnscopedUccAdmin } from '@/lib/ucc/document-access';
import { mutationOriginAllowed } from '@/lib/request-origin';

/** No User/PortalUser ID inference. A namespace migration must precede reassignment. */
export async function POST(request: Request, _context: {params: Promise<{id: string}>}) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!mutationOriginAllowed(request, auth) || !canUseUnscopedUccAdmin(auth)) {
    return NextResponse.json({success:false,error:'Assignment access is not permitted.'},{status:403});
  }
  return NextResponse.json({success:false,code:'UCC_ASSIGNMENT_NAMESPACE_PENDING',error:'Assignment changes are disabled until domain-aware ownership is migrated and verified.'},{status:503});
}
