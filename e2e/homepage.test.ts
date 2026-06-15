import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  await expect(page.locator('text=Home')).toBeVisible({ timeout: 10000 });
  
  const searchInput = await page.locator('input[placeholder="Search posts..."]');
  await expect(searchInput).toBeVisible();
  
  const tagFilter = await page.locator('text=Filter by tags:');
  await expect(tagFilter).toBeVisible();
});

test('posts page loads', async ({ page }) => {
  await page.goto('http://localhost:3001/posts');
  const heading = await page.locator('h1:has-text("Posts")');
  await expect(heading).toBeVisible({ timeout: 10000 });
});

test('create page loads', async ({ page }) => {
  await page.goto('http://localhost:3001/create');
  const heading = await page.locator('text=Create New Post');
  await expect(heading).toBeVisible({ timeout: 10000 });
});