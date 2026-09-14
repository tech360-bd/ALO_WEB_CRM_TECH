// ============================================================
// LanguageTool — Style and Grammar Checker for 25+ Languages
// Source: languagetool-org/languagetool (15k★ 82358 commits, 1.6k forks, Java)
//   languagetool-core (rules per language), server HTTP API /v2/check,
//   segment.srx sentence segmentation, 25+ languages, premium LT cloud.
// ALO use: SOP / CV / personal statement / email / interview answer grammar
//   check — feeds SopDraft + CvReview + AiInterviewAnswer feedback.
// Env: LANGUAGETOOL_URL (self-hosted or https://api.languagetool.org), LANGUAGETOOL_API_KEY
// No new DB — returns matches with offsets, caller stores in existing feedback fields.
// ============================================================

const LT_URL = process.env.LANGUAGETOOL_URL || 'https://api.languagetool.org';
const LT_API_KEY = process.env.LANGUAGETOOL_API_KEY || '';
const LT_USERNAME = process.env.LANGUAGETOOL_USERNAME || '';

export type LTMatch = {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements: string[]; // suggested fixes
  ruleId: string;
  category: string;
  sentence?: string;
};

export type LTCheckResult = {
  language: string;
  matches: LTMatch[];
  sentencesChecked: number;
  premiumHint?: string;
};

/**
 * Check text for grammar/style via LanguageTool HTTP API.
 * Safe: caps at 20k chars, 7s timeout (like fatfreecrm SSRF guard).
 */
export async function checkGrammar(text: string, opts?: { language?: string; enabledOnly?: boolean }): Promise<LTCheckResult> {
  const language = opts?.language || 'en-US'; // en-US for SOPs, supports en-GB, bn (limited)
  const truncated = text.slice(0, 20000);
  if (!truncated.trim()) return { language, matches: [], sentencesChecked: 0 };

  const params = new URLSearchParams({
    text: truncated,
    language,
    enabledOnly: opts?.enabledOnly ? 'true' : 'false',
  });
  if (LT_API_KEY) {
    params.set('apiKey', LT_API_KEY);
    if (LT_USERNAME) params.set('username', LT_USERNAME);
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(`${LT_URL.replace(/\/$/, '')}/v2/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: params.toString(),
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      const txt = await res.text().catch(()=> '');
      throw new Error(`LanguageTool ${res.status}: ${txt.slice(0, 400)}`);
    }
    const json: any = await res.json();
    const matches: LTMatch[] = (json.matches || []).map((m: any) => ({
      message: m.message,
      shortMessage: m.shortMessage,
      offset: m.offset,
      length: m.length,
      replacements: (m.replacements || []).slice(0, 5).map((r: any) => r.value),
      ruleId: m.rule?.id || '',
      category: m.rule?.category?.id || m.rule?.category?.name || 'UNKNOWN',
      sentence: m.sentence,
    }));
    return { language: json.language?.code || language, matches, sentencesChecked: json.sentences?.length || 0 };
  } catch (e: any) {
    clearTimeout(t);
    if (e?.name === 'AbortError') throw new Error('LanguageTool timeout (7s)');
    throw e;
  }
}

/**
 * SopDraft helper — returns corrected preview + inline annotations.
 * Keeps original intact (never auto-apply without counselor review).
 */
export async function checkSopGrammar(sopText: string, language: string = 'en-GB'): Promise<LTCheckResult & { correctedPreview: string }> {
  const result = await checkGrammar(sopText, { language });
  // Build preview by applying first replacement per match in reverse offset order
  let preview = sopText;
  const sorted = [...result.matches].sort((a, b) => b.offset - a.offset);
  for (const m of sorted) {
    if (m.replacements[0]) {
      preview = preview.slice(0, m.offset) + m.replacements[0] + preview.slice(m.offset + m.length);
    }
  }
  return { ...result, correctedPreview: preview };
}
