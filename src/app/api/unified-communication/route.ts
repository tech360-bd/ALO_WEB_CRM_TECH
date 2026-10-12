import { NextResponse } from 'next/server';

/** Legacy ID/substring/contact matching could attach an unverified sender to
 * someone else's student timeline. Dedicated authenticated UCC/provider and
 * public-acquisition routes remain separate; no identity inference here. */
export async function POST() {
  return NextResponse.json({ success: false, code: 'IDENTITY_VERIFICATION_REQUIRED', error: 'Legacy identity matching is disabled. Use the authenticated communication portal or the public consultation form.' }, { status: 409 });
}

export async function GET() {
  return NextResponse.json({ success: true, status: 'legacy_disabled', automaticIdentityMatching: false, automaticRegistration: false,
    message: 'This legacy adapter is disabled pending verified sender identity mapping. It does not create accounts, link profiles or deliver messages.' });
}
