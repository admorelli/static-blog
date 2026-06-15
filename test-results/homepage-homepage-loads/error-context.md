# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: homepage.test.ts >> homepage loads
- Location: e2e/homepage.test.ts:3:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/
Call log:
  - navigating to "http://localhost:3001/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('homepage loads', async ({ page }) => {
> 4  |   await page.goto('http://localhost:3001/');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/
  5  |   await expect(page.locator('text=Home')).toBeVisible({ timeout: 10000 });
  6  |   
  7  |   const searchInput = await page.locator('input[placeholder="Search posts..."]');
  8  |   await expect(searchInput).toBeVisible();
  9  |   
  10 |   const tagFilter = await page.locator('text=Filter by tags:');
  11 |   await expect(tagFilter).toBeVisible();
  12 | });
  13 | 
  14 | test('posts page loads', async ({ page }) => {
  15 |   await page.goto('http://localhost:3001/posts');
  16 |   const heading = await page.locator('h1:has-text("Posts")');
  17 |   await expect(heading).toBeVisible({ timeout: 10000 });
  18 | });
  19 | 
  20 | test('create page loads', async ({ page }) => {
  21 |   await page.goto('http://localhost:3001/create');
  22 |   const heading = await page.locator('text=Create New Post');
  23 |   await expect(heading).toBeVisible({ timeout: 10000 });
  24 | });
```