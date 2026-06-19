# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: homepage.test.ts >> homepage loads
- Location: e2e/homepage.test.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Static Blog')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=Static Blog')

```

```yaml
- text: Cannot GET /
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('homepage loads', async ({ page }) => {
  4  |   await page.goto('/');
> 5  |   await expect(page.locator('text=Static Blog')).toBeVisible({ timeout: 10000 });
     |                                                  ^ Error: expect(locator).toBeVisible() failed
  6  |   
  7  |   // Wait for client-side hydration to complete
  8  |   await expect(page.locator('input[placeholder="Search posts..."]')).toBeVisible({ timeout: 15000 });
  9  |   
  10 |   const tagFilter = await page.locator('text=Filter by tags:');
  11 |   await expect(tagFilter).toBeVisible({ timeout: 15000 });
  12 | });
  13 | 
  14 | test('posts page loads', async ({ page }) => {
  15 |   await page.goto('/posts');
  16 |   const heading = await page.locator('h1:has-text("Posts")');
  17 |   await expect(heading).toBeVisible({ timeout: 15000 });
  18 | });
  19 | 
  20 | test('post detail page loads', async ({ page }) => {
  21 |   // Use a slug from the seeded data
  22 |   await page.goto('/posts/hello-world');
  23 |   const heading = await page.locator('h1');
  24 |   await expect(heading).toBeVisible({ timeout: 15000 });
  25 | });
```