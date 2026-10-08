import { test, expect } from '@playwright/test';

test('no WebGL: fallback stills show and cross-fade with scroll', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error stub
    HTMLCanvasElement.prototype.getContext = function (t: string, ...a: unknown[]) { return /webgl/.test(t) ? null : orig.call(this, t as '2d', ...(a as [])); };
  });
  await page.goto('/');
  await expect(page.locator('#room')).toHaveClass(/fallback/, { timeout: 10_000 });
  await expect(page.locator('.still[data-index="0"]')).toHaveCSS('opacity', '1');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('.still[data-index="5"]')).toHaveCSS('opacity', '1');
  await expect(page.locator('.still[data-index="0"]')).toHaveCSS('opacity', '0');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
});

test('context loss switches to fallback, restore brings the canvas back', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#room')).toHaveAttribute('data-scene', 'ready', { timeout: 15_000 });
  await page.evaluate(() => {
    const gl = document.querySelector<HTMLCanvasElement>('#room canvas')!.getContext('webgl2')!;
    (window as any).__lose = gl.getExtension('WEBGL_lose_context');
    (window as any).__lose.loseContext();
  });
  await expect(page.locator('#room')).toHaveClass(/fallback/);
  await page.evaluate(() => (window as any).__lose.restoreContext());
  await expect(page.locator('#room')).not.toHaveClass(/fallback/, { timeout: 10_000 });
});
