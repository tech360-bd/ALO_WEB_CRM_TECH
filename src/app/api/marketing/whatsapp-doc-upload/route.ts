// Staff upload compatibility endpoint. Uses UCC permissions, conversation scope,
// MIME validation and private storage; never fabricates completed OCR output.
export { POST } from '@/app/api/crm/ucc/documents/upload/route';
export const runtime = 'nodejs';
