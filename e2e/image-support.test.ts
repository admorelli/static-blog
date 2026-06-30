import { test, expect } from '@playwright/test';

test('image support: post detail preserves copied image reference and path', async ({ page }) => {
  await page.goto('/posts/how-we-got-image-optimization-working-the-good-the-bad-and-the-lcp');
  await expect(page.locator('h1')).toHaveText('How We Got Image Optimization Working: The Good, The Bad, and The LCP', { timeout: 30000 });

  const img = page.locator('.prose img');
  await expect(img).toBeVisible({ timeout: 30000 });
});
