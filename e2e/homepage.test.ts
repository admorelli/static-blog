import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Static Blog', exact: true })).toBeVisible({ timeout: 30000 });
  await expect(page.getByPlaceholder('Search posts...')).toBeVisible({ timeout: 30000 });

  const tagFilter = await page.locator('text=Filter by tags:');
  await expect(tagFilter).toBeVisible({ timeout: 30000 });
});

test('posts page loads', async ({ page }) => {
  await page.goto('/posts');
  const heading = await page.locator('h1:has-text("Posts")');
  await expect(heading).toBeVisible({ timeout: 30000 });
});

test('post detail page loads', async ({ page }) => {
  await page.goto('/posts/code-quality-and-optimization');
  const heading = await page.locator('h1');
  await expect(heading).toBeVisible({ timeout: 30000 });
});

test('series page loads', async ({ page }) => {
  await page.goto('/series/getting-started');
  const heading = await page.locator('h1');
  await expect(heading).toBeVisible({ timeout: 30000 });
});

test('series page has OpenGraph and JSON-Ld metadata', async ({ page }) => {
  await page.goto('/series/getting-started');
  const ogTitle = await page.locator('meta[property="og:title"]');
  await expect(ogTitle).toHaveCount(1);
  await expect(ogTitle).toHaveAttribute('content', 'getting-started - Series');

  const jsonLd = await page.locator('script[type="application/ld+json"]');
  await expect(jsonLd).toHaveCount(1);
  const text = await jsonLd.textContent();
  expect(text).toContain('"@type":"CollectionPage"');
});

test('post detail page renders optimized images', async ({ page }) => {
  await page.goto('/posts/how-we-got-image-optimization-working-the-good-the-bad-and-the-lcp');
  await expect(page.locator('h1')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.prose img')).toBeVisible({ timeout: 30000 });
});

test('post detail page has OpenGraph metadata', async ({ page }) => {
  await page.goto('/posts/how-we-got-image-optimization-working-the-good-the-bad-and-the-lcp');
  const ogTitle = await page.locator('meta[property="og:title"]');
  await expect(ogTitle).toHaveCount(1);
  await expect(ogTitle).toHaveAttribute('content', 'How We Got Image Optimization Working: The Good, The Bad, and The LCP');

  const ogType = await page.locator('meta[property="og:type"]');
  await expect(ogType).toHaveAttribute('content', 'article');
});

test('post detail page has Twitter metadata', async ({ page }) => {
  await page.goto('/posts/how-we-got-image-optimization-working-the-good-the-bad-and-the-lcp');
  const twitterCard = await page.locator('meta[name="twitter:card"]');
  await expect(twitterCard).toHaveCount(1);
  await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');
});

test('post detail page has JSON-Ld', async ({ page }) => {
  await page.goto('/posts/how-we-got-image-optimization-working-the-good-the-bad-and-the-lcp');
  const jsonLd = await page.locator('script[type="application/ld+json"]');
  await expect(jsonLd).toHaveCount(1);
  const text = await jsonLd.textContent();
  expect(text).toContain('"@type":"BlogPosting"');
  expect(text).toContain('"@context":"https://schema.org"');
});

test.skip('homepage loads without analytics provider configured', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Static Blog', exact: true })).toBeVisible({ timeout: 30000 });
  await expect(page.getByPlaceholder('Search posts...')).toBeVisible({ timeout: 30000 });
});
