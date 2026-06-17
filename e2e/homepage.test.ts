import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Static Blog')).toBeVisible({ timeout: 10000 });
  
  // Wait for client-side hydration to complete
  await expect(page.locator('input[placeholder="Search posts..."]')).toBeVisible({ timeout: 15000 });
  
  const tagFilter = await page.locator('text=Filter by tags:');
  await expect(tagFilter).toBeVisible({ timeout: 15000 });
});

test('posts page loads', async ({ page }) => {
  await page.goto('/posts');
  const heading = await page.locator('h1:has-text("Posts")');
  await expect(heading).toBeVisible({ timeout: 15000 });
});

test('post detail page loads', async ({ page }) => {
  // Use a slug from the seeded data
  await page.goto('/posts/hello-world');
  const heading = await page.locator('h1');
  await expect(heading).toBeVisible({ timeout: 15000 });
});