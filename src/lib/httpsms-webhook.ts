import { jwtVerify } from 'jose';

/** Verifies httpSMS bearer JWT authentication, NOT a body HMAC.
 * Upstream signs audience (configured webhook URL), issuer, subject and times.
 * Receivers must separately validate event schema, tenant ownership and persist
 * event-ID deduplication. No public webhook route is installed by this helper.
 */
export async function verifyHttpsmsSignature(req: Request, _rawBody: string): Promise<boolean> {
  const key = process.env.HTTPSMS_WEBHOOK_SIGNING_KEY;
  const audience = process.env.HTTPSMS_WEBHOOK_URL;
  const subject = process.env.HTTPSMS_WEBHOOK_SUBJECT;
  const auth = req.headers.get('authorization');
  if (!key || key.length < 32 || !audience || !subject || !auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  if (token.length > 8192) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(key), {
      algorithms: ['HS256'], issuer: 'api.httpsms.com', audience, subject,
      requiredClaims: ['exp', 'iat', 'nbf', 'iss', 'aud', 'sub'], maxTokenAge: '10m',
    });
    const now = Date.now() / 1000;
    return typeof payload.iat === 'number' && typeof payload.exp === 'number'
      && payload.iat <= now && payload.exp > payload.iat && payload.exp - payload.iat <= 600;
  } catch { return false; }
}
