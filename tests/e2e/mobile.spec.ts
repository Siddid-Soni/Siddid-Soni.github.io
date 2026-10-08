import { test, expect } from '@playwright/test';

test.describe('mobile layout', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 760, 'mobile only');

  test('text sits in a bottom card with no horizontal scroll', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const box = await page.locator('#about .content').boundingBox();
    const vh = page.viewportSize()!.height;
    await page.locator('#about').scrollIntoViewIfNeeded();
    const after = await page.locator('#about .content').boundingBox();
    expect(after!.y).toBeGreaterThan(vh * 0.4);
    expect(box).not.toBeNull();
  });

  test('scrubber is a dot row', async ({ page }) => {
    await page.goto('/');
    const dir = await page.locator('.scrubber ol').evaluate((el) => getComputedStyle(el).gridAutoFlow);
    expect(dir).toBe('column');
  });
});
