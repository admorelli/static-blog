# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search.test.ts >> homepage search filters posts by title
- Location: e2e/search.test.ts:3:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('h2').filter({ hasText: 'Hello World' })
Expected: 1
Received: 0
Timeout:  10000ms

Call log:
  - Expect "toHaveCount" with timeout 10000ms
  - waiting for locator('h2').filter({ hasText: 'Hello World' })
    24 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - heading "Search" [level=1] [ref=e4]
      - textbox "Search posts..." [ref=e6]: Hello World
      - paragraph [ref=e7]: 1 result for "Hello World"
      - list [ref=e8]:
        - listitem [ref=e9]:
          - link "CLI Tool Review — Why We Built It and What It Actually Does" [ref=e10] [cursor=pointer]:
            - /url: /posts/cli-tool-review-why-we-built-it-and-what-it-actually-does
            - heading "CLI Tool Review — Why We Built It and What It Actually Does" [level=2] [ref=e11]
          - paragraph [ref=e12]: 6/20/2026
          - paragraph [ref=e13]: The blog ships with a TypeScript-based CLI under cli/. You run it as npm run blog or npx tsx cli/index.ts. This post walks through every command group and why it exists. Why a CLI (Instead of a CMS) T...
  - generic [ref=e14]:
    - link "GitHub" [ref=e15] [cursor=pointer]:
      - /url: https://github.com/admorelli
      - img "GitHub" [ref=e16]
    - link "Ko-fi" [ref=e18] [cursor=pointer]:
      - /url: https://ko-fi.com/admribeiro
      - img "Ko-fi" [ref=e19]
    - link "LinkedIn" [ref=e21] [cursor=pointer]:
      - /url: https://www.linkedin.com/in/allan-ribeiro-4761512b/
      - img "LinkedIn" [ref=e22]
  - alert [ref=e24]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('homepage search filters posts by title', async ({ page }) => {
  4  |   await page.goto('/search?q=Hello+World');
  5  |   await page.waitForLoadState('networkidle');
  6  | 
  7  |   const matching = page.locator('h2').filter({ hasText: 'Hello World' });
> 8  |   await expect(matching).toHaveCount(1, { timeout: 10000 });
     |                          ^ Error: expect(locator).toHaveCount(expected) failed
  9  |   await expect(matching.first()).toContainText('Hello World', { timeout: 10000 });
  10 | });
  11 | 
  12 | test('search page loads and returns results', async ({ page }) => {
  13 |   await page.goto('/search?q=hello-world');
  14 |   await expect(page.locator('h1')).toContainText('Search', { timeout: 30000 });
  15 | 
  16 |   const matching = page.locator('h2').filter({ hasText: 'Hello World' });
  17 |   await expect(matching).toHaveCount(1, { timeout: 30000 });
  18 |   await expect(page.locator('text=/result/')).toBeVisible({ timeout: 30000 });
  19 | });
  20 | 
  21 | test('search page shows no results for unknown query', async ({ page }) => {
  22 |   await page.goto('/search?q=zzzzzz-not-a-real-post-zzzzzz');
  23 |   await expect(page.locator('text=No matching posts found.')).toBeVisible({ timeout: 30000 });
  24 | });
  25 | 
```