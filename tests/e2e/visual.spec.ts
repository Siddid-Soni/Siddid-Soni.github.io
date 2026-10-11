import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

for (const [label, f] of [['p0', 0], ['p40', 2], ['p80', 4], ['p100', 5]] as const) {
  test(`@visual home at ${label}`, async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#room')).toHaveAttribute('data-scene', 'ready', { timeout: 15_000 });
    await page.evaluate((i) => {
      const s = document.querySelectorAll<HTMLElement>('.sec')[i];
      window.scrollTo(0, i === 5 ? document.documentElement.scrollHeight : s.offsetTop);
    }, f);
    await expect(page.locator('#room')).toHaveAttribute('data-settled', 'true', { timeout: 10_000 });
    await expect(page).toHaveScreenshot(`home-${label}.png`);
  });
}
