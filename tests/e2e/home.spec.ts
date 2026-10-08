import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const HEADINGS = ['Hi, I’m Siddid Soni.', 'About me', 'Things I’ve built', 'What I work with', 'After hours', 'Let’s build something together.'];

test.describe('home without WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      // @ts-expect-error test stub
      HTMLCanvasElement.prototype.getContext = function (type: string, ...a: unknown[]) {
        return /webgl/.test(type) ? null : orig.call(this, type as '2d', ...(a as []));
      };
    });
  });

  test('renders all six section headings', async ({ page }) => {
    await page.goto('/');
    for (const h of HEADINGS) await expect(page.getByRole('heading', { name: h })).toHaveCount(1);
  });

  test('has contact links and featured project cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
    await expect(page.locator('a.card')).toHaveCount(4);
    await expect(page.locator('a.card').first()).toHaveAttribute('href', '/projects/realtime-chat/');
  });

  test('scrubber jumps to the right section', async ({ page }) => {
    await page.goto('/');
    await page.locator('.scrubber a[href="#skills"]').click();
    await expect(page.locator('#skills')).toBeInViewport({ ratio: 0.5 });
  });

  test('passes axe in day and night themes', async ({ page }) => {
    await page.goto('/');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'night'));
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(7, 5, 26)'); // wait out the .6s theme transition
    expect((await new AxeBuilder({ page }).include('#contact').analyze()).violations).toEqual([]);
  });

  test('focus ring is visible at night', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'night'));
    await page.locator('a.card').first().focus();
    const outline = await page.locator('a.card').first().evaluate((el) => getComputedStyle(el).outlineColor);
    expect(outline).toBe('rgb(106, 255, 200)');
  });
});
