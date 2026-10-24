import { createHash, randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import type { AuthContext } from '@/lib/auth-middleware';
import { aiGateway } from '@/lib/ai-gateway';
import { encryptToken, decryptToken } from '@/lib/token-encryption';
import { writePortalAudit } from '@/lib/transactional-audit';
import { unoRouterConfiguration, UnoRouterError } from './unorouter';

export interface OwnerChatInput { requestId: string; conversationId: string; provider: 'local' | 'unorouter'; model: string; message: string; externalConsent: boolean }
const TRIGGER = 'OWNER_CHAT';
function requireEncryptionKey() {
  if (!/^[a-fA-F0-9]{64}$/.test(process.env.ENCRYPTION_KEY || '')) throw new UnoRouterError('ENCRYPTION_REQUIRED', 'Configure a stable 32-byte ENCRYPTION_KEY on the server before using saved owner chat.');
}
function decode<T>(value: string): T {
  requireEncryptionKey();
  const plain = decryptToken(value);
  if (!plain) throw new UnoRouterError('HISTORY_UNAVAILABLE', 'Encrypted chat history cannot be read with the current server key.');
  try { return JSON.parse(plain) as T; } catch { throw new UnoRouterError('HISTORY_UNAVAILABLE', 'Stored chat history is invalid.'); }
}
export async function readOwnerChat(auth: AuthContext, conversationId?: string, request?: Request) {
  const recent = await db.awfRun.findMany({ where: { actorUserId: auth.userId, trigger: TRIGGER }, orderBy: { startedAt: 'desc' }, take: 100, select: { entityId: true, provider: true, model: true, startedAt: true } });
  const conversations = [...new Map([...recent].reverse().map(row => [row.entityId, { id: row.entityId, provider: row.provider, model: row.model, startedAt: row.startedAt }])).values()].reverse().slice(0, 20);
  const selected = conversationId || recent[0]?.entityId;
  const records = selected ? await db.awfRun.findMany({ where: { actorUserId: auth.userId, trigger: TRIGGER, entityType: 'OWNER_CHAT', entityId: selected }, orderBy: { startedAt: 'desc' }, take: 20 }) : [];
  const messages = records.reverse().map(row => {
    const payload = decode<{ message: string }>(row.input);
    const output = row.status === 'COMPLETED' ? decode<{ text: string }>(row.output) : null;
    return { id: row.id, runCode: row.runCode, message: payload.message, reply: output?.text || null, status: row.status, provider: row.provider, model: row.model, createdAt: row.startedAt, error: row.errorCategory || null };
  });
  await db.$transaction(async tx => { await writePortalAudit(tx, auth, 'AI_CHAT_HISTORY_VIEWED', 'AwfRun', selected || auth.userId, { turns: messages.length }, request); });
  return { conversationId: selected || null, conversations, messages };
}
export async function runOwnerChat(auth: AuthContext, input: OwnerChatInput, request?: Request) {
  requireEncryptionKey();
  if (input.provider === 'unorouter') {
    const config = unoRouterConfiguration();
    if (!input.externalConsent) throw new UnoRouterError('CONSENT_REQUIRED', 'Confirm that this conversation contains no confidential CRM or HR information before using an external model.', 400);
    if (!config.enabled || !config.keyConfigured || !config.configurationValid) throw new UnoRouterError('NOT_CONFIGURED', 'UnoRouter requires its server-side key, enabled flag and approved free-model list.');
    if (!config.approvedModels.includes(input.model) || !input.model.endsWith(':free')) throw new UnoRouterError('MODEL_BLOCKED', 'This model is not approved for free-only inference.', 400);
  } else if (!process.env.LOCAL_AI_URL || !process.env.LOCAL_AI_MODEL || input.model !== process.env.LOCAL_AI_MODEL) {
    throw new UnoRouterError('NOT_CONFIGURED', 'Configure LOCAL_AI_URL and LOCAL_AI_MODEL for private local chat.');
  }
  if (await db.globalAiPause.findFirst({ where: { scope: 'GLOBAL', active: true }, select: { id: true } })) throw new UnoRouterError('AI_PAUSED', 'AI requests are paused by Super Admin.', 423);
  const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const key = `owner-chat:${createHash('sha256').update(`${auth.userId}:${input.requestId}`).digest('hex')}`;
  const encryptedInput = encryptToken(JSON.stringify({ ...input, fingerprint }));
  const reservation = await db.$transaction(async tx => {
    const previous = await tx.awfRun.findUnique({ where: { idempotencyKey: key } });
    if (previous) {
      if (previous.actorUserId !== auth.userId || previous.trigger !== TRIGGER || decode<{ fingerprint: string }>(previous.input).fingerprint !== fingerprint) throw new UnoRouterError('REQUEST_CONFLICT', 'Request ID was already used for a different message.', 409);
      return { run: previous, replay: true };
    }
    const since = new Date(Date.now() - 60000);
    const used = await tx.awfRun.count({ where: { actorUserId: auth.userId, trigger: TRIGGER, startedAt: { gte: since } } });
    if (used >= 20) throw new UnoRouterError('RATE_LIMITED', 'Owner chat request limit reached. Retry later.', 429, 60);
    if (input.provider === 'unorouter') {
      const last = await tx.awfRun.findFirst({ where: { trigger: TRIGGER, provider: 'unorouter', model: input.model, startedAt: { gte: since } }, orderBy: { startedAt: 'desc' }, select: { startedAt: true } });
      if (last) throw new UnoRouterError('RATE_LIMITED', 'This free model is limited to one request per minute. No paid fallback is used.', 429, Math.max(1, Math.ceil((last.startedAt.getTime() + 60000 - Date.now()) / 1000)));
    }
    const run = await tx.awfRun.create({ data: { runCode: `OWNER-CHAT-${randomUUID()}`, trigger: TRIGGER, entityType: 'OWNER_CHAT', entityId: input.conversationId, actorUserId: auth.userId, actorRole: 'SUPER_ADMIN', provider: input.provider, model: input.model, runtimeKey: input.provider === 'local' ? 'owner-local' : 'owner-unorouter-free', status: 'RUNNING', automationMode: 'AI_ASSISTED', input: encryptedInput, output: '', idempotencyKey: key, correlationId: input.requestId, toolCallCount: 0, fallbackUsed: false } });
    await writePortalAudit(tx, auth, 'AI_CHAT_REQUESTED', 'AwfRun', run.id, { provider: input.provider, model: input.model, messageChars: input.message.length, externalConsent: input.externalConsent, toolsEnabled: false }, request);
    return { run, replay: false };
  }, { isolationLevel: 'Serializable' });
  const run = reservation.run;
  if (reservation.replay) return { id: run.id, runCode: run.runCode, status: run.status, reply: run.status === 'COMPLETED' ? decode<{ text: string }>(run.output).text : null, error: run.errorCategory || null, replay: true };
  try {
    // Remote conversations can only reuse previously consented remote turns.
    // A local/private chat is never forwarded when switching to UnoRouter.
    const earlier = await db.awfRun.findMany({ where: { actorUserId: auth.userId, trigger: TRIGGER, entityId: input.conversationId, provider: input.provider, status: 'COMPLETED' }, orderBy: { startedAt: 'desc' }, take: 8 });
    let context = '';
    for (const item of earlier.reverse()) {
      const prior = decode<{ message: string }>(item.input); const reply = decode<{ text: string }>(item.output);
      const pair = `\nUser: ${prior.message}\nAssistant: ${reply.text}\n`;
      context = `${context}${pair}`.slice(-10000);
    }
    const response = await aiGateway({ providerHint: input.provider, model: input.model, privateData: input.provider === 'local', taskType: 'OWNER_CHAT', correlationId: input.requestId, prompt: `${context}\nCurrent user request:\n${input.message}`, systemPrompt: 'You are the ALO Education owner assistant. Answer and draft plans only. You have no CRM record access, shell, publishing, payment, permission or deployment tools in this chat. Never claim you executed a change or that registered agents are operational. Do not invent business records, legal facts, admissions or visa guarantees. Operational changes require a separate authorized human approval workflow.', maxTokens: 1024, timeoutMs: 30000 });
    if (response.provider !== input.provider || response.model !== input.model || response.text.length > 20000) throw new UnoRouterError('INVALID_RESPONSE', 'AI response identity or size could not be verified.');
    await db.$transaction(async tx => {
      await tx.awfRun.update({ where: { id: run.id }, data: { status: 'COMPLETED', endedAt: new Date(), durationMs: Date.now() - run.startedAt.getTime(), output: encryptToken(JSON.stringify({ text: response.text, usage: response.usage })), fallbackUsed: false } });
      await writePortalAudit(tx, auth, 'AI_CHAT_COMPLETED', 'AwfRun', run.id, { provider: input.provider, model: input.model, usage: response.usage, toolsExecuted: 0 }, request);
    });
    return { id: run.id, runCode: run.runCode, status: 'COMPLETED', reply: response.text, replay: false };
  } catch (error) {
    const code = error instanceof UnoRouterError ? error.code : 'INFERENCE_FAILED';
    await db.$transaction(async tx => {
      await tx.awfRun.update({ where: { id: run.id }, data: { status: 'FAILED', endedAt: new Date(), errorCategory: code, errorMessage: 'AI reply was not completed. No production action was executed.' } });
      await writePortalAudit(tx, auth, 'AI_CHAT_FAILED', 'AwfRun', run.id, { provider: input.provider, model: input.model, code }, request);
    });
    if (error instanceof UnoRouterError) throw error;
    throw new UnoRouterError('INFERENCE_FAILED', 'AI reply was not completed. No production action or paid fallback was executed.');
  }
}
