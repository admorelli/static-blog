# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search.test.ts >> homepage search filters posts by title
- Location: e2e/search.test.ts:3:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h2').first()
Expected substring: "Hello World"
Received string:    "Code Quality and Optimization"
Timeout: 10000ms

Call log:
  - Expect "toContainText" with timeout 10000ms
  - waiting for locator('h2').first()
    24 × locator resolved to <h2 class="text-xl font-semibold mb-2">Code Quality and Optimization</h2>
       - unexpected value "Code Quality and Optimization"

```

```yaml
- heading "Code Quality and Optimization" [level=2]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('homepage search filters posts by title', async ({ page }) => {
  4  |   await page.goto('/');
  5  |   await expect(page.locator('[placeholder="Search posts..."]')).toBeVisible({ timeout: 30000 });
  6  | 
  7  |   await page.locator('[placeholder="Search posts..."]').fill('Hello World');
  8  |   await page.waitForLoadState('networkidle');
  9  | 
> 10 |   await expect(page.locator('h2').first()).toContainText('Hello World', { timeout: 10000 });
     |                                            ^ Error: expect(locator).toContainText(expected) failed
  11 | });
  12 | 
  13 | test('search page loads and returns results', async ({ page }) => {
  14 |   await page.goto('/search?q=hello-world');
  15 |   await expect(page.locator('h1')).toContainText('Search', { timeout: 30000 });
  16 | 
  17 |   await expect(page.locator('h2')).toContainText('Hello World');
  18 |   await expect(page.locator('text=1 result')).toBeVisible({ timeout: 30000 });
  19 | });
  20 | 
  21 | test('search page shows no results for unknown query', async ({ page }) => {
  22 |   await page.goto('/search?q=zzzzzz-not-a-real-post-zzzzzz');
  23 |   await expect(page.locator('text=No matching posts found.')).toBeVisible({ timeout: 30000 });
  24 | });
  25 | 
```