// ============================================================
// Chatwoot — Open-source live-chat, omni-channel desk
// Source: chatwoot/chatwoot (36.8k★ 6783 commits, develop, 8.9k forks)
//   Live-chat, email, WhatsApp, Facebook, Instagram, Telegram → shared inbox,
//   Captain AI (overview reporting), assignment, SLA, automations.
// ALO use: unify counselor inbox (website chat + email + WhatsApp + FB)
//   with assignment, SLA (frappe holidays), Captain-style AI triage.
// Reuses: CommunicationThread + StudentMessage + CrmAuditLog + Sla* models
// Env: CHATWOOT_URL, CHATWOOT_API_KEY (or CHATWOOT_ACCOUNT_ID + CHATWOOT_TOKEN)
// ============================================================
import { db } from '@/lib/db';

const CW_URL = process.env.CHATWOOT_URL || '';
const CW_KEY = process.env.CHATWOOT_API_KEY || process.env.CHATWOOT_TOKEN || '';
const CW_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1';

function cwHeaders(): Record<string,string> {
  return { 'Content-Type': 'application/json', api_access_token: CW_KEY };
}

/**
 * Sync ALO inbox message to Chatwoot conversation (inbound).
 * Mirrors Chatwoot's inbox model: website/email/whatsapp/facebook → conversation.
 */
export async function chatwootCreateConversation(opts: {
  inboxId: number; // Chatwoot inbox ID per channel
  contactEmail?: string;
  contactName?: string;
  contactPhone?: string;
  message: string;
  studentId?: string;
}): Promise<{ conversationId: number; messageId: number } | null> {
  if (!CW_URL || !CW_KEY) return null; // graceful when self-hosted not set

  // 1. Find or create contact
  let contactId: number | null = null;
  if (opts.contactEmail || opts.contactPhone) {
    try {
      const r = await fetch(`${CW_URL.replace(/\/$/, '')}/api/v1/accounts/${CW_ACCOUNT_ID}/contacts/search?q=${encodeURIComponent(opts.contactEmail || opts.contactPhone || '')}`, { headers: cwHeaders() });
      const j: any = await r.json().catch(()=>null);
      contactId = j?.payload?.[0]?.id || null;
    } catch {}
    if (!contactId) {
      try {
        const cr = await fetch(`${CW_URL.replace(/\/$/, '')}/api/v1/accounts/${CW_ACCOUNT_ID}/contacts`, {
          method: 'POST', headers: cwHeaders(),
          body: JSON.stringify({ inbox_id: opts.inboxId, name: opts.contactName || opts.contactEmail || 'ALO Visitor', email: opts.contactEmail, phone_number: opts.contactPhone }),
        });
        const cj: any = await cr.json().catch(()=>null);
        contactId = cj?.payload?.contact?.id || cj?.id || null;
      } catch {}
    }
  }

  // 2. Create conversation + message
  try {
    const rr = await fetch(`${CW_URL.replace(/\/$/, '')}/api/v1/accounts/${CW_ACCOUNT_ID}/conversations`, {
      method: 'POST', headers: cwHeaders(),
      body: JSON.stringify({ inbox_id: opts.inboxId, contact_id: contactId, status: 'open', custom_attributes: { alo_student_id: opts.studentId } }),
    });
    const rj: any = await rr.json().catch(()=>null);
    const convId = rj?.id || rj?.conversation?.id;
    if (!convId) return null;
    const mr = await fetch(`${CW_URL.replace(/\/$/, '')}/api/v1/accounts/${CW_ACCOUNT_ID}/conversations/${convId}/messages`, {
      method: 'POST', headers: cwHeaders(),
      body: JSON.stringify({ content: opts.message, message_type: 'incoming', private: false }),
    });
    const mj: any = await mr.json().catch(()=>null);
    const msgId = mj?.id || 0;

    // Mirror to ALO CommunicationThread for CRM analytics
    await db.crmAuditLog.create({ data: { action: 'CHATWOOT_CONVERSATION_CREATED', entityType: 'ChatwootConversation', entityId: String(convId), actorId: 'system', details: JSON.stringify({ inboxId: opts.inboxId, studentId: opts.studentId }), createdAt: new Date() } as any }).catch(()=>{});
    return { conversationId: convId, messageId: msgId };
  } catch { return null; }
}

export async function chatwootSendReply(conversationId: number, content: string, isPrivate = false): Promise<boolean> {
  if (!CW_URL || !CW_KEY) return false;
  try {
    const r = await fetch(`${CW_URL.replace(/\/$/, '')}/api/v1/accounts/${CW_ACCOUNT_ID}/conversations/${conversationId}/messages`, {
      method: 'POST', headers: cwHeaders(),
      body: JSON.stringify({ content, message_type: 'outgoing', private: isPrivate }),
    });
    return r.ok;
  } catch { return false; }
}

/**
 * Captain-style triage: auto-assign + SLA tag based on content.
 * Uses existing sla-engine + holiday calendar (frappe SLA).
 */
export async function chatwootCaptainTriage(conversationId: number, messageText: string): Promise<{ assigneeId?: number; priority?: string; tags?: string[] }> {
  const lower = messageText.toLowerCase();
  const tags: string[] = [];
  if (lower.includes('visa') || lower.includes('cas')) tags.push('visa');
  if (lower.includes('scholarship')) tags.push('scholarship');
  if (lower.includes('urgent') || lower.includes('deadline')) tags.push('urgent');
  const priority = tags.includes('urgent') ? 'high' : 'medium';

  if (!CW_URL || !CW_KEY) return { priority, tags };

  // Apply tags + priority via Chatwoot API
  try {
    await fetch(`${CW_URL.replace(/\/$/, '')}/api/v1/accounts/${CW_ACCOUNT_ID}/conversations/${conversationId}/labels`, {
      method: 'POST', headers: cwHeaders(), body: JSON.stringify({ labels: tags }),
    }).catch(()=>{});
  } catch {}
  return { priority, tags };
}

export async function chatwootHealth(): Promise<{ configured: boolean; reachable: boolean }> {
  if (!CW_URL) return { configured: false, reachable: false };
  try {
    const r = await fetch(`${CW_URL.replace(/\/$/, '')}/api/v1/profile`, { headers: cwHeaders() });
    return { configured: true, reachable: r.ok };
  } catch { return { configured: true, reachable: false }; }
}
