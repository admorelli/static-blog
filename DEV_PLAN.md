# Development Plan — static_blog

**Generated:** 2026-06-15  
**Branch:** dev  
**Status:** Active development

---

## 📁 Current Project Structure

```
static_blog/
├── app/                    # Next.js 13 App Router
│   ├── create/page.tsx            # Create post form (dev mode)
│   ├── page.tsx                   # Homepage with search + tag filter + infinite scroll
│   ├── posts/
│   │   ├── page.tsx               # Posts list (static)
│   │   └── [slug]/page.tsx        # Post detail (static, generateStaticParams)
│   ├── globals.css
│   └── layout.tsx
├── cli/                    # CLI tool
│   └── blog.js                  # Inquirer-based CLI for post/tag management
├── db/
│   ├── db.ts                      # Drizzle + better-sqlite3 connection
│   └── schema.ts                  # posts, tags, post_tags tables
├── lib/
│   ├── posts.ts                   # CRUD + listPosts, getPostBySlug, createPost, updatePost, deletePost
│   └── tags.ts                    # listAllTags, listTagsForPost, listPostsPaginated (search + tag filter)
├── scripts/
│   ├── seed.js                    # Seed sample posts (CommonJS)
│   └── generate-static-data.js    # Generate static JSON data for build
├── public/data/                   # Static JSON files (generated at build)
│   ├── posts-index.json
│   ├── tags.json
│   └── post-tags.json
├── __tests__/                     # Vitest unit tests
│   ├── posts.test.ts
│   ├── api-routes.test.ts
│   ├── tags.test.ts
│   └── edge-cases.test.ts
├── e2e/                           # Playwright E2E tests
│   └── homepage.test.ts
├── .github/workflows/
│   └── build-and-deploy.yml       # CI/CD: lint → test → build → deploy
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── Makefile
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── DEV_PLAN.md                    # This file
```

---

## ✅ What's Already Done

| Milestone | Status | Details |
|-----------|--------|---------|
| **M01: Setup** | ✅ Done | Next.js 13 + Tailwind + shadcn/ui + SQLite + Drizzle |
| **M02: CRUD API + Data Layer** | ✅ Done | `lib/posts.ts`, `lib/tags.ts`, `db/schema.ts`, 5 API routes |
| **M03: Homepage UI** | ✅ Done | Search input, tag checkboxes, URL-driven filter state |
| **M03b: Tag Selector** | ✅ Done | Functional on `/` page, fetches `/data/tags.json` |
| **M03c: Infinite Scroll** | ✅ Done | TanStack Query `useInfiniteQuery` with static JSON data |
| **M04: Post Detail** | ✅ Done | `/posts/[slug]` page with `generateStaticParams` |
| **M05: Create Post Page** | ✅ Done | `/create` form (dev mode only) |
| **M06: CI/CD Pipeline** | ✅ Done | GitHub Actions: lint → typecheck → test → build → deploy |
| **M06b: Static Export Config** | ✅ Done | `next.config.ts` with `output: 'export'` |
| **M07: Testing** | ✅ Done | All 39 unit tests passing + E2E tests |
| **Seed Fix** | ✅ Done | Auto-seed in `generate-static-data.js` |

---

## 🎯 Remaining Work (Prioritized)

### P0 — Core Product Completion

| Task | Description | Effort | Dependencies |
|------|-------------|--------|--------------|
| **— All P0 tasks completed —** | | | |

### P1 — Production Hardening

| Task | Description | Effort | Dependencies |
|------|-------------|--------|--------------|
| **RSS / Sitemap** | ✅ Done - `/feed.xml` (RSS 2.0) and `/atom.xml` (Atom 1.0) + `/sitemap.xml` generated at build time | M | Static export |
| **Error/Loading States** | ✅ Done - `error.tsx`, `loading.tsx` boundaries for `/posts/[slug]`, `/create`, `/posts`, `/` | S | — |
| **Tag Autocomplete** | ✅ Done - `/create` page fetches `/data/tags.json` and shows datalist/autocomplete | S | `/data/tags.json` exists |

### P2 — CLI Tool (Per ARCHITECTURE.md) — ✅ COMPLETED

| Task | Description | Effort | Dependencies |
|------|-------------|--------|--------------|
| **CLI: Post Management** | Terminal UI (Inquirer) to create/list/delete posts directly in SQLite. | L | SQLite schema stable |
| **CLI: Tag Management** | List/create/delete tags, associate with posts. | M | CLI core |
| **CLI: Static Export** | `blog generate-static` → generates static JSON data for build. | M | Static export works |
| **CLI: Build** | `blog build` → runs generate-static + next build. | M | Static export works |
| **CLI: Dev Server** | `blog dev` → starts Next.js dev server. | S | — |

### P3 — Polish & Audit

| Task | Description | Effort | Dependencies |
|------|-------------|--------|--------------|
| **M08: Audit & Refactor** | Code review: deduplication, type strictness, component extraction, accessibility pass. | M | All P0 done |
| **Performance** | Add `next/font` optimization, verify bundle size, enable `reactStrictMode`. | S | — |
| **Dark Mode Polish** | ✅ Done - ThemeProvider with localStorage persistence, header toggle, class-based dark mode, system preference detection | S | — |

---

## 🛠 Quick Commands (Makefile)

```bash
make device        # npm run dev
make build         # npm run build
make start         # npm run start
make lint          # npm run lint
make seed          # npm run seed (ts-node scripts/seed.ts)
make drizzle-generate
make drizzle-push
make test-unit     # vitest run
make test-e2e      # playwright test
make test          # test-unit + test-e2e
```

---

## 📋 Next Immediate Actions (This Session)

All P0 tasks completed! ✅
CLI tool (P2) completed! ✅
RSS/Sitemap (P1) completed! ✅
Error/Loading States (P1) completed! ✅
Tag Autocomplete (P1) completed! ✅
**Dark Mode (P3) completed!** ✅

**All P0, P1, and Dark Mode (P3) complete!** 🎉

Next session focus (P3 — remaining):
1. **M08: Audit & Refactor** - Code review, deduplication, type strictness
2. **Performance** - `next/font` optimization, bundle size, `reactStrictMode`

---

## 📝 Notes

- **No auth/admin needed** — CLI pre-fills DB on production (per your note)
- **CLI tool** is separate from web UI; web UI `/create` page remains for ad-hoc use (dev mode only)
- **Database** — SQLite file (`db.sqlite`) committed for CI consistency; auto-created and seeded at build time
- **Tag model** — Normalized (tags + post_tags tables) not JSON; API handles tag creation on-demand
- **Static data** — Generated at build time via `scripts/generate-static-data.js` → `/public/data/*.json`
- **Tests** — All 39 unit tests passing; run `make test-unit` to verify

---

## 🔄 Keeping This Plan Current

> After completing any task, update this file's status tables and move items between P0/P1/P2/P3 as priorities shift.