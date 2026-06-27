# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search.test.ts >> search page loads and returns results
- Location: e2e/search.test.ts:13:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h2')
Expected substring: "Hello World"
Error: strict mode violation: locator('h2') resolved to 2 elements:
    1) <h2 class="text-xl font-semibold mb-2">Fixing a Static Blog: From Broken URLs to Working…</h2> aka getByRole('link', { name: 'Fixing a Static Blog: From' })
    2) <h2 class="text-xl font-semibold mb-2">Hello World</h2> aka getByRole('link', { name: 'Hello World' })

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h2')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - heading "Search" [level=1] [ref=e4]
      - textbox "Search posts..." [ref=e6]: hello-world
      - paragraph [ref=e7]: 2 results for "hello-world"
      - list [ref=e8]:
        - listitem [ref=e9]:
          - 'link "Fixing a Static Blog: From Broken URLs to Working Markdown" [ref=e10] [cursor=pointer]':
            - /url: /posts/fixing-static-blog-broken-urls-markdown
            - 'heading "Fixing a Static Blog: From Broken URLs to Working Markdown" [level=2] [ref=e11]'
          - paragraph [ref=e12]: 6/16/2026
          - paragraph [ref=e13]: "--- title: \"Fixing a Static Blog: From Broken URLs to Working Markdown\" date: \"2025-06-16\" tags: [\"nextjs\", \"github-pages\", \"static-site\", \"debugging\", \"markdown\", \"deployment\", \"urls\", \"basepath\", \"g..."
        - listitem [ref=e14]:
          - link "Hello World" [ref=e15] [cursor=pointer]:
            - /url: /posts/hello-world
            - heading "Hello World" [level=2] [ref=e16]
          - paragraph [ref=e17]: 6/15/2026
          - paragraph [ref=e18]: Welcome to my blog built with Next.js, Tailwind and Drizzle ORM. ![e2e-check](/images/posts/hello-world/hello-world.webp)...
  - alert [ref=e19]
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
  10 |   await expect(page.locator('h2').first()).toContainText('Hello World', { timeout: 10000 });
  11 | });
  12 | 
  13 | test('search page loads and returns results', async ({ page }) => {
  14 |   await page.goto('/search?q=hello-world');
  15 |   await expect(page.locator('h1')).toContainText('Search', { timeout: 30000 });
  16 | 
> 17 |   await expect(page.locator('h2')).toContainText('Hello World');
     |                                    ^ Error: expect(locator).toContainText(expected) failed
  18 |   await expect(page.locator('text=1 result')).toBeVisible({ timeout: 30000 });
  19 | });
  20 | 
  21 | test('search page shows no results for unknown query', async ({ page }) => {
  22 |   await page.goto('/search?q=zzzzzz-not-a-real-post-zzzzzz');
  23 |   await expect(page.locator('text=No matching posts found.')).toBeVisible({ timeout: 30000 });
  24 | });
  25 | 
```