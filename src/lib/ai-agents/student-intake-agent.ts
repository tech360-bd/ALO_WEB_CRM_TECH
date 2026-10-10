// ============================================================
// ALO Student Intake AI Agent — first asks Student ID, then independent-application + multilingual + doc/voice + memory + sequential + office-hours
// Channels: website, counselor WhatsApp, web chat, Facebook — one brain
// Managed via Super-Admin Dashboard (AiAgent / AgentDefinition)
// Design: Bengali requirement § full (Aug 14 2026)
// ============================================================

import { db } from '@/lib/db';
import { isCanonicalStudentCode } from '@/lib/student/canonical-student';
import { detectLanguage } from '@/lib/ai-whatsapp-engine';

export type Channel = 'website' | 'whatsapp' | 'webchat' | 'facebook';
export type IntakeState = 'ASK_ID' | 'VERIFYING' | 'INFORMED_INDEPENDENT' | 'COUNSELING';

const STUDENT_ID_REGEX = /\b(AE-\d{4}\d{5}|AE-\d{4}\d{6}|ALO-S-\d+|AE-\d{8}|STU-\w+)\b/i;

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
export function isOfficeHours(date = new Date()): boolean {
  // Dhaka UTC+6, office 10:00-19:00 Sat-Thu (Fri weekend light, but agent still "human-like" 10-19)
  const dhakaHour = (date.getUTCHours() + 6) % 24;
  const day = new Date(date.getTime() + 6 * 60 * 60 * 1000).getUTCDay(); // 0 Sun ... 5 Fri 6 Sat
  const isFriday = day === 5;
  if (isFriday) return false; // minimal human, but AI still acts "human-like" — we return false to add disclaimer
  return dhakaHour >= 10 && dhakaHour < 19;
}

function replyTemplate(lang: 'bn'|'en', key: string, vars?: Record<string,string>): string {
  const bn: Record<string,string> = {
    ask_id: `স্বাগতম ALO Education-এ! 🎓 অনুগ্রহ করে আপনার **স্টুডেন্ট আইডি** (যেমন AE-2025000123) শেয়ার করুন। আইডি না থাকলে "নতুন" লিখুন — আমরা স্বয়ংক্রিয়ভাবে আইডি তৈরি করে দেব।`,
    ask_id_en: `Welcome to ALO Education! 🎓 Please share your **Student ID** (e.g. AE-2025000123). If you don't have one, type "new" — we'll auto-create it.`,
    need_id: `আপনার স্টুডেন্ট আইডিটি প্রয়োজন যাচাইয়ের জন্য। অনুগ্রহ করে আইডিটি পাঠান।`,
    need_id_en: `Your Student ID is needed for verification. Please send it.`,
    verified_independent: `ধন্যবাদ, {{name}}! ✅ আপনার স্টুডেন্ট আইডি **{{id}}** যাচাই করা হয়েছে। আপনি **কোনো সহায়তা ছাড়াই স্বাধীনভাবে আপনার আবেদন জমা দিতে পারবেন** — পোর্টালে লগইন করে "My Applications" → "New Application" থেকে শুরু করুন। প্রয়োজন হলে আমি ধাপে ধাপে সহায়তা করব।`,
    verified_independent_en: `Thank you, {{name}}! ✅ Your Student ID **{{id}}** is verified. You can **submit your application independently without any assistance** — login to the portal → "My Applications" → "New Application" to start. I'll guide you step by step if needed.`,
    not_found: `দুঃখিত, এই আইডিটি পাওয়া যায়নি। সঠিক আইডিটি আবার পাঠান অথবা "নতুন" লিখুন — আমরা নতুন আইডি তৈরি করে দেব।`,
    not_found_en: `Sorry, this ID was not found. Please resend the correct ID or type "new" to auto-create one.`,
    office_note: `⏰ এখন অফিস সময় (সকাল ১০টা–সন্ধ্যা ৭টা, Asia/Dhaka) — আমি মানুষের মতো পর্যায়ক্রমে উত্তর দিচ্ছি।`,
    office_note_en: `⏰ Office hours (10am–7pm Asia/Dhaka) — replying sequentially like a human.`,
    doc_received: `আপনার নথিটি পেয়েছি ({{type}}) — বিশ্লেষণ করে পরামর্শ দিচ্ছি...`,
    doc_received_en: `Received your document ({{type}}) — analysing and advising...`,
    voice_received: `ভয়েস নোট পেয়েছি — ট্রান্সক্রাইব করে উত্তর দিচ্ছি...`,
    voice_received_en: `Received voice note — transcribing and replying...`,
  };
  const en: Record<string,string> = {
    ask_id: bn.ask_id_en,
    need_id: bn.need_id_en,
    verified_independent: bn.verified_independent_en,
    not_found: bn.not_found_en,
    office_note: bn.office_note_en,
    doc_received: bn.doc_received_en,
    voice_received: bn.voice_received_en,
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

// Memory helpers (AgentMemory + fallback Timeline)
export async function loadMemory(senderId: string, channel: Channel): Promise<IntakeContext> {
  const key = `intake:${channel}:${senderId}`;
  // Try AgentMemory via AgentDefinition named intake
  try {
    const agent = await db.agentDefinition.findFirst({ where: { agentCode: 'STUDENT_INTAKE_BN' } }).catch(()=>null)
      || await db.aiAgent.findFirst({ where: { agentCode: 'STUDENT_INTAKE_BN' } }).catch(()=>null);
    const agentId = (agent as any)?.id || 'intake-agent';
    const mem = await db.agentMemory.findFirst({ where: { agentId, key } }).catch(()=>null);
    if (mem) {
      const parsed = JSON.parse(mem.value) as IntakeContext;
      if (parsed && parsed.state) return { ...parsed, officeHours: isOfficeHours() };
    }
  } catch {}
  // Fallback: timeline last 5 for sender
  let history: IntakeContext['history'] = [];
  try {
    const rows = await db.timelineEvent.findMany({ where: { studentId: senderId } as any, take: 5, orderBy: { createdAt: 'desc' } }).catch(()=>[]);
    history = rows.map((r:any)=> ({ role: 'assistant' as const, content: r.title || '', at: r.createdAt?.toISOString?.() || new Date().toISOString() }));
  } catch {}
  return { channel, senderId, studentDbId: null, studentCode: null, state: 'ASK_ID', lang: 'bn', history, officeHours: isOfficeHours() };
}

export async function saveMemory(ctx: IntakeContext) {
  const key = `intake:${ctx.channel}:${ctx.senderId}`;
  try {
    const agent = await db.agentDefinition.findFirst({ where: { agentCode: 'STUDENT_INTAKE_BN' } }).catch(()=>null);
    const agentId = (agent as any)?.id;
    if (!agentId) {
      // Fallback to timeline-only memory
      await db.timelineEvent.create({ data: { studentId: ctx.senderId, stage: 'AI_MEMORY', title: `INTAKE:${ctx.state}:${ctx.studentCode||''}`, description: JSON.stringify(ctx.history.slice(-3)) } as any }).catch(()=>{});
      return;
    }
    const existing = await db.agentMemory.findFirst({ where: { agentId, key } }).catch(()=>null);
    const value = JSON.stringify({ ...ctx, officeHours: undefined });
    if (existing) await db.agentMemory.update({ where: { id: existing.id }, data: { value } }).catch(()=>{});
    else await db.agentMemory.create({ data: { agentId, key, value, memoryType: 'intake' } as any }).catch(()=>{});
  } catch {}
}

// Verify Student ID and inform independent-application
export async function verifyAndInform(studentIdInput: string, lang: 'bn'|'en'): Promise<{ ok: boolean; studentDbId?: string; studentCode?: string; name?: string; reply: string }> {
  const raw = studentIdInput.trim().toUpperCase();
  if (raw === 'NEW' || raw === 'নতুন' || raw === 'NOTUN') {
    // Caller will auto-create via /api/documents/auto-upload — here we just guide
    const msg = lang === 'bn'
      ? `ঠিক আছে — "নতুন" লিখেছেন। অনুগ্রহ করে আপনার পূর্ণ নাম, ইমেইল ও ফোন নম্বর পাঠান; এবং যে নথিটি আপলোড করতে চান সেটি পাঠান — আমরা স্বয়ংক্রিয়ভাবে স্টুডেন্ট আইডি (AE-YYYYXXXXXX) তৈরি করে নথি সংরক্ষণ করব।`
      : `Understood — you typed "new". Please send your full name, email & phone and the document you want to upload — we'll auto-create your Student ID (AE-YYYYXXXXXX) and save the document.`;
    return { ok: false, reply: msg };
  }
  // Try find by studentId code, then by legacy, then by id
  let s: any = null;
  if (isCanonicalStudentCode(raw)) {
    s = await db.student.findUnique({ where: { studentId: raw } }).catch(()=>null);
  }
  if (!s) s = await db.student.findUnique({ where: { studentId: raw } as any }).catch(()=>null);
  if (!s) s = await db.student.findFirst({ where: { studentId: raw } as any }).catch(()=>null);
  if (!s) s = await db.student.findUnique({ where: { id: raw } }).catch(()=>null);
  if (!s && raw.includes('@')) s = await db.student.findFirst({ where: { email: raw.toLowerCase() } }).catch(()=>null);

  if (!s) {
    return { ok: false, reply: replyTemplate(lang, 'not_found') };
  }
  const name = s.name || s.fullName || 'শিক্ষার্থী';
  const code = s.studentId || raw;
  const reply = replyTemplate(lang, 'verified_independent', { name, id: code }) + (isOfficeHours() ? `\n\n${replyTemplate(lang,'office_note')}` : '');
  return { ok: true, studentDbId: s.id, studentCode: code, name, reply };
}

// Main handler — sequential, memory-aware, office-hours human-like
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
  ctx.history.push({ role: 'user', content: text.slice(0, 1000), at: new Date().toISOString() });
  if (ctx.history.length > 20) ctx.history = ctx.history.slice(-20);

  // If already verified and in counseling, go straight to counseling (but still support "my id is X" mid-thread)
  const maybeId = extractStudentId(text);

  if (ctx.state === 'ASK_ID') {
    if (maybeId) {
      const ver = await verifyAndInform(maybeId, lang);
      if (ver.ok) {
        ctx.state = 'INFORMED_INDEPENDENT';
        ctx.studentDbId = ver.studentDbId!;
        ctx.studentCode = ver.studentCode!;
        ctx.history.push({ role: 'assistant', content: ver.reply, at: new Date().toISOString() });
        await saveMemory(ctx);
        return { reply: ver.reply, context: ctx, studentDbId: ctx.studentDbId, studentCode: ctx.studentCode };
      } else {
        // not found — keep asking but include guidance
        ctx.history.push({ role: 'assistant', content: ver.reply, at: new Date().toISOString() });
        await saveMemory(ctx);
        return { reply: ver.reply, context: ctx };
      }
    }
    // No ID yet — ask for ID (first turn)
    const ask = replyTemplate(lang, 'ask_id');
    const withOffice = isOfficeHours() ? `${ask}\n\n${replyTemplate(lang,'office_note')}` : ask;
    ctx.history.push({ role: 'assistant', content: withOffice, at: new Date().toISOString() });
    await saveMemory(ctx);
    return { reply: withOffice, context: ctx };
  }

  if (ctx.state === 'INFORMED_INDEPENDENT' || ctx.state === 'COUNSELING') {
    // If user sends new ID mid-thread, re-verify
    if (maybeId && maybeId !== ctx.studentCode) {
      const ver = await verifyAndInform(maybeId, lang);
      ctx.history.push({ role: 'assistant', content: ver.reply, at: new Date().toISOString() });
      if (ver.ok) { ctx.studentDbId = ver.studentDbId!; ctx.studentCode = ver.studentCode!; }
      await saveMemory(ctx);
      return { reply: ver.reply, context: ctx, studentDbId: ctx.studentDbId, studentCode: ctx.studentCode };
    }

    // Document / voice receipt — already stored via /api/documents/auto-upload in parallel; here we acknowledge
    if (mediaType === 'document' || mediaType === 'image') {
      const ack = replyTemplate(lang, 'doc_received', { type: params.mediaInfo?.fileName || mediaType });
      ctx.history.push({ role: 'assistant', content: ack, at: new Date().toISOString() });
      // Fall through to counseling answer after ack — combine
      const counsel = await counselWithRag({ text, lang, studentDbId: ctx.studentDbId, history: ctx.history, mediaType, mediaInfo: params.mediaInfo });
      const combined = `${ack}\n\n${counsel}`;
      ctx.history.push({ role: 'assistant', content: combined, at: new Date().toISOString() });
      ctx.state = 'COUNSELING';
      await saveMemory(ctx);
      return { reply: combined, context: ctx, studentDbId: ctx.studentDbId, studentCode: ctx.studentCode };
    }
    if (mediaType === 'audio' || mediaType === 'voice') {
      const ack = replyTemplate(lang, 'voice_received');
      const counsel = await counselWithRag({ text, lang, studentDbId: ctx.studentDbId, history: ctx.history, mediaType, mediaInfo: params.mediaInfo });
      const combined = `${ack}\n\n${counsel}`;
      ctx.history.push({ role: 'assistant', content: combined, at: new Date().toISOString() });
      ctx.state = 'COUNSELING';
      await saveMemory(ctx);
      return { reply: combined, context: ctx, studentDbId: ctx.studentDbId, studentCode: ctx.studentCode };
    }

    // Normal counseling (Bangla/English, university/country advice)
    const counsel = await counselWithRag({ text, lang, studentDbId: ctx.studentDbId, history: ctx.history, mediaType: null });
    const withOffice = isOfficeHours() && ctx.officeHours ? counsel : counsel; // office note already in verify step; keep counseling clean
    ctx.history.push({ role: 'assistant', content: withOffice, at: new Date().toISOString() });
    ctx.state = 'COUNSELING';
    await saveMemory(ctx);
    // Sequential: ensure no parallel replies — caller should await this before next (queue per senderId via DB lock)
    return { reply: withOffice, context: ctx, studentDbId: ctx.studentDbId, studentCode: ctx.studentCode };
  }

  // Fallback
  ctx.state = 'ASK_ID';
  await saveMemory(ctx);
  return { reply: replyTemplate(lang,'ask_id'), context: ctx };
}

// RAG counseling — university/country advice, multilingual, logical
async function counselWithRag(opts: { text: string; lang: 'bn'|'en'; studentDbId?: string|null; history: IntakeContext['history']; mediaType?: string|null; mediaInfo?: any }): Promise<string> {
  const { text, lang, studentDbId, history } = opts;
  const hint = text.slice(0, 1500);
  // Try AI gateway for real RAG (Groq real), fallback to rule-based
  try {
    const { aiGateway } = await import('@/lib/ai-gateway');
    const studentLine = studentDbId ? `StudentDbId: ${studentDbId}` : 'New lead';
    const systemBn = `আপনি ALO Education-এর ভর্তি এআই কাউন্সেলর। বাংলায় যৌক্তিক, সংক্ষিপ্ত, সহায়ক উত্তর দিন। ভিসা/ভর্তির গ্যারান্টি দেবেন না। অজানা তথ্য "যাচাই প্রয়োজন" বলুন। ${studentLine}. পূর্বের কথোপকথন মনে রাখুন। বিশ্ববিদ্যালয়/দেশের পরামর্শ দিন (UK, Canada, Australia, USA) এবং পরবর্তী ধাপ বলুন।`;
    const systemEn = `You are ALO Education admission AI counselor. Reply logically, concisely, helpfully in English. Never guarantee admission/visa. Say "needs verification" when unsure. ${studentLine}. Remember history. Advise university/country (UK, Canada, Australia, USA) and next step.`;
    const recent = history.slice(-6).map(h=> `${h.role}: ${h.content}`).join('\n');
    const prompt = `User (${lang}): ${hint}\n\nRecent:\n${recent}\n\nAnswer in ${lang === 'bn' ? 'Bangla' : 'English'} (match user language). Include 1-2 university/country suggestions if inquiry, and clear next step.`;
    const gw = await aiGateway({ prompt, systemPrompt: lang==='bn'? systemBn : systemEn, taskType: 'COUNSELING', privateData: true, maxTokens: 500, temperature: 0.3 }).catch(()=>null);
    if (gw && gw.text) return gw.text.slice(0, 1500);
  } catch {}
  // Rule fallback (still logical, multilingual)
  if (lang === 'bn') {
    if (/uk|যুক্তরাজ্য/i.test(text)) return `যুক্তরাজ্যের জন্য (UK): University of Manchester / Leeds / Birmingham — MSc Data Science, MBA, Public Health ভালো বিকল্প। IELTS 6.5 (no band <6.0), CAS-এর জন্য unconditional offer প্রয়োজন। পরবর্তী ধাপ: আপনার ট্রান্সক্রিপ্ট ও IELTS পাঠান, আমি ম্যাচ যাচাই করে দেব।`;
    if (/canada|কানাডা/i.test(text)) return `কানাডা: University of Toronto / UBC / Waterloo — PGWP সুবিধা, SDS ক্যাটাগরিতে ফান্ড 6 মাস দেখাতে হয়। IELTS 6.0-6.5। পরবর্তী ধাপ: ব্যাংক স্টেটমেন্ট ও SOP পাঠান।`;
    if (/australia|অস্ট্রেলিয়া/i.test(text)) return `অস্ট্রেলিয়া: Monash / UNSW / Deakin — July/Sept intake, GTE প্রয়োজন। IELTS 6.5। পরবর্তী ধাপ: GTE ডকুমেন্ট ও পাসপোর্ট পাঠান।`;
    return `ধন্যবাদ! আপনার প্রশ্নটি বুঝেছি। আপনার প্রোফাইল (শিক্ষা, IELTS, বাজেট, দেশ পছন্দ) শেয়ার করুন — আমি 2-3টি উপযুক্ত বিশ্ববিদ্যালয় ও দেশের তুলনা এবং পরবর্তী ধাপ (নথি তালিকা / আবেদন) পর্যায়ক্রমে জানাব।`;
  } else {
    if (/uk/i.test(text)) return `For UK: University of Manchester / Leeds / Birmingham — MSc Data Science, MBA, Public Health are strong fits. IELTS 6.5 (no band <6.0), unconditional offer for CAS. Next step: send transcript & IELTS for match check.`;
    if (/canada/i.test(text)) return `Canada: University of Toronto / UBC / Waterloo — PGWP eligible, SDS needs 6-month funds. IELTS 6.0-6.5. Next step: send bank statement & SOP.`;
    if (/australia/i.test(text)) return `Australia: Monash / UNSW / Deakin — July/Sept intake, GTE required. IELTS 6.5. Next step: send GTE docs & passport.`;
    return `Got it! Share your profile (education, IELTS, budget, country preference) — I'll suggest 2-3 suitable universities/countries and the next step (documents / application) sequentially.`;
  }
}
