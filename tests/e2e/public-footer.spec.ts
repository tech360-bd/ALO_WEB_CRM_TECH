import { expect, test } from '@playwright/test';

/**
 * Footer contract for EVERY public page (brand specification).
 *
 * The footer is mounted once for the whole marketing site by
 * PublicLayoutWrapper (root layout), so these checks guard the single source:
 *   • logo + "Your Dream – Our Commitment" tagline
 *   • official social accounts in the fixed order Facebook → Instagram →
 *     LinkedIn → YouTube
 *   • Destinations · Quick Links · Company columns with exact labels/order
 *   • contact block (Google location, WhatsApp, mobile, email, address)
 *   • decorative cap-icon strip in three ALO brand colours
 *   • ALO Orange bottom bar reading "© ALO Education. All rights reserved."
 *   • no B2B / partner-recruitment content
 */

const PUBLIC_ROUTES = ['/', '/destinations', '/course-finder', '/services', '/faqs'];

const OFFICIAL_SOCIALS = [
  'https://www.facebook.com/aloeducation',
  'https://www.instagram.com/aloeducation',
  'https://www.linkedin.com/company/aloeducation',
  'https://www.youtube.com/@aloeducation',
];

const DESTINATIONS = ['UK', 'Australia', 'Canada', 'Ireland', 'New Zealand', 'USA', 'Dubai'];
const QUICK_LINKS = ['Course Finder', 'Services', 'Language Prep', 'Scholarships'];
const COMPANY = ['About Us', 'Contact Us', 'Global Offices', 'Code of Conduct', 'Student Complaint Policy', 'AQF Compliance'];

function columnLinks(page: import('@playwright/test').Page, name: string) {
  return page.locator(`#alo-public-footer nav[aria-label="${name}"] a`);
}

test.describe('site-wide footer', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('renders the specified columns on every public page', async ({ page }) => {
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);
      const footer = page.locator('#alo-public-footer');
      await expect(footer, `footer missing on ${route}`).toBeVisible();
      await expect(footer.getByText('ALO Education', { exact: true })).toBeVisible();
      await expect(footer.getByText('Your Dream – Our Commitment')).toBeVisible();
      await expect(footer.getByText(/All rights reserved\./)).toBeVisible();

      await expect(columnLinks(page, 'Destinations'), route).toHaveText(DESTINATIONS);
      await expect(columnLinks(page, 'Quick Links'), route).toHaveText(QUICK_LINKS);
      await expect(columnLinks(page, 'Company'), route).toHaveText(COMPANY);
    }
  });

  test('lists the official social accounts in the required order', async ({ page }) => {
    await page.goto('/');
    const socials = page.locator('#alo-public-footer ul[aria-label="ALO Education official social media"] a');
    await expect(socials).toHaveCount(4);
    const hrefs = await socials.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
    expect(hrefs).toEqual(OFFICIAL_SOCIALS);

    const labels = await socials.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')));
    expect(labels).toEqual([
      'ALO Education on Facebook',
      'ALO Education on Instagram',
      'ALO Education on LinkedIn',
      'ALO Education on YouTube',
    ]);
  });

  test('column links resolve to real pages', async ({ page }) => {
    await page.goto('/');
    for (const name of ['Destinations', 'Quick Links', 'Company']) {
      const links = columnLinks(page, name);
      const count = await links.count();
      for (let i = 0; i < count; i += 1) {
        const href = await links.nth(i).getAttribute('href');
        expect(href, `${name} link ${i} has no href`).toBeTruthy();
        const response = await page.request.get(href as string);
        expect(response.status(), `${href} did not resolve`).toBeLessThan(400);
      }
    }
  });

  test('publishes the verified contact details', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('#alo-public-footer');

    await expect(footer.getByRole('link', { name: 'Open in Google Maps' })).toHaveAttribute(
      'href',
      'https://share.google/aarau5V2GfBrICZTj'
    );
    await expect(footer.getByRole('link', { name: '+8801805020101' })).toHaveAttribute(
      'href',
      'https://wa.me/8801805020101'
    );
    await expect(footer.getByRole('link', { name: '+8801805020101-10' })).toHaveAttribute(
      'href',
      'tel:+8801805020101'
    );
    await expect(footer.getByRole('link', { name: 'info@aloeducation.com' })).toHaveAttribute(
      'href',
      'mailto:info@aloeducation.com'
    );
    await expect(
      footer.getByText('Barek Mansion-02 (5th Floor), 58/9 Box Culvert Road, Panthapath, Dhaka-1205, Bangladesh.')
    ).toBeVisible();
  });

  test('keeps the moving cap strip in three brand colours and no B2B content', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('#alo-public-footer');

    // Decorative strip: one row per brand colour (Education Blue, ALO Orange, Accent).
    const strip = footer.getByTestId('alo-cap-strip');
    await expect(strip).toHaveCount(1);
    await expect(strip.locator('svg.lucide-graduation-cap').first()).toBeAttached();

    for (const colour of ['#0066CC', '#F37021', '#FFB347']) {
      await expect(strip.locator(`div[style*="${colour}"]`), `${colour} row missing`).toHaveCount(1);
    }

    // The strip is "live moving": three animated tracks, each holding the cap
    // sequence four times so the loop never shows a gap.
    await expect(strip.locator('.alo-cap-left')).toHaveCount(2);
    await expect(strip.locator('.alo-cap-right')).toHaveCount(1);
    await expect(strip.locator('.alo-cap-left').first().locator('svg.lucide-graduation-cap')).toHaveCount(52);

    const animations = await strip.locator('.alo-cap-track').evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return { name: style.animationName, duration: style.animationDuration, iteration: style.animationIterationCount };
      })
    );
    expect(animations).toHaveLength(3);
    for (const animation of animations) {
      expect(animation.name, 'cap strip is not animated').toMatch(/alo-cap-(left|right)/);
      expect(animation.iteration).toBe('infinite');
    }

    // No B2B partner-recruitment content in the footer.
    const footerText = (await footer.innerText()).toLowerCase();
    for (const banned of ['Become A Partner', 'Partner Portal', 'Partner Login', 'B2B']) {
      expect(footerText, `B2B content leaked into the footer: ${banned}`).not.toContain(banned.toLowerCase());
    }
  });

  test('is absent from authenticated shells and auth entry screens', async ({ page }) => {
    for (const route of ['/student/login', '/partner/login', '/employee/login', '/login']) {
      await page.goto(route);
      await expect(page.locator('#alo-public-footer'), `footer leaked into ${route}`).toHaveCount(0);
    }
  });
});
