import { test, expect } from '@playwright/test';

test('homepage search filters posts by title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[placeholder="Search posts..."]')).toBeVisible({ timeout: 30000 });

  await page.locator('[placeholder="Search posts..."]').fill('E2E Image Test');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('h2').first()).toContainText('E2E Image Test', { timeout: 10000 });
});

test('search page loads and returns results', async ({ page }) => {
  await page.goto('/search?q=e2e-img-test');
  await expect(page.locator('h1')).toContainText('Search', { timeout: 30000 });

  await expect(page.locator('h2')).toContainText('E2E Image Test');
  await expect(page.locator('text=1 result')).toBeVisible({ timeout: 30000 });
});

test('search page shows no results for unknown query', async ({ page }) => {
  await page.goto('/search?q=zzzzzz-not-a-real-post-zzzzzz');
  await expect(page.locator('text=No matching posts found.')).toBeVisible({ timeout: 30000 });
});
