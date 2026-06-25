import { test, expect } from '@playwright/test';

test.skip('image support: post detail preserves copied image reference and path', async ({ page }) => {
  await page.goto('/posts/hello-world');
  await expect(page.locator('h1')).toHaveText('Hello World', { timeout: 30000 });

  const img = page.locator('.prose img[alt="e2e-check"]');
  await expect(img).toBeVisible({ timeout: 30000 });
  await expect(img).toHaveAttribute('src', '/images/posts/hello-world/hello-world.webp');
});
