import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALO_CONTACT, ALO_POLICY_LINKS, ALO_SOCIALS, ALO_TAGLINE } from '@/lib/alo-site-info';

const read = (path: string) => readFileSync(path, 'utf8');
const footer = read('src/components/website/PublicFooter.tsx');
const navbar = read('src/components/website/PublicNavbar.tsx');

describe('public brand guideline contract', () => {
  it('uses the exact requested colours and neutral text', () => {
    const css = read('src/app/globals.css');
    // Master §03 palette: Brand Blue #0057B8, CTA Orange #E8501A (solid fill
    // #C93D13 so a white label clears 4.5:1), Main Text #0F172A.
    for (const declaration of ['--alo-brand: #0057B8;', '--alo-cta-vivid: #E8501A;', '--alo-cta-solid: #C93D13;', '--alo-text: #0F172A;', '--alo-body: #334155;']) {
      expect(css).toContain(declaration);
    }
    expect(footer).toContain("['#0057B8', '#E8501A', '#C93D13']");
    expect(JSON.parse(read('public/manifest.json')).theme_color).toBe('#0057B8');
  });

  it('keeps all required destination and company pages reachable', () => {
    const countryData = read('src/lib/country-destinations-data.ts');
    for (const slug of ['uk', 'australia', 'canada', 'ireland', 'new-zealand', 'usa', 'dubai']) {
      expect(footer).toContain(`/destinations/${slug}`);
      expect(countryData).toContain(`slug: "${slug}"`);
    }
    expect(existsSync('src/app/destinations/[slug]/page.tsx')).toBe(true);
    for (const path of ['/course-finder', '/services', '/language-prep', '/scholarships', '/about', '/contact', '/global-offices', ...Object.values(ALO_POLICY_LINKS)]) {
      expect(existsSync(`src/app${path}/page.tsx`), path).toBe(true);
    }
  });

  it('preserves contact details and social platform order', () => {
    expect(ALO_SOCIALS.map(({ id }) => id)).toEqual(['facebook', 'instagram', 'linkedin', 'youtube']);
    expect(ALO_CONTACT.mapsUrl).toBe('https://share.google/aarau5V2GfBrICZTj');
    expect(ALO_CONTACT.whatsappDisplay).toBe('+8801805020101');
    expect(ALO_CONTACT.mobileDisplay).toBe('+8801805020101-10');
    expect(ALO_CONTACT.email).toBe('info@aloeducation.com');
    expect(ALO_CONTACT.address).toBe('Barek Mansion-02 (5th Floor), 58/9 Box Culvert Road, Panthapath, Dhaka-1205, Bangladesh.');
    expect(footer).toContain('ALO_SOCIALS.map');
  });

  it('shares the tagline and exact navigation label across screen sizes', () => {
    expect(ALO_TAGLINE).toBe('Your Dream – Our Commitment');
    expect(navbar).toContain('italic text-alo-cta');
    expect(read('src/i18n/dictionaries.ts')).toContain("'nav.aiSupportTools': 'AI SUPPORT'");
    expect(navbar.match(/t\('nav.aiSupportTools'\)/g)).toHaveLength(2);
    expect(footer).toContain('© ALO Education. All rights reserved.');
  });

  it('keeps the cap strip animated with reduced-motion support', () => {
    expect(footer).toContain('@keyframes alo-cap-left');
    expect(footer).toContain('@keyframes alo-cap-right');
    expect(footer).toContain('prefers-reduced-motion');
  });

  it('loads the brand fonts locally', () => {
    const css = read('src/app/globals.css');
    for (const font of ['Montserrat', 'Open Sans']) expect(css).toContain(`font-family: '${font}'`);
    for (const match of css.matchAll(/url\(['"]?(\/fonts\/[^)'"\s]+)/g)) {
      expect(existsSync(`public${match[1]}`), match[1]).toBe(true);
    }
  });
});
