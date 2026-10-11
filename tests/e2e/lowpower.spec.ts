import { test, expect } from '@playwright/test';

// The low-power check must average real frame intervals, not wall-clock time that includes reading
// pauses. Compare the scene's sample with rAF intervals measured in the page during the same moves,
// so the test holds on a slow CI machine (where low-power may legitimately trigger).
test('low-power frame average excludes pauses between pointer movements', async ({ page, isMobile }) => {
  test.skip(isMobile, 'parallax is desktop only');
  await page.goto('/');
  await expect(page.locator('#room')).toHaveAttribute('data-scene', 'ready', { timeout: 15_000 });
  const measured: number[] = [];
  for (const [x, y] of [[400, 300], [1000, 700], [200, 150], [1200, 800]]) {
    await page.mouse.move(x, y);
    measured.push(await page.evaluate(() => new Promise<number>((res) => {
      const t: number[] = [];
      const step = (n: number) => { t.push(n); t.length < 11 ? requestAnimationFrame(step) : res((t[10] - t[0]) / 10); };
      requestAnimationFrame(step);
    })));
    await page.waitForTimeout(2000);
  }
  await expect(page.locator('#room')).toHaveAttribute('data-frame-avg', /\d/, { timeout: 5_000 });
  const avg = Number(await page.locator('#room').getAttribute('data-frame-avg'));
  const real = measured.reduce((a, b) => a + b, 0) / measured.length;
  expect(avg).toBeLessThan(real * 1.5 + 5);
});
