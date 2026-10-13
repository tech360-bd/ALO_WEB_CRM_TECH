import ZAI from "z-ai-web-dev-sdk";

// Singleton ZAI instance for AI-powered features (interview, chat, SOP, etc.)
// MUST be used in backend only.
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

export async function getZai() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function aiChat(messages: { role: string; content: string }[], options?: { temperature?: number }) {
  const zai = await getZai();
  const completion = await zai.chat.completions.create({
    messages: messages as any,
    thinking: { type: "disabled" },
    temperature: options?.temperature,
  });
  return completion.choices[0]?.message?.content ?? "";
}

// Safe JSON extraction from LLM responses
export function extractJson<T = any>(raw: string): T | null {
  if (!raw) return null;
  // Try direct parse
  try {
    return JSON.parse(raw);
  } catch {}
  // Try to find JSON block
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {}
  }
  // Try to find first { ... last }
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try {
      return JSON.parse(raw.slice(first, last + 1));
    } catch {}
  }
  return null;
}
