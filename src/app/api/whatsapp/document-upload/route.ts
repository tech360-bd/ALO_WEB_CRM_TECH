// Staff upload compatibility endpoint: send real multipart file bytes linked
// to an authorized UCC conversation. Automatic intake uses signed webhooks.
export { POST } from '@/app/api/crm/ucc/documents/upload/route';
export const runtime = 'nodejs';
