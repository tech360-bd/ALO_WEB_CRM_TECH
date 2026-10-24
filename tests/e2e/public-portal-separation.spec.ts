import { expect, test } from '@playwright/test';
import { encode } from 'next-auth/jwt';
// A page-navigation hint is not a database session. This verifies layout scope,
// not authenticated business operations or an actual employee/student login.
for (const [role, path] of [['STUDENT', '/student/dashboard'], ['EMPLOYEE', '/employee/dashboard'], ['SUPER_ADMIN', '/crm/dashboard']]) {
  test(`public header/footer stay outside ${role} portal layout`, async ({ page, context, baseURL }) => {
    const token = await encode({ secret: 'playwright-nextauth-secret-32-bytes', token: { sub: 'isolated-layout-check', role, status: 'ACTIVE', identityDomain: 'portal' }, maxAge: 600 });
    await context.addCookies([{ name: 'alo_page_session', value: token, url: baseURL!, httpOnly: true, sameSite: 'Lax' }]);
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(path));
    await expect(page.locator('#alo-public-header')).toHaveCount(0);
    await expect(page.locator('#alo-public-footer')).toHaveCount(0);
  });
}
