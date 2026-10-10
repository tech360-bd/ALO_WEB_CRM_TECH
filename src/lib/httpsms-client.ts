// NdoleStudio/httpsms-node — thin wrapper for ALO
// Node SDK pattern: httpsms-node wraps HTTP API with phone-ID JWT, FCM, webhooks
// See https://github.com/NdoleStudio/httpsms-node
export { sendSms as sendHttpsms } from '@/lib/sms-gateway';

// Example usage for counselor:
// import { sendHttpsms } from '@/lib/httpsms-client';
// await sendHttpsms({ to:'+8801805020100', message:'Your UKVI interview prep link: ...', provider:'httpsms', studentId:'AE-...' });
