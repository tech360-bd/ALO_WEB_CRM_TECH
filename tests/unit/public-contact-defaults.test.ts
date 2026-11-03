import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

/**
 * Brand contract: the required WhatsApp / Mobile / email / address / location
 * block must appear in the public footer on EVERY pre-login page — including a
 * deployment that has NOT set the optional NEXT_PUBLIC_* contact overrides.
 * Previously blank env values made `hasWhatsApp` / `hasContactPhone` false and
 * the footer silently dropped both rows.
 */
vi.hoisted(() => {
  delete process.env.NEXT_PUBLIC_ALO_CONTACT_PHONE;
  delete process.env.NEXT_PUBLIC_ALO_WHATSAPP_NUMBER;
});

import {
  ALO_CONTACT,
  ALO_POLICY_LINKS,
  ALO_SOCIALS,
  ALO_TAGLINE,
} from '@/lib/alo-site-info';

const footer = readFileSync('src/components/website/PublicFooter.tsx', 'utf8');
const navbar = readFileSync('src/components/website/PublicNavbar.tsx', 'utf8');

describe('public header/footer brand contract (no deployment config)', () => {
  it('publishes the ALO contact numbers by default', () => {
    expect(ALO_CONTACT.hasWhatsApp).toBe(true);
    expect(ALO_CONTACT.hasContactPhone).toBe(true);
    expect(ALO_CONTACT.whatsappDisplay).toBe('+8801805020101');
    expect(ALO_CONTACT.whatsappHref).toBe('https://wa.me/8801805020101');
    expect(ALO_CONTACT.mobileDisplay).toBe('+8801805020101-10');
    // The "-10" range is display-only; the dial link must target the real first number.
    expect(ALO_CONTACT.mobileHref).toBe('tel:+8801805020101');
  });

  it('keeps the remaining exact contact details', () => {
    expect(ALO_CONTACT.mapsUrl).toBe('https://share.google/aarau5V2GfBrICZTj');
    expect(ALO_CONTACT.email).toBe('info@aloeducation.com');
    expect(ALO_CONTACT.emailHref).toBe('mailto:info@aloeducation.com');
    expect(ALO_CONTACT.address).toBe(
      'Barek Mansion-02 (5th Floor), 58/9 Box Culvert Road, Panthapath, Dhaka-1205, Bangladesh.',
    );
  });

  it('keeps official social accounts in the fixed order and policy pages reachable', () => {
    expect(ALO_SOCIALS.map((s) => s.id)).toEqual(['facebook', 'instagram', 'linkedin', 'youtube']);
    expect(ALO_SOCIALS.map((s) => s.href)).toEqual([
      'https://www.facebook.com/aloeducationbangladesh/',
      'https://www.instagram.com/aloeducation.bd/',
      'https://www.linkedin.com/company/aloeducation',
      'https://www.youtube.com/@aloeducationbd',
    ]);
    expect(Object.values(ALO_POLICY_LINKS)).toEqual([
      '/code-of-conduct',
      '/student-complaint-policy',
      '/aqf-compliance',
    ]);
  });

  it('renders one shared tagline, one CTA label and the required columns', () => {
    expect(ALO_TAGLINE).toBe('Your Dream – Our Commitment');
    expect(navbar).toContain('italic text-alo-cta');
    expect(footer).not.toContain('Request Counseling');
    expect(footer).toContain('Book Free Counseling');
    expect(footer).toContain('© ALO Education. All rights reserved.');
    for (const label of ['UK', 'Australia', 'Canada', 'Ireland', 'New Zealand', 'USA', 'Dubai']) {
      expect(footer, label).toContain(`label: '${label}'`);
    }
    for (const label of ['Course Finder', 'Services', 'Language Prep', 'Scholarships']) {
      expect(footer, label).toContain(`label: '${label}'`);
    }
  });
});
