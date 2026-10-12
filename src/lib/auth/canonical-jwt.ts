import {decode, type JWTDecodeParams} from 'next-auth/jwt';

/** NextAuth sessions represent User only. Shared page-navigation cookies issued
 * by Portal/Student logins are not User credentials. Legacy unnamespaced JWTs
 * must reauthenticate; never infer their table from a matching id/email/role.
 */
export async function decodeCanonicalUserJwt(params: JWTDecodeParams) {
  const token = await decode(params);
  return token?.identityDomain === 'user' && typeof token.id === 'string' && token.id.trim()
    ? token : null;
}
