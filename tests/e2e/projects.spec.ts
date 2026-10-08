import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const slug of ['realtime-chat', 'ai-notes', 'dev-dashboard', 'cli-toolkit']) {
  test(`project page ${slug} renders`, async ({ page }) => {
    const res = await page.goto(`/projects/${slug}/`);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/#projects');
    await expect(page.locator('canvas')).toHaveCount(0);
  });
}

test('project page passes axe', async ({ page }) => {
  await page.goto('/projects/realtime-chat/');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
