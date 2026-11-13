/**
 * Reconciliation hardening on top of the brand chrome work:
 *
 *  - The official seal must have NO public URL. Anyone on the internet could
 *    otherwise download the company seal and stamp forged documents,
 *    defeating the "Super Admin only" rule. It may only be reached through
 *    server-side rendering or the audited seal route.
 *  - The byte-identical duplicated asset tree `public/public/**` must stay
 *    deleted; legacy `/public/...` URLs are served by a single rewrite to
 *    the canonical asset instead of a second physical copy.
 *  - Every signed-in shell owns exactly one portal footer, including the
 *    marketing hub, and the root wrapper supplies the generic footer to a
 *    signed-in user on a public-chrome route without ever duplicating one.
 */

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALO_BRAND_ASSETS } from '@/lib/brand/brand-assets';
import { OFFICIAL_SEAL_SERVER_ASSET } from '@/lib/documents/official-documents';

const read = (path: string) => readFileSync(path, 'utf8');

describe('official seal has no public surface', () => {
  it('is not present anywhere under public/ and has no registry URL', () => {
    expect(existsSync('public/images/brand/alo-official-seal.png')).toBe(false);
    expect('seal' in ALO_BRAND_ASSETS).toBe(false);
    expect(OFFICIAL_SEAL_SERVER_ASSET).toBe('src/lib/documents/assets/alo-official-seal.png');
    expect(existsSync(OFFICIAL_SEAL_SERVER_ASSET)).toBe(true);
  });

  it('is served only by the audited Super-Admin route', () => {
    const route = read('src/app/api/official-documents/seal/route.ts');
    expect(route).toContain('isSealAuthorized');
    expect(route).toContain('OFFICIAL_SEAL_ACCESSED');
    expect(route).toContain('portalAuditLog');
    expect(route).toContain('getOfficialSealPng');
  });

  it('is traced into exactly the three authorised route bundles', () => {
    const config = read('next.config.ts');
    expect(config).toContain("'/api/employee/salary': ['./src/lib/documents/assets/alo-official-seal.png']");
    expect(config).toContain("'/api/applications/[id]/offer-letter': ['./src/lib/documents/assets/alo-official-seal.png']");
    expect(config).toContain("'/api/official-documents/seal': ['./src/lib/documents/assets/alo-official-seal.png']");
  });
});

describe('duplicated public asset tree stays removed', () => {
  it('has no physical public/public directory', () => {
    expect(existsSync('public/public')).toBe(false);
  });

  it('keeps legacy /public/... URLs working through one rewrite', () => {
    const config = read('next.config.ts');
    expect(config).toContain('{ source: "/public/:path*", destination: "/:path*" }');
  });
});

describe('signed-in footer coverage without duplication', () => {
  it('mounts the portal footer in the marketing hub shell', () => {
    const shell = read('src/components/marketing/hub/MarketingHubShell.tsx');
    expect(shell).toContain("import PortalFooter from '@/components/portals/PortalFooter'");
    expect(shell).toContain('<PortalFooter scope="employee" />');
  });

  it('gives signed-in users on public routes the generic footer, guarded against duplicates', () => {
    const wrapper = read('src/components/website/PublicLayoutWrapper.tsx');
    expect(wrapper).toContain('AuthenticatedPortalFooterFallback');
    expect(wrapper).toContain("document.querySelectorAll('#alo-portal-footer, #alo-public-footer')");
    expect(wrapper).toContain('isAuthenticated && isPublicChromeRoute(pathname)');
  });

  it('applies partner logo and colour scheme in the partner shell sidebar', () => {
    const shell = read('src/components/partner/PartnerPortalShell.tsx');
    expect(shell).toContain('/api/portal/footer-context');
    expect(shell).toContain('partnerBranding?.logoUrl');
    expect(shell).toContain('partnerBranding.primaryColor');
  });
});
