import { existsSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const hasSequence = Array.from({ length: 150 }, (_, index) =>
  existsSync(path.join(process.cwd(), 'public', 'images', 'dreamframe', 'frames', `frame-${String(index + 1).padStart(3, '0')}.png`)),
).every(Boolean);

test('the standalone DreamFrame page is responsive and does not show ALO chrome', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dreamframe');
  await expect(page).toHaveTitle(/DreamFrame/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Imagine it.');
  await expect(page.getByRole('heading', { name: /another dimension/i })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Analytics consent' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const menu = page.getByRole('button', { name: 'Open menu' });
  await menu.click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
});

test('reduced motion keeps the hero to one screen and stops the marquees', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/dreamframe');
  const dimensions = await page.evaluate(() => ({
    hero: document.querySelector<HTMLElement>('.df-hero')!.offsetHeight,
    viewport: window.innerHeight,
    animation: getComputedStyle(document.querySelector<HTMLElement>('.df-marquee-track')!).animationName,
  }));
  expect(Math.abs(dimensions.hero - dimensions.viewport)).toBeLessThanOrEqual(1);
  expect(dimensions.animation).toBe('none');
  if (hasSequence) await expect(page.locator('.df-hero-canvas')).toHaveAttribute('data-frame', '1', { timeout: 30_000 });
});

test('the canvas tracks scroll forward and backward across the sequence', async ({ page }) => {
  test.skip(!hasSequence, 'The 150 source frames have not been supplied yet.');
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/dreamframe');
  const canvas = page.locator('.df-hero-canvas');
  await expect(canvas).toHaveAttribute('data-frame', '1', { timeout: 45_000 });

  for (const progress of [0.25, 0.5, 0.75, 1, 0]) {
    await page.evaluate((position) => {
      const section = document.querySelector<HTMLElement>('.df-hero')!;
      const canvasElement = document.querySelector<HTMLCanvasElement>('.df-hero-canvas')!;
      window.scrollTo(0, (section.offsetHeight - canvasElement.clientHeight) * position);
    }, progress);
    const expected = String(Math.round(progress * 149) + 1);
    await expect(canvas).toHaveAttribute('data-frame', expected, { timeout: 45_000 });
  }
});


test('a failed first frame does not freeze the rest of the sequence', async ({ page }) => {
  test.skip(!hasSequence, 'The 150 source frames have not been supplied yet.');
  test.setTimeout(90_000);
  await page.route('**/images/dreamframe/frames/frame-001.png', (route) => route.abort());
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/dreamframe');
  const canvas = page.locator('.df-hero-canvas');
  await expect.poll(async () => Number(await canvas.getAttribute('data-frame')), { timeout: 45_000 }).toBeGreaterThan(1);
  await page.evaluate(() => {
    const section = document.querySelector<HTMLElement>('.df-hero')!;
    const canvasElement = document.querySelector<HTMLCanvasElement>('.df-hero-canvas')!;
    window.scrollTo(0, section.offsetHeight - canvasElement.clientHeight);
  });
  await expect(canvas).toHaveAttribute('data-frame', '150', { timeout: 45_000 });
});
