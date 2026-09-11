import { OpenAI } from "openai";

let openaiInstance: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build-safety",
    });
  }
  return openaiInstance;
}

export async function aiChat(messages: any[], options: any = {}): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const formattedMessages = messages.map((m) => {
      if (typeof m === "string") return { role: "user", content: m };
      return {
        role: m.role || "user",
        content: m.content || m.text || "",
      };
    });

    const response = await openai.chat.completions.create({
      model: options.model || "gpt-4o-mini",
      messages: formattedMessages as any,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 2000,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("[aiChat Error]:", error);
    return `AI response failed: ${error.message}`;
  }
}

export function extractJson(text: string): any {
  if (!text) return null;
  try {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/i;
    const match = text.match(jsonRegex);
    const cleanText = match ? match[1].trim() : text.trim();
    return JSON.parse(cleanText);
  } catch (e) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (innerError) {
        console.error("JSON boundary extraction failed", innerError);
      }
    }
    return { error: "Failed to parse JSON response", rawText: text };
  }
}

export function getZai() {
  const openai = getOpenAIClient();
  return {
    chat: {
      completions: {
        create: async (params: any) => {
          return openai.chat.completions.create(params);
        },
      },
    },
  };
}

export async function generateText(prompt: string, options: any = {}): Promise<string> {
  return aiChat([{ role: "user", content: prompt }], options);
}

export async function generateVideo(prompt: string, options: any = {}): Promise<any> {
  return {
    success: true,
    message: "Video generation simulation triggered.",
    prompt,
    url: "/images/brand/alo-edu-pad.jpg",
  };
}

export default {
  aiChat,
  extractJson,
  getZai,
  generateText,
  generateVideo,
};
