import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ALO_BRAND_COLORS,
  buildPartnerFooterTheme,
  readableTextOn,
  sanitizeLogoUrl,
  validatePartnerBranding,
} from '@/lib/partner/branding';
import { shouldShowPartnerFooter } from '@/lib/portal/footer-context';
import { buildOfficialDocumentHtml, escapeHtml, isSealAuthorized } from '@/lib/documents/official-documents';
import { ALO_BRAND_ASSETS, OFFICIAL_SEAL } from '@/lib/brand/brand-assets';
import { existsSync } from 'node:fs';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.tsx$/.test(path) ? [path] : [];
  });
}

describe('one footer landmark per page', () => {
  it('has exactly one public footer and one portal footer component', () => {
    const footerOwners = sourceFiles('src')
      .filter((path) => /<footer\b/.test(readFileSync(path, 'utf8')))
      .sort();
    expect(footerOwners).toEqual([
      'src/components/portals/PortalFooter.tsx',
      'src/components/website/PublicFooter.tsx',
    ]);
  });

  it('never nests a portal shell inside a layout that already renders one', () => {
    // /employee/profile and /student/mock-tests each mounted a shell on top of
    // the one their layout already provided, producing two headers, sidebars
    // and footers.
    const nestedShellPages = [
      'src/app/employee/profile/page.tsx',
      'src/app/student/mock-tests/page.tsx',
    ].filter((path) => /<\w*PortalShell\b/.test(readFileSync(path, 'utf8')));
    expect(nestedShellPages).toEqual([]);
  });

  it('mounts the portal footer exactly once in every signed-in chrome owner', () => {
    const owners = [
      'src/app/student/layout.tsx',
      'src/app/partner-admin/layout.tsx',
      'src/app/application-manager/layout.tsx',
      'src/components/student/StudentPortalShell.tsx',
      'src/components/employee/EmployeePortalShell.tsx',
      'src/components/partner/PartnerPortalShell.tsx',
      'src/components/counselor/CounselorPortalShell.tsx',
      'src/components/crm/CrmAdminShell.tsx',
    ];
    for (const path of owners) {
      const mounts = readFileSync(path, 'utf8').match(/<PortalFooter\b/g) || [];
      expect(mounts, path).toHaveLength(1);
    }
  });

  it('keeps the public chrome mounted only by PublicLayoutWrapper', () => {
    const mounts = sourceFiles('src').flatMap((path) => {
      const source = readFileSync(path, 'utf8');
      const found = source.match(/<(PublicNavbar|PublicFooter)\b/g) || [];
      return found.map((tag) => `${path}:${tag}`);
    });
    expect(mounts.sort()).toEqual([
      'src/components/website/PublicLayoutWrapper.tsx:<PublicFooter',
      'src/components/website/PublicLayoutWrapper.tsx:<PublicNavbar',
    ]);
  });
});

describe('partner branding validation', () => {
  it('accepts six-digit hex colours and rejects anything else', () => {
    const ok = validatePartnerBranding({ primaryColor: '#123ABC' });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.primaryColor).toBe('#123ABC');

    for (const bad of ['#123', 'red', 'javascript:alert(1)', '#12345G']) {
      expect(validatePartnerBranding({ primaryColor: bad }).ok, bad).toBe(false);
    }
  });

  it('falls back to ALO brand colours when a partner submits nothing', () => {
    const result = validatePartnerBranding({});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.primaryColor).toBe(ALO_BRAND_COLORS.primary);
    expect(result.value.secondaryColor).toBe(ALO_BRAND_COLORS.secondary);
    expect(result.value.accentColor).toBe(ALO_BRAND_COLORS.accent);
  });

  it('accepts only https logo URLs or small inline images', () => {
    expect(sanitizeLogoUrl('https://cdn.example.com/logo.png').ok).toBe(true);
    expect(sanitizeLogoUrl('data:image/png;base64,iVBORw0KGgo=').ok).toBe(true);
    for (const bad of [
      'javascript:alert(1)',
      'data:text/html;base64,PHNjcmlwdD4=',
      '//evil.example.com/logo.png',
      'http://insecure.example.com/logo.png',
    ]) {
      expect(sanitizeLogoUrl(bad).ok, bad).toBe(false);
    }
  });

  it('does not let the accent colour collapse onto the other brand colours', () => {
    const result = validatePartnerBranding({ primaryColor: '#112233', accentColor: '#112233' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.accentColor).toBe(ALO_BRAND_COLORS.accent);
  });

  it('rejects invalid support emails and bounds text fields', () => {
    expect(validatePartnerBranding({ supportEmail: 'not-an-email' }).ok).toBe(false);
    const result = validatePartnerBranding({ displayName: 'x'.repeat(400), tagline: 'y'.repeat(400) });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.displayName.length).toBeLessThanOrEqual(120);
      expect(result.value.tagline.length).toBeLessThanOrEqual(160);
    }
  });

  it('derives a readable theme from partner colours', () => {
    const dark = buildPartnerFooterTheme({ primaryColor: '#101010' });
    expect(dark.onPrimary).toBe('#FFFFFF');
    const light = buildPartnerFooterTheme({ primaryColor: '#FFEE00' });
    expect(light.onPrimary).toBe('#000000');
    expect(readableTextOn('#0066CC')).toBe('#FFFFFF');
    expect(dark.tint.endsWith('14')).toBe(true);
  });

  it('shows the partner block only when the partner enabled it and identified itself', () => {
    const base = {
      partnerId: 'p1', displayName: 'Partner Ltd', tagline: '', logoUrl: '',
      primaryColor: '#0066CC', secondaryColor: '#F37021', accentColor: '#FFB347',
      websiteUrl: '', supportEmail: '', supportPhone: '', showInFooter: true, updatedAt: null,
    };
    expect(shouldShowPartnerFooter(base)).toBe(true);
    expect(shouldShowPartnerFooter({ ...base, showInFooter: false })).toBe(false);
    expect(shouldShowPartnerFooter({ ...base, displayName: '', logoUrl: '' })).toBe(false);
    expect(shouldShowPartnerFooter(null)).toBe(false);
  });
});

describe('official document letterhead and seal', () => {
  it('ships the letterhead and seal assets the documents reference', () => {
    for (const url of [ALO_BRAND_ASSETS.letterhead, ALO_BRAND_ASSETS.seal, ALO_BRAND_ASSETS.logo]) {
      expect(url.startsWith('/images/brand/')).toBe(true);
      expect(existsSync(`public${url}`), url).toBe(true);
    }
  });

  it('authorises the seal for Super Admin only', () => {
    expect(isSealAuthorized({ userType: 'SUPER_ADMIN' })).toBe(true);
    expect(isSealAuthorized({ userType: 'EMPLOYEE', roles: ['super_admin'] })).toBe(true);
    expect(isSealAuthorized({ userType: 'EMPLOYEE', roles: ['hr_manager'] })).toBe(false);
    expect(isSealAuthorized({ userType: 'ADMIN', roles: ['admin'] })).toBe(false);
    expect(isSealAuthorized(null)).toBe(false);
    expect(isSealAuthorized({})).toBe(false);
  });

  it('renders every official document on the letterhead', async () => {
    const html = await buildOfficialDocumentHtml({
      kind: 'offer-letter',
      title: 'Offer letter',
      bodyHtml: '<p>Body</p>',
      authority: { userType: 'EMPLOYEE', roles: ['application_manager'] },
    });
    expect(html).toContain('data:image/jpeg;base64,');
    expect(html).toContain(OFFICIAL_SEAL.withheldNotice);
    expect(html).toContain('ALO Education');
    expect(html).toContain('@page');
  });

  it('applies the seal for a Super Admin, and never for anyone else', async () => {
    const sealed = await buildOfficialDocumentHtml({
      kind: 'salary-slip',
      title: 'Approved salary slip',
      bodyHtml: '<p>Body</p>',
      authority: { userType: 'SUPER_ADMIN', roles: ['super_admin'] },
    });
    expect(sealed).toContain('data:image/png;base64,');
    expect(sealed).not.toContain(OFFICIAL_SEAL.withheldNotice);

    const unsealed = await buildOfficialDocumentHtml({
      kind: 'salary-slip',
      title: 'Approved salary slip',
      bodyHtml: '<p>Body</p>',
      authority: { userType: 'EMPLOYEE', roles: ['hr'] },
    });
    expect(unsealed).toContain(OFFICIAL_SEAL.withheldNotice);
  });

  it('escapes document values so a name cannot inject markup', async () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    const html = await buildOfficialDocumentHtml({
      kind: 'offer-letter',
      title: '<img src=x onerror=alert(1)>',
      bodyHtml: '<p>Body</p>',
      issuedTo: '<b>Student</b>',
      authority: null,
    });
    expect(html).not.toContain('<img src=x onerror');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;b&gt;Student&lt;/b&gt;');
  });
});
