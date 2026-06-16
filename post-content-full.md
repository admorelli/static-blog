---
title: "Fixing a Static Blog: From Broken URLs to Working Markdown"
date: "2025-06-16"
tags: ["nextjs", "github-pages", "static-site", "debugging", "markdown", "deployment", "urls", "basepath", "gray-matter", "marked"]
---

Today I spent the entire day debugging a Next.js 13 static blog deployed to GitHub Pages. What started as a simple "posts not showing" issue turned into a cascade of interconnected problems: broken URLs, 404s on JSON endpoints, post pages showing "Post not found", dark mode not working, and markdown rendering as garbled text.

Here's the full story of what broke, why, and how I fixed each piece.

## The Stack

- **Framework:** Next.js 13 (App Router, Static Export `output: 'export'`)
- **Database:** SQLite + Drizzle ORM (committed `db.sqlite` to repo for CI)
- **Styling:** Tailwind + shadcn/ui + prose dark mode
- **Deploy:** GitHub Pages via GitHub Actions
- **Base path:** `/static-blog` (repository name)

## Problem 1: Post Links on Home Page Had Wrong URLs

**Symptom:** Clicking a post from the home page navigated to `https://admorelli.github.io/posts/slug` instead of `https://admorelli.github.io/static-blog/posts/slug` → **404**.

**Root Cause:** The `PostsList` component in `app/page-client.tsx` used hardcoded relative paths:

```tsx
<a href={`/posts/${post.slug}`}>
```

**Fix:** Use the `basePath` from the meta tag:

```tsx
const basePath = getBasePath();
<a href={`${basePath}/posts/${post.slug}`}>
```

The `getBasePath()` function reads `meta[name="next-base-path"]` injected by `next.config.ts`.

## Problem 2: JSON Data Endpoints Returned 404 on Client

**Symptom:** `fetch('/data/tags.json')` returned 404. Network tab showed requests to `/data/tags.json` instead of `/static-blog/data/tags.json`.

**Root Cause:** The CI workflow had invalid syntax:

```yaml
env:
  NEXT_PUBLIC_BASE_PATH: /${{ github.repository.split('/')[1] }}
```

GitHub Actions YAML doesn't support JavaScript `.split()`. The expression evaluates to empty string, so the meta tag `<meta name="next-base-path" content="">` was empty.

**Fix:** Extract repo name in a separate step using bash parameter expansion:

```yaml
- name: Extract repo name
  id: repo
  run: echo "name=${GITHUB_REPOSITORY#*/}" >> $GITHUB_OUTPUT
  env:
    GITHUB_REPOSITORY: ${{ github.repository }}

- name: Build static site
  run: NEXT_SERIALIZE_EMPTY=true npm run build
  env:
    NEXT_PUBLIC_BASE_PATH: /${{ steps.repo.outputs.name }}
```

Now `<meta name="next-base-path" content="/static-blog">` renders correctly.

## Problem 3: Post Pages Showed "Post Not Found"

**Symptom:** Visiting `/static-blog/posts/hello-world/` showed "Post not found" with a 200 status (the 404 fallback page).

**Root Cause (Two Issues):**

1. **Next.js 15+ makes `params` a Promise:** The page component expected `{ params: { slug: string } }` but received `{ params: Promise<{ slug: string }> }`.

2. **Database access in page components fails in CI:** `generateStaticParams` works (runs during build), but the page component's `getPostBySlug` queried the SQLite database — which fails in parallel CI workers due to connection limits.

**Fix:**

```tsx
export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Read from JSON instead of database
  const post = postsIndex.posts.find((p) => p.slug === slug);
  if (!post) return notFound();
  // ...
}
```

Use the same JSON file (`posts-index.json`) that `generateStaticParams` uses. No database calls in page components.

## Problem 4: Dark Mode Didn't Work

**Symptom:** Toggle switched theme but UI stayed white (light mode).

**Root Cause:** The `<html>` tag had `suppressHydrationWarning` which prevents React from applying the `dark` class during client hydration.

**Fix:**

```tsx
// BROKEN
<html suppressHydrationWarning>

// FIXED
<html>
```

Remove `suppressHydrationWarning`. The `ThemeProvider`'s `useEffect` can now toggle the `dark` class on `document.documentElement`, and CSS variables kick in properly.

## Problem 5: Typecheck Failed in CI

**Symptom:** `tsc --noEmit` failed with "Cannot find module '@/lib/static-posts-generated'".

**Root Cause:** The module was generated during build, but `tsc --noEmit` runs *before* build in CI.

**Fix:** Import the JSON directly and define types inline:

```tsx
import postsIndex from '@/public/data/posts-index.json';

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
}
```

Avoid generated modules entirely — import the committed JSON source of truth.

## Problem 6: Markdown Rendering as Garbled Text

**Symptom:** Post content showed raw markdown with frontmatter visible (`---title: "..."---`), tables as pipe-separated text, bullet lists as `- item<br>`, code blocks as `<code></code><code>`.

**Root Cause:** Custom `markdownToHtml()` function with regex replacements was too naive.

**Fix:** Use proper libraries:

```bash
npm install gray-matter marked
```

```tsx
import matter from 'gray-matter';
import { marked } from 'marked';

function parseFrontmatter(content: string) {
  const { data, content: markdownContent } = matter(content);
  return { title: data.title, date: data.date, tags: data.tags, content: markdownContent };
}

function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}
```

Now tables render as `<table><thead><tr><th>`, lists as `<ul><li>`, code blocks as `<pre><code class="language-python">`, etc.

## Problem 7: SQLite Database Lock in CI

**Symptom:** Build failures in CI with "database is locked" errors.

**Fix:**

```yaml
- name: Build static site
  run: NEXT_SERIALIZE_EMPTY=true npm run build
```

The `NEXT_SERIALIZE_EMPTY=true` environment variable tells Next.js to serialize the build, preventing database connection pool exhaustion across workers.

## Problem 8: GitHub Pages Legacy Mode

**Symptom:** Site served README.md instead of the built static site.

**Root Cause:** GitHub Pages was configured in legacy (branch) mode with Jekyll.

**Fix:**

```bash
gh api repos/OWNER/REPO/pages --method PUT \
  -f build_type='workflow' -f source[branch]='master' -f source[path]='/'
```

Switch to workflow-based deployment so the `actions/deploy-pages@v4` action serves the `out/` folder.

## The Fixed Workflow

```yaml
name: Build and Deploy

on:
  push:
    branches: [main, master, dev]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: lts/*
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run test:unit

  build:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: node scripts/generate-static-data.js
      - name: Extract repo name
        id: repo
        run: echo "name=${GITHUB_REPOSITORY#*/}" >> $GITHUB_OUTPUT
        env:
          GITHUB_REPOSITORY: ${{ github.repository }}
      - name: Build static site
        run: NEXT_SERIALIZE_EMPTY=true npm run build
        env:
          GITHUB_REPOSITORY: ${{ github.repository }}
          NEXT_PUBLIC_BASE_PATH: /${{ steps.repo.outputs.name }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/dev' || github.ref == 'refs/heads/master'
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
```

## The Result

| Feature | Status |
|---------|--------|
| Home page with posts | ✅ |
| Search & tag filtering | ✅ |
| Infinite scroll | ✅ |
| `/posts` listing | ✅ |
| Individual post pages | ✅ |
| Dark/light mode toggle | ✅ |
| JSON data endpoints | ✅ |
| Post links with correct base path | ✅ |
| Tables, lists, code blocks | ✅ |
| CI/CD pipeline | ✅ |
| GitHub Pages deployment | ✅ |

## Lessons Learned

1. **GitHub Pages + basePath is a minefield.** Every asset path, meta tag, and client fetch needs the base path.
2. **GitHub Actions expressions ≠ JavaScript.** Use bash for string manipulation.
3. **Next.js Static Export + Database = Pain.** Pre-generate all data to JSON. Keep page components pure.
4. **Next.js 15+ changes `params` to Promise.** Check migration guides.
5. **Use established libraries.** `gray-matter` + `marked` > custom regex.
5. **TypeScript in CI needs all modules.** Avoid generated modules or generate before typecheck.
6. **GitHub Pages legacy mode serves README.** Switch to workflow-based deployment.
6. **Verification loops catch everything.** Lint → Typecheck → Test → Build → Deploy.

## The Stack That Works

| Layer | Choice | Cost |
|-------|--------|------|
| **Framework** | Next.js 13 + SSG | Free |
| **Database** | SQLite + Drizzle | Free |
| **Styling** | Tailwind + shadcn/ui | Free |
| **Frontmatter** | gray-matter | Free |
| **Markdown** | marked | Free |
| **Deploy** | GitHub Pages | Free |
| **CI/CD** | GitHub Actions | Free |
| **Total** | **Production blog** | **$0/month** |

## The Blog Is Live

https://admorelli.github.io/static-blog/

All 7 posts. Working search. Working tags. Working dark mode. Working markdown with tables, code blocks, lists. Working deployment.

---

*Built with Next.js, SQLite, Drizzle, gray-matter, marked, and a lot of debugging. The URL maze is solved.*

---

*Pushed via CLI: `npm run seed && npm run build && git push`*