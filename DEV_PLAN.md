# Development Plan — static_blog

**Generated:** 2026-06-17
**Branch:** master
**Status:** Active development

---

## 📁 Current Project Structure

```
static_blog/
├── app/                    # Next.js 15 App Router
│   ├── page.tsx                   # Homepage (server component)
│   ├── page-client.tsx            # Home client: search + tag pills + infinite scroll
│   ├── layout.tsx                 # Root layout + providers
│   ├── header.tsx                 # Navigation header with theme toggle
│   ├── theme-provider.tsx         # Dark/light theme context
│   ├── theme-toggle.tsx           # Theme toggle button
│   ├── providers.tsx              # React Query + Theme providers
│   ├── globals.css                # Tailwind v4 + CSS custom properties
│   ├── posts/
│   │   ├── page.tsx               # Posts list (static, SSG)
│   │   └── [slug]/page.tsx        # Post detail (static, generateStaticParams)
│   └── post/[slug]/page.tsx       # Legacy route (kept for compatibility)
├── cli/                    # CLI tool
│   └── blog.js                  # Inquirer-based CLI for post/tag management
├── db/
│   ├── db.ts                      # Drizzle + better-sqlite3 connection
│   └── schema.ts                  # posts, tags, post_tags tables
├── lib/
│   ├── posts.ts                   # CRUD + listPosts, getPostBySlug
│   ├── tags.ts                    # listAllTags, listTagsForPost, listPostsPaginated
│   └── static-posts-generated.ts  # Auto-generated static data (posts)
├── scripts/
│   ├── generate-static-data.js    # Generate static JSON data + TS module for build
│   ├── generate-feed.js           # Generate RSS 2.0 + Atom 1.0 feeds
│   └── seed.js                    # Seed sample posts (used by generate-static-data)
├── public/data/                   # Static JSON files (generated at build)
│   ├── posts-index.json
│   ├── tags.json
│   └── post-tags.json
├── __tests__/                     # Vitest unit tests (80 tests)
│   ├── regression.test.ts         # 41 regression tests
│   ├── posts.test.ts
│   ├── api-routes.test.ts
│   ├── tags.test.ts
│   └── edge-cases.test.ts
├── e2e/                           # Playwright E2E tests (3 tests)
│   └── homepage.test.ts
├── .github/workflows/
│   └── build-and-deploy.yml       # CI/CD: lint → typecheck → test → build → deploy
├── drizzle.config.ts
├── next.config.ts                 # output: 'export' for static export
├── package.json
├── Makefile
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── AGENTS.md
├── DEV_PLAN.md                    # This file
└── README.md
```

---

## ✅ What's Already Done

| Milestone | Status | Details |
|-----------|--------|---------|
| **M01: Setup** | ✅ Done | Next.js 15 + Tailwind v4 + SQLite + Drizzle |
| **M02: CRUD API + Data Layer** | ✅ Done | `lib/posts.ts`, `lib/tags.ts`, `db/schema.ts` |
| **M03: Homepage UI** | ✅ Done | Search input, tag pills (toggleable), URL-driven filter state |
| **M03b: Tag Selector** | ✅ Done | Toggleable pills on `/` page, fetches `/data/tags.json` |
| **M03c: Infinite Scroll** | ✅ Done | TanStack Query `useInfiniteQuery` with static JSON data |
| **M04: Post Detail** | ✅ Done | `/posts/[slug]` + `/post/[slug]` with `generateStaticParams` |
| **M05: CLI Tool** | ✅ Done | Full Inquirer-based CLI: create/list/delete posts & tags, static generation, build, dev |
| **M06: CI/CD Pipeline** | ✅ Done | GitHub Actions: lint → typecheck → test → build → deploy to GitHub Pages |
| **M06b: Static Export Config** | ✅ Done | `next.config.ts` with `output: 'export'` |
| **M07: Testing** | ✅ Done | 80 unit tests passing (41 regression + 39 existing) + 3 E2E tests |
| **M08: Theme & Accessibility** | ✅ Done | CSS custom properties (light/dark), semantic colors, accessible tag pills with `aria-pressed` |

---

## 🎯 Remaining Work (Prioritized)

### P0 — Core Content Experience (Next Session Focus)

| Task | Description | Effort | Dependencies |
|------|-------------|--------|--------------|
| **Markdown Authoring + Frontmatter** | Write posts in `.md` files; CLI parses frontmatter (title, date, tags, description, series), converts Markdown → HTML, stores in DB. | L | CLI core, unified/remark for MD parsing |
| **Homepage Post Previews** | Show ~20 lines of post content on homepage with "Read more" link to `/posts/[slug]`. Truncate at block boundary (paragraph). | M | Post content in static JSON, CSS line-clamp or JS truncation |
| **Image Support (Local + Markdown + CLI)** | `blog add-image <slug> <path>` → copies to `/public/images/posts/<slug>/`, returns markdown `![alt](/images/posts/slug/img.png)`. Build script processes markdown images to `<img>` with width/height. | M | Public folder structure, markdown processing pipeline |

### P1 — Discovery & SEO

| Task | Description | Effort | Dependencies |
|------|-------------|--------|--------------|
| **Full-Text Search** | SQLite FTS5 virtual table on posts.content + title. Server-side search API + client UI integration. Replaces/augments client-side filter. | M | Schema migration, FTS5 extension |
| **SEO: Open Graph + Twitter Cards + JSON-LD** | Meta tags on post pages: `og:title`, `og:description`, `og:image`, `twitter:card`, `article:published_time`, `Article` schema.org JSON-LD. | S | Post detail page, frontmatter description field |
| **Image Optimization Pipeline** | Build-time: Sharp → WebP/AVIF, multiple widths (400, 800, 1200), blur placeholder (base64), `srcset`/`sizes` generation. | M | Image support, Sharp dependency |

### P2 — Engagement & Polish

| Task | Description | Effort | Dependencies |
|------|-------------|--------|--------------|
| **Comments via Giscus** | Embed GitHub Discussions comment widget on post pages. Zero backend, uses GitHub auth. | S | GitHub repo with Discussions enabled |
| **Reading Time Estimate** | Compute from word count (~200 wpm), display on post meta. | S | Frontmatter or computed at build |
| **Table of Contents** | Auto-generate from `<h2>`/`<h3>` in post content, sticky sidebar on desktop, collapsible on mobile. | M | Post detail page, HTML parsing |
| **Mobile Nav Drawer** | Hamburger menu → slide-in drawer with nav links, tag filter, theme toggle. | M | Header component, CSS animation |
| **Skeleton Loaders + Empty States** | Replace "Loading..." with content-shaped skeletons. Illustrations + helpful copy for empty search/tag results. | S | Homepage client, posts list |
| **Post Series / Collections** | Optional `series` + `series_order` fields. UI: "Part X of Y" badge, next/prev navigation, series landing page. | M | Schema migration, series queries, new page |

### P3 — Growth

| Task | Description | Effort | Dependencies |
|------|-------------|--------|--------------|
| **Newsletter Integration** | Buttondown/ConvertKit embed in post footer + homepage. | S | External service account |
| **Privacy-Friendly Analytics** | Plausible or Umami self-hosted. No cookie banner needed. | S | Analytics account / self-host |
| **Series Landing Page** | `/series/[slug]` showing all posts in order with progress indicator. | M | Post series feature |

---

## 🛠 Quick Commands (Makefile)

```bash
make dev          # npm run dev
make build        # npm run build
make start        # npm run start
make lint         # npm run lint
make test-unit    # vitest run
make test-e2e     # playwright test
make test         # test-unit + test-e2e
make drizzle-generate
make drizzle-push
```

---

## 📋 Current Session Summary

All P0 (core product), P1 (production hardening), P2 (CLI tool), and M08 (Dark Mode) complete! ✅

| Feature | Status |
|---------|--------|
| Broken URL/slug handling | ✅ Tested & fixed via regression tests |
| Header/navigation on all pages | ✅ Implemented |
| Frontmatter/Markdown parsing | ✅ Working (HTML stored in DB) |
| JSON file accessibility | ✅ Verified via regression tests |
| Color schemes (light/dark) | ✅ CSS custom properties |
| Tag filtering as toggleable pills | ✅ Implemented with `aria-pressed` |
| RSS/Atom feeds | ✅ Generated at build |
| Sitemap | ✅ Generated at build |
| Error/Loading boundaries | ✅ Per-route error.tsx/loading.tsx |
| Unit tests | ✅ 80 passing |
| E2E tests | ✅ 3 passing |

**Next focus:** P0 — Markdown Authoring + Homepage Previews + Image Support

---

## 📝 Notes

- **No auth/admin needed** — CLI pre-fills DB on production
- **CLI tool** is the primary way to manage posts; web `/create` page was removed
- **Database** — SQLite file (`db.sqlite`) committed for CI consistency; auto-created and seeded at build time
- **Tag model** — Normalized (tags + post_tags tables); API handles tag creation on-demand
- **Static data** — Generated at build time via `scripts/generate-static-data.js` → `/public/data/*.json`
- **Tests** — All 80 unit tests + 3 E2E tests passing; run `make test` to verify

---

## 🔄 Keeping This Plan Current

> After completing any task, update this file's status tables and move items between priorities as needed. Keep AGENTS.md in sync as well.