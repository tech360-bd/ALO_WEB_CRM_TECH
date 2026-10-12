import { describe, expect, it } from 'vitest';
import { inboxReplyRequest } from '@/lib/inbox/reply-request';
describe('inbox reply client contract', () => {
  it('legacy request includes exact threadId and no browser-supplied recipient', () => {
    expect(inboxReplyRequest({ key: 'communication_thread:synthetic', id: 'synthetic', source: 'communication_thread', channel: 'WHATSAPP' }, ' Hello ')).toEqual({ url: '/api/inbox/unified', body: { threadId: 'synthetic', channel: 'WHATSAPP', content: 'Hello', aiAssisted: false, humanApproved: true } });
  });
  it('UCC request targets existing provider-backed reply route with reviewed AI flags', () => {
    expect(inboxReplyRequest({ key: 'ucc_conversation:synthetic', id: 'synthetic', source: 'ucc_conversation', channel: 'WHATSAPP' }, 'Reviewed draft', true)).toEqual({ url: '/api/crm/ucc/conversations/synthetic/reply', body: { content: 'Reviewed draft', messageType: 'text', aiGenerated: true, aiApproved: true } });
  });
  it('unknown conversation namespace fails closed', () => {
    expect(() => inboxReplyRequest({ key: 'ambiguous', channel: 'EMAIL' }, 'Hello')).toThrow('source is missing');
  });
});
