import { test, expect } from '@playwright/test';

test('homepage search filters posts by title', async ({ page }) => {
  await page.goto('/search?q=Code+Quality+and+Optimization');
  await page.waitForLoadState('networkidle');

  const matching = page.locator('h2').filter({ hasText: 'Code Quality and Optimization' });
  await expect(matching).toHaveCount(1, { timeout: 10000 });
  await expect(matching.first()).toContainText('Code Quality and Optimization', { timeout: 10000 });
});

test('search page loads and returns results', async ({ page }) => {
  await page.goto('/search?q=Code+Quality');
  await expect(page.locator('h1')).toContainText('Search', { timeout: 30000 });

  const matching = page.locator('h2').filter({ hasText: 'Code Quality and Optimization' });
  await expect(matching).toHaveCount(1, { timeout: 30000 });
  await expect(page.locator('text=/result/')).toBeVisible({ timeout: 30000 });
});

test('search page shows no results for unknown query', async ({ page }) => {
  await page.goto('/search?q=zzzzzz-not-a-real-post-zzzzzz');
  await expect(page.locator('text=No matching posts found.')).toBeVisible({ timeout: 30000 });
});
