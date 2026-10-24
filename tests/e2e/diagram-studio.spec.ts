import { expect, test } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { readFile } from 'node:fs/promises';

/** UI checks only: the navigation hint is deliberately NOT a database session.
 * Actual save/ownership/audit behavior has separate real-MySQL integration tests.
 * No API interception, fake responses, production account or persisted seed rows.
 */
test.describe('existing Diagram Studio editor', () => {
  test.use({ serviceWorkers: 'block' });
  test('edits each layout, validates ranges, exports SVG and rejects an unauthenticated save', async ({ page, context, baseURL }) => {
    test.setTimeout(120_000);
    const secret = 'playwright-nextauth-secret-32-bytes'; // matches the existing test server configuration
    const token = await encode({ secret, token: { sub: 'isolated-diagram-ui-check', role: 'SUPER_ADMIN', status: 'ACTIVE', identityDomain: 'portal' }, maxAge: 600 });
    await context.addCookies([{ name: 'alo_page_session', value: token, url: baseURL!, httpOnly: true, sameSite: 'Lax' }]);
    const renderWarnings: string[] = [];
    page.on('console', message => { if (/Each child in a list should have a unique/.test(message.text())) renderWarnings.push(message.text()); });
    await page.goto('/crm/diagram-studio');
    await expect(page.getByRole('heading', { name: 'Diagram Studio', exact: true })).toBeVisible();
    const rejectAnalytics = page.getByRole('button', { name: 'Reject', exact: true });
    if (await rejectAnalytics.isVisible()) await rejectAnalytics.click();
    const type = page.getByLabel('Diagram type');
    await expect(type.locator('option')).toHaveCount(12);
    const rows: Record<string, string> = {
      sequence: 'Isolated request | Counselor\nIsolated review | Reviewer',
      'org-chart': 'Isolated manager | root\nIsolated officer | Isolated manager',
      swimlane: 'Isolated task | Admission', kanban: 'Isolated task | Review',
      bar: 'Isolated count | | 3', gantt: 'Isolated review | | 1 | 4',
      'security-matrix': 'Counselor | Salary | 0',
    };
    for (const [layout, value] of Object.entries(rows)) {
      await type.selectOption(layout);
      await page.getByLabel('Diagram title', { exact: true }).fill('Isolated UI check');
      // A nested textarea label may include its current text; match its stable prefix.
      await page.getByLabel('Diagram rows').fill(value);
      await expect(page.getByRole('button', { name: 'Download SVG', exact: true })).toBeEnabled();
      await expect(page.locator('svg[role="img"]')).toHaveCount(1);
    }
    await type.selectOption('gantt');
    await page.getByLabel('Diagram rows').fill('Invalid test range | | 5 | 1');
    await expect(page.getByRole('button', { name: 'Download SVG', exact: true })).toBeDisabled();
    await type.selectOption('bar');
    await page.getByLabel('Diagram rows').fill('Isolated count | | 3');
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download SVG', exact: true }).click();
    const file = await downloaded;
    const svg = await readFile((await file.path())!, 'utf8');
    expect(svg).toContain('<svg'); expect(svg).toContain('Isolated count');
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), `Page overflow at ${width}px`).toBe(false);
    }
    const save = page.waitForResponse(response => response.url().endsWith('/api/employee/diagram-drafts') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Save diagram draft', exact: true }).click();
    expect((await save).status()).toBe(401);
    await expect(page.getByRole('status').filter({ hasText: /authentication|unauthorized|sign in|session/i }).first()).toBeVisible();
    await expect(page.getByText('Draft saved and audited.', { exact: true })).toHaveCount(0);
    expect(renderWarnings).toEqual([]);
  });
});
