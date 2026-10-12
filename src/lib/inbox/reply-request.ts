/** Only an existing server-returned thread may be replied to. Recipients are
 * resolved server-side; browser-supplied phone/email is not authority. */
export function inboxReplyRequest(conversation: { key: string; id?: string; source?: string; channel: string }, content: string, aiAssisted = false) {
  const id = conversation.id || conversation.key;
  if (!id || !content.trim()) throw new Error('Select a conversation and enter a reply.');
  if (conversation.source === 'ucc_conversation') return {
    url: `/api/crm/ucc/conversations/${encodeURIComponent(id)}/reply`,
    body: { content: content.trim(), messageType: 'text', aiGenerated: aiAssisted, aiApproved: aiAssisted },
  };
  if (conversation.source !== 'communication_thread') throw new Error('Conversation source is missing. Refresh the inbox before replying.');
  return { url: '/api/inbox/unified', body: { threadId: id, channel: conversation.channel, content: content.trim(), aiAssisted, humanApproved: true } };
}
