/** Explicit httpSMS transport facade (x-api-key; E.164 from/to; data.id).
 * Does not silently use SMS_PROVIDER=generic when the caller asks for httpSMS.
 */
import { sendSms, type SendSmsOpts } from './sms-gateway';
export function sendHttpsms(opts: SendSmsOpts) {
  return sendSms({ ...opts, provider: 'httpsms' });
}
