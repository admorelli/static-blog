import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('http://localhost:3000');
  // Check that the main heading is present
  const heading = await page.locator('text=To get started, edit the page.tsx file.');
  await expect(heading).toBeVisible();
});
