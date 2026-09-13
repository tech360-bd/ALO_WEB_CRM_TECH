import { expect, test } from '@playwright/test';

test.describe('public website and anonymous auth gates', () => {
  test('public homepage renders meaningful ALO Education content', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /ALO Education/i }).first()).toBeVisible();
    await expect(
      page
        .locator("a:visible, button:visible")
        .filter({
          hasText: /Book Free Consultation|Course Finder|Student Portal/i,
        })
        .first()
    ).toBeVisible();
  });

  test('portal login routes render for visitors', async ({ page }) => {
    for (const route of ['/student/login', '/partner/login', '/employee/login']) {
      await page.goto(route);
      await expect(page.locator('body')).toContainText(/login|email|password/i);
    }
  });

  test('protected UCC API rejects anonymous requests', async ({ request }) => {
    const response = await request.get('/api/crm/ucc/conversations');
    expect(response.status()).toBe(401);
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('super admin command center route is present', async ({ page }) => {
    await page.goto('/admin/ai-command-center');
    await expect(page.locator('body')).toContainText(/command center|AI/i);
  });
});
