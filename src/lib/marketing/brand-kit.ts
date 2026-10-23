import { db } from "@/lib/db";

export interface BrandKit {
  logoUrl: string; // CDN url
  logoName: string;
  address: string;
  phone: string;
  whatsapp: string;
  website: string;
  primary: string; // #0057B8
  cta: string; // #E8501A
}

function parseAsset(value?: string): Record<string, unknown> {
  try { const parsed = JSON.parse(value || '{}'); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}; } catch { return {}; }
}
function safeText(value: unknown, max: number): string { return typeof value === 'string' && value.length <= max && !/[\x00-\x1f]/.test(value) ? value.trim() : ''; }
function safeUrl(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048) return '';
  if (/^\/(?!\/)[a-zA-Z0-9/_.-]+$/.test(value) && !value.split('/').includes('..')) return value;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : ''; } catch { return ''; }
}
function safePhone(value: unknown): string { return typeof value === 'string' && /^\+[1-9]\d{7,14}$/.test(value) ? value : ''; }
function safeColor(value: unknown): string { return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : ''; }

export async function getBrandKit(): Promise<BrandKit> {
  // Never imprint invented contact details when brand settings are unavailable.
  const fallback: BrandKit = {
    logoUrl: "",
    logoName: "",
    address: "",
    phone: "",
    whatsapp: "",
    website: "",
    primary: "#0057B8",
    cta: "#E8501A",
  };
  try {
    const assets = await db.brandAsset.findMany({ where: { isActive: true } });
    const logo = assets.find(a => a.assetType === "LOGO");
    const kit = assets.find(a => a.assetType === "BRAND_KIT");
    const kitVal = parseAsset(kit?.value);
    const logoVal = parseAsset(logo?.value);
    return {
      logoUrl: safeUrl(kitVal.logoUrl) || safeUrl(logoVal.fileUrl) || safeUrl(logoVal.url),
      logoName: safeText(kitVal.logoName, 120) || safeText(logo?.name, 120),
      address: safeText(kitVal.address, 240),
      phone: safePhone(kitVal.phone), whatsapp: safePhone(kitVal.whatsapp),
      website: safeUrl(kitVal.website),
      primary: safeColor(kitVal.primary) || fallback.primary,
      cta: safeColor(kitVal.cta) || fallback.cta,
    };
  } catch {
    return fallback;
  }
}

export function composeBrandOverlayText(kit: BrandKit, opts?: { includeAddress?: boolean }) {
  const parts: string[] = [];
  if (kit.phone) parts.push(`☎ ${kit.phone}`);
  if (kit.whatsapp) parts.push(`WhatsApp: ${kit.whatsapp}`);
  if (kit.website) parts.push(kit.website);
  if (opts?.includeAddress && kit.address) parts.push(kit.address);
  return parts.join("  •  ");
}

// Size matrix for auto image/video generation
export const SIZE_MATRIX: Record<string, { w: number; h: number; label: string; platforms: string[] }> = {
  SQUARE: { w: 1080, h: 1080, label: "Square 1:1", platforms: ["FACEBOOK","INSTAGRAM","LINKEDIN"] },
  PORTRAIT: { w: 1080, h: 1350, label: "Portrait 4:5", platforms: ["FACEBOOK","INSTAGRAM"] },
  LANDSCAPE: { w: 1200, h: 628, label: "Landscape 1.91:1", platforms: ["FACEBOOK","LINKEDIN","BLOG"] },
  STORY: { w: 1080, h: 1920, label: "Story 9:16", platforms: ["INSTAGRAM","TIKTOK","YOUTUBE","WHATSAPP_STATUS"] },
  YT_THUMB: { w: 1280, h: 720, label: "YouTube Thumb 16:9", platforms: ["YOUTUBE","BLOG"] },
};

export function promptWithBrand(basePrompt: string, kit: BrandKit, size: string) {
  const overlay = composeBrandOverlayText(kit);
  return `${basePrompt}\n\nBrand requirements (must follow): ${kit.logoUrl ? 'Use the configured ALO logo at bottom-right with 8% padding' : 'No verified logo supplied: use the ALO Education name, do not invent a logo'}, footer bar ${kit.primary} with white text: "${overlay}". Address only on BLOG/LANDSCAPE. Size ${size}. Professional, clean, student-focused, Bangladesh audience. Do not guarantee visa.`;
}
