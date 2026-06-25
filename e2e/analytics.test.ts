import { test, expect } from '@playwright/test';

test.skip('homepage loads with analytics disabled by default', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Static Blog')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('input[placeholder="Search posts..."]')).toBeVisible({ timeout: 30000 });
});
