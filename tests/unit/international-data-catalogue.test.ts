import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/stores/portal-store', () => ({ usePortalStore: (select: (store: unknown) => unknown) => select({ setView: vi.fn() }) }));
import InternationalDataCataloguePage, { CATALOGUE_SECTIONS } from '@/components/crm/pages/InternationalDataCataloguePage';

describe('international data catalogue integration', () => {
  it('renders the requested catalogue title and five academic/CRM sections', () => {
    const html = renderToStaticMarkup(createElement(InternationalDataCataloguePage));
    expect(html).toContain('International University, Course, Admission, Scholarship and CRM Data Catalogue');
    expect(CATALOGUE_SECTIONS).toHaveLength(5);
    for (const section of CATALOGUE_SECTIONS) expect(html).toContain(section.action);
    expect(html).toContain('missing results do not prove');
  });
  it('reuses existing module destinations without creating a second catalogue data API', () => {
    const app = readFileSync('src/app/page.tsx', 'utf8');
    for (const section of CATALOGUE_SECTIONS) expect(app).toContain(`'${section.view}':`);
    for (const path of ['src/app/page.tsx', 'src/components/crm/CrmViewRouter.tsx', 'src/components/crm/CrmAdminShell.tsx', 'src/lib/portal-nav.ts', 'src/lib/stores/portal-store.ts']) expect(readFileSync(path, 'utf8')).toContain("'crm-data-catalogue'");
  });
  it('scholarship screen retrieves real records instead of calculating fabricated awards', () => {
    const source = readFileSync('src/components/crm/pages/CrmScholarshipsPage.tsx', 'utf8');
    expect(source).toContain('/api/crm/scholarships?');
    expect(source).not.toContain('/api/crm/courses');
    expect(source).not.toContain('International Merit');
    expect(source).not.toContain('Math.round(c.tuition');
    expect(source).toContain('record.verificationStatus');
    expect(source).toContain('controller.abort()');
  });
});
