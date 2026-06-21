import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Static Blog')).toBeVisible({ timeout: 30000 });
  
  // Wait for client-side hydration to complete
  await expect(page.locator('input[placeholder="Search posts..."]')).toBeVisible({ timeout: 30000 });
  
  const tagFilter = await page.locator('text=Filter by tags:');
  await expect(tagFilter).toBeVisible({ timeout: 30000 });
});

test('posts page loads', async ({ page }) => {
  await page.goto('/posts');
  const heading = await page.locator('h1:has-text("Posts")');
  await expect(heading).toBeVisible({ timeout: 30000 });
});

test('post detail page loads', async ({ page }) => {
  // Use a slug from the seeded data
  await page.goto('/posts/hello-world');
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
  await page.goto('/posts/e2e-img-test');
  const heading = await page.locator('h1');
  await expect(heading).toBeVisible({ timeout: 30000 });

  const picture = await page.locator('picture');
  await expect(picture).toBeVisible({ timeout: 30000 });

  const source = await picture.locator('source[type="image/webp"]');
  await expect(source).toHaveAttribute('srcset', /400w\.webp 400w/);

  const img = await picture.locator('img');
  await expect(img).toBeVisible({ timeout: 30000 });
  await expect(img).toHaveAttribute('src', /\/posts\/e2e-img-test\/img\/seed-1\/max\.webp/);
});

test('post detail page has OpenGraph metadata', async ({ page }) => {
  await page.goto('/posts/hello-world');
  const ogTitle = await page.locator('meta[property="og:title"]');
  await expect(ogTitle).toHaveCount(1);
  await expect(ogTitle).toHaveAttribute('content', 'Hello World');

  const ogType = await page.locator('meta[property="og:type"]');
  await expect(ogType).toHaveAttribute('content', 'article');
});

test('post detail page has Twitter metadata', async ({ page }) => {
  await page.goto('/posts/hello-world');
  const twitterCard = await page.locator('meta[name="twitter:card"]');
  await expect(twitterCard).toHaveCount(1);
  await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');
});

test('post detail page has JSON-Ld', async ({ page }) => {
  await page.goto('/posts/hello-world');
  const jsonLd = await page.locator('script[type="application/ld+json"]');
  await expect(jsonLd).toHaveCount(1);
  const text = await jsonLd.textContent();
  expect(text).toContain('"@type":"BlogPosting"');
  expect(text).toContain('"@context":"https://schema.org"');
});