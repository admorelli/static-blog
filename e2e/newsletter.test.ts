import { test, expect } from '@playwright/test';

test('newsletter page loads', async ({ page }) => {
  await page.goto('/newsletter');
  const heading = await page.locator('h1:has-text("Newsletter")');
  await expect(heading).toBeVisible({ timeout: 30000 });
});

test('newsletter page shows form', async ({ page }) => {
  await page.goto('/newsletter');
  const form = await page.locator('form');
  await expect(form).toBeVisible({ timeout: 30000 });
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('button:has-text("Subscribe")')).toBeVisible({ timeout: 30000 });
});
