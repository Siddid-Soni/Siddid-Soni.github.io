import { test, expect } from '@playwright/test';

test('scene boots after first paint and renders a canvas', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#room canvas')).toHaveCount(1, { timeout: 15_000 });
  await expect(page.locator('#room')).toHaveAttribute('data-scene', 'ready', { timeout: 15_000 });
});

test('scrolling to contact switches to night and updates the clock', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  await expect(page.locator('#clock')).toHaveText('☾ 00:00');
  await expect(page.locator('.scrubber a[href="#contact"]')).toHaveAttribute('aria-current', 'true');
});

test('focusing a project card fires portfolio:project-focus', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as any).__focus = [];
    addEventListener('portfolio:project-focus', (e) => (window as any).__focus.push((e as CustomEvent).detail.slug));
  });
  await page.locator('a.card').first().focus();
  await page.locator('a.cue').focus();
  expect(await page.evaluate(() => (window as any).__focus)).toEqual(['realtime-chat', null]);
});
