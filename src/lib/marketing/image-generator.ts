// Simple size-aware image generator placeholder
// Real provider (SDXL / DALL·E / Gemini Imagen) can be swapped via ENV
// For now generates deterministic placeholder URL + prompt + brand overlay handling.
// Integrates brand kit so logo/address/phone/whatsapp are never forgotten.

import { BrandKit, SIZE_MATRIX, promptWithBrand } from "@/lib/marketing/brand-kit";

export type SizeKey = keyof typeof SIZE_MATRIX;

export interface GenerateImageInput {
  title: string;
  ideaOrCaption: string;
  category: string;
  size: SizeKey | string;
  platform: string;
  brandKit: BrandKit;
}

// Returns placeholder CDN url + the exact prompt sent (for audit)
export async function generateBrandedImage(input: GenerateImageInput): Promise<{ imageUrl: string; prompt: string; w: number; h: number }> {
  const sizeKey = (input.size as string) in SIZE_MATRIX ? (input.size as string as SizeKey) : "SQUARE";
  const size = SIZE_MATRIX[sizeKey] || SIZE_MATRIX.SQUARE;
  const basePrompt = `Educational social media visual for "${input.title}" — ${input.category}. Caption idea: ${input.ideaOrCaption}. Style: modern flat, clean, professional, Bangladeshi students audience, no visa guarantee.`;
  const prompt = promptWithBrand(basePrompt, input.brandKit, `${size.w}x${size.h} ${size.label}`);

  // If real key is set, call provider — otherwise placeholder
  const apiKey = process.env.IMAGE_GEN_API_KEY || process.env.OPENAI_API_KEY || "";
  const provider = process.env.IMAGE_GEN_PROVIDER || ""; // e.g. "openai-dalle" | "stability" | "gemini"

  // Provider hook (stub): in production replace with fetch to provider and upload to CDN
  if (apiKey && provider) {
    // Intentionally not implemented here — keep additive, return placeholder with note
    console.log(`[image-generator] provider ${provider} would be called with prompt len ${prompt.length}`);
  }

  // Deterministic placeholder (picsum + overlay hints as query)
  const seed = encodeURIComponent(input.title.slice(0, 30));
  const placeholderUrl = `https://picsum.photos/seed/${seed}/${size.w}/${size.h}`;
  // In production: after generation, overlay logo/footer server-side (sharp) and upload to R2/S3
  return { imageUrl: placeholderUrl, prompt, w: size.w, h: size.h };
}

export async function generateBrandedVideo(input: { title: string; script: string; size: SizeKey | string; brandKit: BrandKit; platform: string }) {
  const sizeKey = (input.size as string) in SIZE_MATRIX ? (input.size as string as SizeKey) : "STORY";
  const size = SIZE_MATRIX[sizeKey] || SIZE_MATRIX.STORY;
  const prompt = promptWithBrand(`Video storyboard: ${input.script.slice(0, 300)}`, input.brandKit, `${size.w}x${size.h} ${size.label}`);
  // Placeholder — returns script + prompt, real render via Replicate/Runway later
  return { videoUrl: "", prompt, w: size.w, h: size.h, script: input.script };
}
