import { test, expect } from '@playwright/test';

test('homepage search filters posts by title', async ({ page }) => {
  await page.goto('/search');
  await page.waitForLoadState('networkidle');

  const searchInput = page.locator('[placeholder="Search posts..."]');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('Hello World');

  await expect(page.locator('h2').first()).toContainText('Hello World', { timeout: 10000 });
  const visibleHeadings = page.locator('h2');
  await expect(visibleHeadings.first()).toContainText('Hello World', { timeout: 10000 });
  const count = await visibleHeadings.count();
  for (let index = 0; index < count; index++) {
    await expect(visibleHeadings.nth(index)).toContainText('Hello World');
  }
});

test('search page loads and returns results', async ({ page }) => {
  await page.goto('/search?q=hello-world');
  await expect(page.locator('h1')).toContainText('Search', { timeout: 30000 });

  const matching = page.locator('h2').filter({ hasText: 'Hello World' });
  await expect(matching).toHaveCount(1, { timeout: 30000 });
  await expect(page.locator('text=/result/')).toBeVisible({ timeout: 30000 });
});

test('search page shows no results for unknown query', async ({ page }) => {
  await page.goto('/search?q=zzzzzz-not-a-real-post-zzzzzz');
  await expect(page.locator('text=No matching posts found.')).toBeVisible({ timeout: 30000 });
});
