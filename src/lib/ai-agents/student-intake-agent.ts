// ============================================================
// ALO public intake — multilingual general guidance with signed-session memory.
// Public identifiers are never authentication; channel-specific webhooks own provider identity.
// AgentDefinition is used only for bounded memory; privacy and reply rules are fixed in code.
// Design: Bengali requirement § full (Aug 14 2026)
// ============================================================

import { createHmac } from 'node:crypto';
import { db } from '@/lib/db';
import { intakeSessionSecret } from './intake-session';
import { detectLanguage } from '@/lib/ai-whatsapp-engine';
import { defaultBusinessHoursConfig, isWithinBusinessHours, type BusinessHoursConfig } from '@/lib/communication/business-hours';
import { loadBusinessHoursConfig } from '@/lib/communication/business-hours-store';

export type Channel = 'website' | 'whatsapp' | 'webchat' | 'facebook';
export type IntakeState = 'ASK_ID' | 'VERIFYING' | 'INFORMED_INDEPENDENT' | 'COUNSELING';

const STUDENT_ID_REGEX = /\b(AE-\d{4}\d{5}|AE-\d{4}\d{6}|ALO-S-\d+|AE-\d{8}|STU-\w+)\b/i;

function redactIntakeMemoryText(value: string): string {
  return value
    .replace(new RegExp(STUDENT_ID_REGEX.source, 'gi'), '[Student ID omitted]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email omitted]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[phone or account number omitted]')
    .replace(/\b(otp|one[- ]time code|password|passcode|pin)\b\s+(?:is\s+)?([A-Za-z0-9!@#$%^&*_-]{4,})/gi, '$1 [credential omitted]')
    .replace(/\b[A-Z]{1,2}[- ]?\d{6,12}\b/gi, '[document number omitted]')
    .replace(/\b(?:\d{1,2}[/-]){2}\d{2,4}\b/g, '[date omitted]')
    .replace(/\b\d{6,19}\b/g, '[number omitted]')
    .slice(0, 1000);
}

export interface IntakeContext {
  channel: Channel;
  senderId: string; // phone or session id
  studentDbId?: string | null;
  studentCode?: string | null;
  state: IntakeState;
  lang: 'bn' | 'en';
  history: Array<{ role: 'user'|'assistant'; content: string; at: string }>;
  officeHours: boolean;
}

// ---- Office hours (Asia/Dhaka) ----
export function isOfficeHours(date = new Date(), config: BusinessHoursConfig = defaultBusinessHoursConfig()): boolean {
  return isWithinBusinessHours(date, config);
}

function replyTemplate(lang: 'bn'|'en', key: string, vars?: Record<string,string>): string {
  const bn: Record<string,string> = {
    ask_id: `স্বাগতম ALO Education-এ! 🎓 আপনি কোন দেশ, পড়াশোনার স্তর ও intake বিবেচনা করছেন? নিরাপত্তার জন্য এই পাবলিক চ্যাটে Student ID, পাসপোর্ট বা ব্যক্তিগত নথি পাঠাবেন না।`,
    ask_id_en: `Welcome to ALO Education! 🎓 Which country, study level, and intake are you considering? For your security, do not share a Student ID, passport, or private document in this public chat.`,
    need_id: `এই পাবলিক চ্যাটে Student ID দিয়ে পরিচয় যাচাই করা যায় না। ব্যক্তিগত সহায়তার জন্য নিরাপদ Student Portal-এ সাইন ইন করুন।`,
    need_id_en: `A Student ID alone does not verify identity in this public chat. Sign in to the secure Student Portal for account-specific help.`,
    verified_independent: `এই পাবলিক চ্যাটে Student ID দিয়ে পরিচয় যাচাই করা হয় না। ব্যক্তিগত আবেদন-তথ্যের জন্য নিরাপদ Student Portal-এ সাইন ইন করুন; সাধারণ ভর্তি-সংক্রান্ত প্রশ্নে আমি সাহায্য করতে পারি।`,
    verified_independent_en: `This public chat does not verify identity from a Student ID. Sign in to the secure Student Portal for account-specific application details; I can help with general admissions questions here.`,
    not_found: `শুধু Student ID দিয়ে পরিচয় যাচাই করা যায় না। ব্যক্তিগত তথ্যের জন্য নিরাপদ Student Portal ব্যবহার করুন।`,
    not_found_en: `A Student ID alone cannot verify identity. Use the secure Student Portal for personal account information.`,
    office_note: `⏰ এটি সাধারণ তথ্যের পাবলিক চ্যাট; ব্যক্তিগত সহায়তার জন্য নিরাপদ Student Portal-এ সাইন ইন করুন।`,
    office_note_en: `⏰ This is a public general-information chat; sign in to the secure Student Portal for account-specific support.`,
  };
  const en: Record<string,string> = {
    ask_id: bn.ask_id_en,
    need_id: bn.need_id_en,
    verified_independent: bn.verified_independent_en,
    not_found: bn.not_found_en,
    office_note: bn.office_note_en,
  };
  const table = lang === 'bn' ? bn : en;
  let t = table[key] || en[key] || bn[key] || key;
  if (vars) for (const [k,v] of Object.entries(vars)) t = t.replaceAll(`{{${k}}}`, v);
  return t;
}

export function extractStudentId(text: string): string | null {
  const m = text.match(STUDENT_ID_REGEX);
  return m ? m[1].toUpperCase() : null;
}

export function decideLang(text: string): 'bn'|'en' {
  const det = detectLanguage(text);
  if (det.language === 'bangla' || det.language === 'mixed') return 'bn';
  // Banglish counts as bn for ask_id
  if (det.language === 'banglish') return 'bn';
  return 'en';
}

// Memory helpers. Pseudonymize channel identifiers before they become database
// keys; never persist a WhatsApp phone number or provider sender ID in memory.
function intakeMemoryKey(senderId: string, channel: Channel): string | null {
  const secret = intakeSessionSecret();
  if (!secret) return null;
  const digest = createHmac('sha256', secret).update(`${channel}:${senderId}`).digest('hex');
  return `intake:${channel}:${digest}`;
}

export async function loadMemory(senderId: string, channel: Channel): Promise<IntakeContext> {
  const key = intakeMemoryKey(senderId, channel);
  const now = new Date();
  const businessHours = await loadBusinessHoursConfig();
  const officeHours = isOfficeHours(now, businessHours);
  try {
    if (key) {
      const agent = await db.agentDefinition.findFirst({ where: { agentCode: 'STUDENT_INTAKE_BN' }, select: { id: true } });
      if (agent) {
        const mem = await db.agentMemory.findFirst({ where: { agentId: agent.id, key, expiresAt: { gt: now } } });
      if (mem) {
        const parsed = JSON.parse(mem.value) as IntakeContext;
        if (parsed && parsed.state) return {
          ...parsed,
          channel,
          senderId,
          studentDbId: null,
          studentCode: null,
          history: Array.isArray(parsed.history) ? parsed.history.slice(-20).map((turn) => ({ ...turn, content: redactIntakeMemoryText(String(turn.content || '')) })) : [],
          officeHours,
        };
      }
      }
    }
  } catch (error) {
    console.error('[student-intake] memory load failed', { error: error instanceof Error ? error.name : 'UnknownError' });
  }
  // Public session IDs are not student IDs. Do not fall back to querying
  // student timelines by a client-supplied or chat-session identifier.
  return { channel, senderId, studentDbId: null, studentCode: null, state: 'ASK_ID', lang: 'bn', history: [], officeHours };
}

export async function saveMemory(ctx: IntakeContext) {
  const key = intakeMemoryKey(ctx.senderId, ctx.channel);
  if (!key) return;
  try {
    const agent = await db.agentDefinition.findFirst({ where: { agentCode: 'STUDENT_INTAKE_BN' }, select: { id: true } });
    if (!agent) return;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const value = JSON.stringify({ ...ctx, senderId: '[sender omitted]', studentDbId: null, studentCode: null, officeHours: undefined });
    await db.agentMemory.upsert({
      where: { agentId_key: { agentId: agent.id, key } },
      update: { value, expiresAt },
      create: { agentId: agent.id, key, value, memoryType: 'intake', expiresAt },
    });
  } catch (error) {
    console.error('[student-intake] memory save failed', { error: error instanceof Error ? error.name : 'UnknownError' });
  }
}

// Public intake never authenticates a student from a typed identifier. Account
// ownership is established only by the authenticated portal/OTP flow.
export async function verifyAndInform(studentIdInput: string, lang: 'bn'|'en', officeHours = false): Promise<{ ok: boolean; studentDbId?: string; studentCode?: string; reply: string }> {
  const raw = studentIdInput.trim().toUpperCase();
  if (raw === 'NEW' || raw === 'নতুন' || raw === 'NOTUN') {
    const msg = lang === 'bn'
      ? 'নতুন প্রোফাইল তৈরি করতে নিরাপদ Student Portal-এ সাইন আপ করুন। এই চ্যাটে আপনার পরিচয় যাচাই বা ব্যক্তিগত নথি সংরক্ষণ করা হয় না।'
      : 'To create a profile, sign up through the secure Student Portal. This public chat does not verify identity or store personal documents.';
    return { ok: false, reply: msg };
  }
  const message = lang === 'bn'
    ? 'আপনার গোপনীয়তার জন্য, শুধু Student ID দিয়ে এই চ্যাটে অ্যাকাউন্ট বা ব্যক্তিগত তথ্য যাচাই করা যায় না। নিরাপদ Student Portal-এ সাইন ইন করুন। এই চ্যাটে কখনো OTP শেয়ার করবেন না; সাধারণ ভর্তি-সংক্রান্ত প্রশ্নে আমি সাহায্য করতে পারি।'
    : 'For your privacy, a Student ID alone cannot verify an account or reveal personal information in this chat. Sign in to the secure Student Portal. Never share an OTP in this chat; I can still help with general admissions questions.';
  return { ok: false, reply: message + (officeHours ? `\n\n${replyTemplate(lang, 'office_note')}` : '') };
}

// Main handler — sequential, memory-aware, deterministic public-safe replies
export async function handleIntakeMessage(params: {
  channel: Channel;
  senderId: string;
  text: string;
  mediaType?: 'document'|'image'|'audio'|'voice'|'video'|null;
  mediaInfo?: { fileName?: string; mime?: string; mediaId?: string; transcription?: string };
}): Promise<{ reply: string; context: IntakeContext; studentDbId?: string|null; studentCode?: string|null }> {
  const { channel, senderId, mediaType } = params;
  let text = (params.text || '').trim();
  // Voice transcription already provided as text if voice
  if (mediaType === 'audio' || mediaType === 'voice') {
    const tr = params.mediaInfo?.transcription || text;
    text = tr || '[Voice note]';
  }

  const lang: 'bn'|'en' = decideLang(text || params.mediaInfo?.fileName || '');
  let ctx = await loadMemory(senderId, channel);
  ctx.lang = lang;
  // Append user turn to history (sequential)
  ctx.history.push({ role: 'user', content: redactIntakeMemoryText(text), at: new Date().toISOString() });
  if (ctx.history.length > 20) ctx.history = ctx.history.slice(-20);

  if (mediaType === 'document' || mediaType === 'image' || mediaType === 'video') {
    const reply = lang === 'bn'
      ? 'এই পাবলিক চ্যাটে নথি আপলোড বা পর্যালোচনা করা হয় না। নিরাপদ Student Portal-এর Documents অংশ ব্যবহার করুন।'
      : 'This public chat does not accept or review document uploads. Use the Documents section of the secure Student Portal.';
    return { reply, context: ctx, studentDbId: null, studentCode: null };
  }
  if ((mediaType === 'audio' || mediaType === 'voice') && !params.mediaInfo?.transcription) {
    const reply = lang === 'bn' ? 'এই চ্যাটে ভয়েস নোট ট্রান্সক্রিপশন সংযুক্ত নেই। অনুগ্রহ করে আপনার প্রশ্নটি লিখে পাঠান।' : 'No verified voice transcription is available in this chat. Please type your question.';
    return { reply, context: ctx, studentDbId: null, studentCode: null };
  }

  // The public endpoint has no portal/OTP assertion, so keep this context public-only.
  ctx.studentDbId = null;
  ctx.studentCode = null;
  const maybeId = extractStudentId(text);
  if (maybeId) {
    const verificationNotice = await verifyAndInform(maybeId, lang, ctx.officeHours);
    ctx.state = 'COUNSELING';
    if (ctx.history.length) ctx.history[ctx.history.length - 1] = { role: 'user', content: '[Student ID omitted]', at: new Date().toISOString() };
    ctx.history.push({ role: 'assistant', content: redactIntakeMemoryText(verificationNotice.reply), at: new Date().toISOString() });
    await saveMemory(ctx);
    return { reply: verificationNotice.reply, context: ctx, studentDbId: null, studentCode: null };
  }

  const counsel = safePublicReply({ text, lang });
  ctx.history.push({ role: 'assistant', content: redactIntakeMemoryText(counsel), at: new Date().toISOString() });
  ctx.state = 'COUNSELING';
  await saveMemory(ctx);
  return { reply: counsel, context: ctx, studentDbId: null, studentCode: null };
}

// The public intake route has no verified, current university/visa knowledge corpus.
// Keep responses deterministic and non-factual rather than returning unsupported
// model claims to a visitor. Staff-facing AI drafts can be generated separately
// through the approval workflow when a vetted context is available.
function safePublicReply(opts: { text: string; lang: 'bn' | 'en' }): string {
  const { text, lang } = opts;
  const mentionsSensitiveData = /\b(passport|bank statement|bank account|card number|card pin|otp|password|student id|identity document)\b|পাসপোর্ট|ব্যাংক|ওটিপি|পাসওয়ার্ড|কার্ড|পিন|স্টুডেন্ট আইডি/i.test(text);
  if (lang === 'bn') {
    if (mentionsSensitiveData) return 'আপনার নিরাপত্তার জন্য এই পাবলিক চ্যাটে Student ID, পাসপোর্ট, ব্যাংক/কার্ড তথ্য, OTP, পাসওয়ার্ড বা ব্যক্তিগত নথি পাঠাবেন না। অ্যাকাউন্ট-সম্পর্কিত সহায়তার জন্য নিরাপদ Student Portal-এ সাইন ইন করুন বা অনুমোদিত ALO কাউন্সেলরের সঙ্গে যোগাযোগ করুন।';
    if (/visa|ভিসা|cas|i-20|coe/i.test(text)) return 'ভিসা বা যোগ্যতা সম্পর্কে চূড়ান্ত সিদ্ধান্ত এই পাবলিক চ্যাটে দেওয়া হয় না। শর্ত দেশ, প্রতিষ্ঠান ও সময় অনুযায়ী বদলাতে পারে—বর্তমান সরকারি/বিশ্ববিদ্যালয়ের অফিসিয়াল উৎসে যাচাই করুন বা ALO ভিসা কর্মকর্তার পরামর্শ নিন। এখানে ব্যক্তিগত নথি পাঠাবেন না।';
    if (/uk|যুক্তরাজ্য|canada|কানাডা|australia|অস্ট্রেলিয়া|course|কোর্স|university|বিশ্ববিদ্যালয়/i.test(text)) return 'সাধারণ কোর্স/দেশ তুলনায় সাহায্য করতে পারি। আপনার পছন্দের দেশ, পড়াশোনার স্তর ও সম্ভাব্য intake জানান—কোনো Student ID বা ব্যক্তিগত নথি নয়। নির্দিষ্ট ভর্তি/ভিসার শর্ত বর্তমান অফিসিয়াল উৎসে যাচাই করুন; কোনো ফলাফল নিশ্চিত নয়।';
    return 'ALO Education-এ যোগাযোগের জন্য ধন্যবাদ। সাধারণ সহায়তার জন্য আপনার পছন্দের দেশ, পড়াশোনার স্তর ও সম্ভাব্য intake জানাতে পারেন। অ্যাকাউন্ট-সম্পর্কিত প্রশ্নের জন্য নিরাপদ Student Portal ব্যবহার করুন; এই পাবলিক চ্যাটে ব্যক্তিগত তথ্য বা নথি পাঠাবেন না।';
  }
  if (mentionsSensitiveData) return 'For your security, do not share a Student ID, passport, bank/card details, OTP, password or private document in this public chat. Sign in to the secure Student Portal or contact an authorized ALO counselor for account-specific help.';
  if (/visa|cas|i-20|coe|eligib|refusal/i.test(text)) return 'This public chat cannot make a final visa or eligibility decision. Requirements change by destination, institution and time; verify current rules through official government/university sources or an ALO visa officer. Do not send private documents here.';
  if (/uk|united kingdom|canada|australia|course|university|program/i.test(text)) return 'I can help with a general course or destination comparison. Share only your preferred country, study level and intended intake—no Student ID or private documents. Verify specific admission and visa requirements with current official sources; no outcome is guaranteed.';
  return 'Thanks for contacting ALO Education. For general help, you may share your preferred destination, study level and intended intake. Use the secure Student Portal for account-specific questions and do not send personal identifiers or documents in this public chat.';
}
