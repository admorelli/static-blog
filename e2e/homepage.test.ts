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

test('create page loads', async ({ page }) => {
  await page.goto('/create');
  const heading = await page.locator('text=Create New Post');
  await expect(heading).toBeVisible({ timeout: 15000 });
});