import { expect, test } from '@playwright/test';
import { encode } from 'next-auth/jwt';
/** UI/error-state test only. The navigation hint is NOT a real database session.
 * No fake API responses, seeded production records or live provider inference.
 */
test.describe('existing Super Admin main dashboard owner chat', () => {
  test.use({ serviceWorkers: 'block' });
  test('shows a real authentication failure and never enables an unconfigured chat', async ({ page, context, baseURL }) => {
    test.setTimeout(120000);
    const token = await encode({ secret: 'playwright-nextauth-secret-32-bytes', token: { sub: 'isolated-owner-chat-ui-check', role: 'SUPER_ADMIN', status: 'ACTIVE', identityDomain: 'portal' }, maxAge: 600 });
    await context.addCookies([{ name: 'alo_page_session', value: token, url: baseURL!, httpOnly: true, sameSite: 'Lax' }]);
    await page.goto('/crm/dashboard');
    const reject = page.getByRole('button', { name: 'Reject', exact: true });
    if (await reject.isVisible()) await reject.click();
    await page.getByRole('button', { name: 'AI Command Center', exact: true }).click();
    await expect(page.getByText('Owner AI chat', { exact: true })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: /unauthorized|authentication|session|sign in/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
    await page.getByLabel('AI provider').selectOption('unorouter');
    await expect(page.getByText('External cloud provider.', { exact: false })).toBeVisible();
    await expect(page.getByLabel('AI model').locator('option')).toHaveCount(1);
    await expect(page.getByText(/2,000\+ agent framework|Agents Online|Typecheck compiled successfully/)).toHaveCount(0);
    for (const width of [390,768,1440]) {
      await page.setViewportSize({ width, height: 1100 });
      const panel = page.getByText('Owner AI chat', { exact: true }).locator('xpath=ancestor::div[@data-slot="card"]');
      const bounds = await panel.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.width).toBeLessThanOrEqual(width);
    }
  });
});
