import type { MarketingKit } from './campaign-kits';

/** Original ALO templates. No external images/fonts or tracking requests. */
export const CREATIVE_FORMATS = {
  square: { width: 1080, height: 1080, label: 'Square · 1080 × 1080' },
  portrait: { width: 1080, height: 1350, label: 'Portrait · 1080 × 1350' },
  story: { width: 1080, height: 1920, label: 'Story · 1080 × 1920' },
  landscape: { width: 1200, height: 628, label: 'Landscape · 1200 × 628' },
} as const;
export type CreativeFormat = keyof typeof CREATIVE_FORMATS;
export interface CreativeContent { headline: string; body: string; cta: string; destination: string }
export function creativeFromKit(kit: MarketingKit): CreativeContent {
  return { headline: kit.hook, body: kit.copy, cta: kit.cta, destination: '' };
}
export function validateCreative(content: CreativeContent): string[] {
  const errors: string[] = [];
  for (const [key, label, max] of [['headline', 'Headline', 110], ['body', 'Body copy', 320], ['cta', 'CTA', 42]] as const) {
    if (!content[key].trim() || content[key].length > max) errors.push(`${label} must contain 1–${max} characters.`);
  }
  if (content.destination.length > 80) errors.push('Destination URL must be 80 characters or fewer.');
  if (content.destination) {
    try {
      const url = new URL(content.destination);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
    } catch { errors.push('Use a full HTTPS destination URL without embedded credentials.'); }
  }
  return errors;
}
function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!);
}
function wrap(text: string, columns: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.trim().split(/\s+/)) {
    // Break long unspaced words too, so malicious/accidental input cannot overflow.
    for (let offset = 0; offset < word.length; offset += columns) {
      const part = word.slice(offset, offset + columns);
      if (current && current.length + part.length + 1 > columns) { lines.push(current); current = ''; }
      current += `${current ? ' ' : ''}${part}`;
    }
  }
  if (current) lines.push(current);
  return lines;
}
export function buildCreativeSvg(content: CreativeContent, format: CreativeFormat): string {
  const errors = validateCreative(content);
  if (errors.length) throw new Error(errors.join(' '));
  const { width: w, height: h } = CREATIVE_FORMATS[format];
  const landscape = format === 'landscape';
  const headlineSize = landscape ? 36 : 54;
  const headlineColumns = landscape ? 48 : 30;
  const bodySize = landscape ? 20 : 26;
  const bodyColumns = landscape ? 86 : 55;
  const start = landscape ? 150 : h * 0.20;
  const lines = wrap(content.headline, headlineColumns);
  const bodyStart = start + lines.length * headlineSize * 1.15 + 36;
  const textLines = (text: string[], x: number, y: number, size: number, color: string, weight: number) =>
    `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}">${text.map((line, i) => `<tspan x="${x}" dy="${i ? size * 1.3 : 0}">${escapeXml(line)}</tspan>`).join('')}</text>`;
  // Draft watermark intentionally remains in every export. This is not approval.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="ALO Education draft campaign creative">
<title>${escapeXml(content.headline)}</title><desc>Draft marketing creative. Human review required before publication.</desc>
<rect width="${w}" height="${h}" fill="#0F172A"/>
<path d="M ${w - 330} 0 H ${w} V ${landscape ? 105 : 210} Z" fill="#2563EB"/>
<circle cx="${w}" cy="${h * 0.72}" r="${landscape ? 120 : 240}" fill="#172554"/>
<g font-family="Arial, sans-serif">
<text x="72" y="82" font-size="30" font-weight="700" fill="#FFFFFF">ALO EDUCATION</text>
<rect x="72" y="104" width="52" height="5" rx="2" fill="#F97316"/>
${textLines(lines, 72, start, headlineSize, '#FFFFFF', 700)}
${textLines(wrap(content.body, bodyColumns), 72, bodyStart, bodySize, '#CBD5E1', 400)}
<rect x="72" y="${h - 195}" width="${Math.min(w - 144, Math.max(280, content.cta.length * 15 + 56))}" height="68" rx="12" fill="#F97316"/>
<text x="100" y="${h - 152}" font-size="26" font-weight="700" fill="#0F172A">${escapeXml(content.cta)}</text>
<text x="72" y="${h - 85}" font-size="18" fill="#CBD5E1">${escapeXml(content.destination || 'Add a verified destination URL before publication')}</text>
<text x="72" y="${h - 36}" font-size="16" letter-spacing="2" fill="#FDBA74">DRAFT · HUMAN REVIEW REQUIRED</text>
</g></svg>`;
}
export function buildCreativeBrief(content: CreativeContent, format: CreativeFormat): string {
  return `# ALO Education — Creative draft\n\nStatus: DRAFT — not approved, scheduled or published.\nFormat: ${CREATIVE_FORMATS[format].label}\n\n## Headline\n${content.headline}\n\n## Body\n${content.body}\n\n## CTA\n${content.cta}\n\nDestination: ${content.destination || 'NOT SET — add and verify before publication'}\n\n## Review\n- [ ] Verify current claims and deadlines\n- [ ] Confirm the destination and brand\n- [ ] Confirm consent and opt-out requirements\n- [ ] Obtain recorded human approval in Marketing Studio\n`;
}
