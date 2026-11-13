import { sendSms, type SendSmsOpts } from './sms-gateway';

/**
 * Explicit OpenSMS (`daslearning-org/OpenSMS`) transport facade.
 *
 * Dispatches outbound SMS to an HTTPS-tunneled OpenSMS FastAPI server
 * (`POST {OPENSMS_BASE_URL}/sms/` with `Authorization: Bearer {OPENSMS_API_KEY}`).
 * Upstream `SmsManager` acceptance (`{ stat: true }`) is handset dispatch, not
 * carrier delivery proof.
 */
export function sendOpensms(opts: Omit<SendSmsOpts, 'provider'>) {
  return sendSms({ ...opts, provider: 'opensms' });
}
