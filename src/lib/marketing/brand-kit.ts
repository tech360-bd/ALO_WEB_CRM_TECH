import { db } from "@/lib/db";

export interface BrandKit {
  logoUrl: string; // CDN url
  logoName: string;
  address: string;
  phone: string;
  whatsapp: string;
  website: string;
  primary: string; // #2563EB
  cta: string; // #F97316
}

export async function getBrandKit(): Promise<BrandKit> {
  const fallback: BrandKit = {
    logoUrl: "",
    logoName: "",
    address: "House 12, Road 12, Dhanmondi, Dhaka-1209, Bangladesh",
    phone: "+8809611-123456",
    whatsapp: "+8801712345678",
    website: "https://alo-education.com",
    primary: "#2563EB",
    cta: "#F97316",
  };
  try {
    const assets = await db.brandAsset.findMany({ where: { isActive: true } });
    const logo = assets.find(a => a.assetType === "LOGO");
    const kit = assets.find(a => a.assetType === "BRAND_KIT");
    let kitVal: any = {};
    if (kit) try { kitVal = JSON.parse(kit.value || "{}"); } catch {}
    let logoVal: any = {};
    if (logo) try { logoVal = JSON.parse(logo.value || "{}"); } catch {}
    // support both value.fileUrl or value.url
    return {
      logoUrl: kitVal.logoUrl || logoVal.fileUrl || logoVal.url || fallback.logoUrl,
      logoName: kitVal.logoName || logo?.name || fallback.logoName,
      address: kitVal.address || fallback.address,
      phone: kitVal.phone || fallback.phone,
      whatsapp: kitVal.whatsapp || fallback.whatsapp,
      website: kitVal.website || fallback.website,
      primary: kitVal.primary || fallback.primary,
      cta: kitVal.cta || fallback.cta,
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
  return `${basePrompt}\n\nBrand requirements (must follow): ALO Education logo at bottom-right 8% padding, footer bar ${kit.primary} with white text: "${overlay}". Address only on BLOG/LANDSCAPE. Size ${size}. Professional, clean, student-focused, Bangladesh audience. Do not guarantee visa.`;
}
