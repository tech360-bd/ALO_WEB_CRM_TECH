import { expect, test } from '@playwright/test';

/**
 * Header contract for EVERY page BEFORE login (brand specification).
 *
 * The public header is mounted once for the whole marketing site by
 * PublicLayoutWrapper (root layout), so these checks guard the single source:
 *   • logo (ALO Education) + italic orange tagline
 *   • menu order: Destinations ▾ · Course Finder · Services · Language Prep ·
 *     Resources ▾ · Portal ▾ · AI SUPPORT ▾
 *   • CTA "Book Free Counseling" (ALO Orange) → /book-consultation
 */

const PUBLIC_ROUTES = [
  '/', '/destinations', '/course-finder', '/services', '/language-prep', '/resources',
  '/scholarships', '/faqs', '/visa', '/about', '/contact', '/global-offices',
  '/code-of-conduct', '/student-complaint-policy', '/aqf-compliance', '/book-consultation',
];

const MENU_ORDER = [
  'Destinations',
  'Course Finder',
  'Services',
  'Language Prep',
  'Resources',
  'Portal',
  'AI SUPPORT',
];

/** Resolve a menu entry whichever role it has (links and dropdown triggers differ). */
function menuEntryWithin(scope: import('@playwright/test').Locator, label: string) {
  return scope
    .getByRole('link', { name: label, exact: true })
    .or(scope.getByRole('button', { name: label, exact: true }))
    .first();
}

function menuEntry(page: import('@playwright/test').Page, label: string) {
  return menuEntryWithin(page.locator('#alo-public-header'), label);
}

test.describe('desktop header (before login)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('renders the specified menu on every public page', async ({ page }) => {
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);
      const header = page.locator('#alo-public-header');
      await expect(header, `header missing on ${route}`).toBeVisible();
      await expect(header.getByText('ALO Education', { exact: true })).toBeVisible();
      await expect(header.getByText('Your Dream – Our Commitment')).toBeVisible();
      for (const label of MENU_ORDER) {
        await expect(menuEntry(page, label), `${label} missing on ${route}`).toBeVisible();
      }
      const cta = header.getByRole('link', { name: 'Book Free Counseling' });
      await expect(cta).toBeVisible();
      await expect(cta).toHaveCSS('background-color', 'rgb(243, 112, 33)');
      await expect(cta).toHaveCSS('color', 'rgb(0, 0, 0)');
    }
  });

  test('keeps the specified left-to-right menu order', async ({ page }) => {
    await page.goto('/');
    const positions: Array<{ label: string; x: number }> = [];
    for (const label of MENU_ORDER) {
      const box = await menuEntry(page, label).boundingBox();
      expect(box, `${label} has no box`).not.toBeNull();
      positions.push({ label, x: box?.x ?? Number.NaN });
    }
    const xs = positions.map((p) => p.x);
    expect(xs, `menu order was ${JSON.stringify(positions)}`).toEqual([...xs].sort((a, b) => a - b));

    const ctaBox = await page.locator('#alo-public-header').getByRole('link', { name: 'Book Free Counseling' }).boundingBox();
    expect(ctaBox?.x ?? -1).toBeGreaterThan(xs[xs.length - 1]);
  });

  test('CTA opens the consultation page and the dropdowns expose their links', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('#alo-public-header');

    await expect(header.getByRole('link', { name: 'Book Free Counseling' })).toHaveAttribute(
      'href',
      '/book-consultation'
    );

    // Destinations ▾
    await header.getByRole('button', { name: 'Destinations', exact: true }).click();
    await expect(header.getByRole('menu', { name: 'Destinations' })).toBeVisible();

    // Resources ▾
    await header.getByRole('button', { name: 'Resources', exact: true }).click();
    await expect(header.getByRole('link', { name: 'Visa Guides' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'English Test' })).toBeVisible();

    // Portal ▾
    await header.getByRole('button', { name: 'Portal', exact: true }).click();
    await expect(header.getByRole('link', { name: 'Student Portal' })).toBeVisible();

    // AI SUPPORT ▾
    await header.getByRole('button', { name: 'AI SUPPORT', exact: true }).click();
    await expect(header.getByRole('link', { name: 'AI Course Match' })).toBeVisible();

    // Escape closes the open dropdown.
    await page.keyboard.press('Escape');
    await expect(header.getByRole('link', { name: 'AI Course Match' })).toBeHidden();
  });
});

test.describe('mobile header (before login)', () => {
  test.use({ viewport: { width: 393, height: 851 } });

  test('hamburger opens the same menu with a full-width CTA', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('#alo-public-header');
    await expect(header.getByText('Your Dream – Our Commitment')).toBeVisible();

    await header.getByRole('button', { name: 'Open navigation menu' }).click();
    const mobileMenu = page.locator('[data-slot="sheet-content"]');
    await expect(mobileMenu).toBeVisible();
    for (const label of MENU_ORDER) {
      await expect(menuEntryWithin(mobileMenu, label), `${label} missing on mobile`).toBeVisible();
    }
    const mobileCta = mobileMenu.getByRole('link', { name: 'Book Free Counseling' });
    await expect(mobileCta).toBeVisible();
    await expect(mobileCta).toHaveCSS('background-color', 'rgb(243, 112, 33)');
    await expect(mobileCta).toHaveCSS('color', 'rgb(0, 0, 0)');
    await mobileMenu.getByRole('button', { name: 'Resources', exact: true }).click();
    await expect(mobileMenu.getByRole('link', { name: 'English Test' })).toBeVisible();
  });
});

test.describe('header scope', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('is present on signed-out authentication entry screens', async ({ page }) => {
    for (const route of ['/student/login', '/partner/login', '/employee/login', '/login']) {
      await page.goto(route);
      await expect(page.locator('#alo-public-header'), `public header missing on ${route}`).toBeVisible();
    }
  });
});
