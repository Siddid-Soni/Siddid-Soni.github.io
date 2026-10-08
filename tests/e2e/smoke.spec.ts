import { test, expect } from '@playwright/test';

test('home page responds', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
