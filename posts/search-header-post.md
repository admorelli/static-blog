---
title: "Building the Search Page and Navigation Header"
description: "Client-side search, tag pills, infinite scroll, and a sticky header — how we shipped the blog's primary navigation."
date: "2026-06-20"
tags: [devlog, search, ui, nextjs]
---

Our navigation stack went through three major iterations. This post covers the final version: client-side search powered by `posts-index.json`, infinite scroll with TanStack Query, and a sticky header with theme toggle.

---

## Why Client-Side Search

The blog uses `output: 'export'`. No server-side runtime (no Next.js server, no API routes, no server functions). That rules out on-demand search via an API endpoint.

We could have:
* pre-generated search JSON at build time
* shipped all post content to the browser and filtered in-memory

We went with option B. During static generation, `scripts/generate-static-data.ts` writes:
* `public/data/posts-index.json` — every post’s title, slug, tags, date, and excerpt
* `public/data/tags.json` — all tags with post counts

The `/search` page loads `posts-index.json` once, and the client component (`app/search/page-client.tsx`) handles query + tag filtering entirely in-memory. For a blog with a few thousand posts this is totally fine; if we hit limits later we could add FTS5 (already available — the DB layer has full-text search for the CLI).

---

## Infinite Scroll

Homepage post list uses `@tanstack/react-query` + `useInfiniteQuery`. The fetcher hits the same `posts` API helper but paginates (10 posts per page). Each response includes a `nextCursor`. The client appends results and watches for the sentinel element at the bottom of the scroll container.

The trick: when you filter by tag or search term, the query **resets** — key changes because `queryKey` includes `[searchTerm, selectedTags]`. TanStack Query invalidates automatically.

---

## Tag Pills

Tags come from `/data/tags.json` and render as `<button aria-pressed>`. You can multi-select. Clicking “All” clears the selection. The JavaScript flow:
1. Click pill -> update `selectedTags` set
2. Re-run the query with new `tagIds`
3. Reset infinite scroll back to page 1

---

## Sticky Header

`app/header.tsx` is a client component that:
* renders the blog name + nav links
* shows a theme toggle button
* **scrolls the page to top** when you click “Home”

It uses CSS `position: sticky; top: 0` under the hood, so it cooperates with the browser’s native scrolling. That also means we don’t fight React re-renders for a no-op sticky header.

Theme toggle is handled by a small class toggle on `<html>` + a `localStorage` key. Tailwind v4 lets us reference custom properties via `@theme inline`, so we can define `--bg` and `--fg` per color scheme.

---

## Friction Points

* Generating two JSON files means one more build step. We resolve this by running it inside `generate-static-data.ts` and not requiring a separate script.
* Type safety on the query keys — mismatched `queryKey` shapes caused stale fetch keys at one point. Fix: typed opaque cursor tokens so the key shape is obvious.
* Mobile nav — the compact header doesn’t have a hamburger; instead we reduced the link set and let the user reach everything in one row. If we add pagination or a “About” page later we’ll revisit this.

---

## Code of Interest

* `app/page-client.tsx` — homepage infinite scroll + search/tag filtering
* `app/search/page.tsx` + `app/search/page-client.tsx` — dedicated search page reuses the same filter logic
* `app/header.tsx` — sticky nav + theme toggle

---

## What’s Next

We’re eyeing an FTS5-backed search UI as an enhancement. The database layer already supports it, so the work is mainly replacing the in-memory filter with a more scalable fetcher. Stay tuned.
