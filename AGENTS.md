# Project Overview

This file contains the current project layout, architecture, and development guidance.

---

## 📁 Current File Structure
```
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home page (server component)
│   ├── page-client.tsx    # Home client (search, tag pills, infinite scroll)
│   ├── layout.tsx         # Root layout + providers
│   ├── header.tsx         # Navigation header with theme toggle
│   ├── providers.tsx      # React Query + Theme providers
│   ├── globals.css        # Tailwind v4 + CSS custom properties
│   ├── analytics.tsx      # Privacy analytics loader (Plausible/Umami)
│   ├── search/
│   │   ├── page.tsx       # Search page (server)
│   │   └── page-client.tsx # Search client
│   ├── posts/
│   │   ├── page.tsx       # Posts list (SSG)
│   │   └── [slug]/
│   │       └── page.tsx   # Post detail (SSG)
│   └── components/        # Shared UI components
│       ├── GiscusComments
│       ├── SkeletonLoaders
│       └── TableOfContents
├── lib/                   # Utilities & API helpers
│   ├── posts.ts
│   ├── tags.ts
│   ├── render.ts
│   └── static-posts-generated.ts
├── db/                    # SQLite + Drizzle
│   ├── db.ts
│   └── schema.ts
├── scripts/
│   ├── generate-static-data.ts
│   ├── generate-feed.ts
│   └── generate-sitemap.js
├── cli/                   # TypeScript CLI
│   └── ...
├── hooks/
│   └── use-home-filters.ts
├── public/data/
├── out/
├── __tests__/
└── e2e/
```

---

## ⚙️ Architecture Overview

- **Next.js 16 App Router** – Server-first rendering with static export (`output: 'export'`).
- **SQLite + Drizzle ORM** – Local persistent store. SQLite file (`db.sqlite`) is committed for CI consistency.
- **Tailwind CSS v4** – CSS-first config with `@theme inline`.
- **TanStack Query** – Client-side data fetching, caching, and infinite scroll.
- **GitHub Actions** – Build → static site generation → deploy to GitHub Pages.
- **Vitest** for unit tests, **Playwright** for e2e.

Refer to `docs/architecture.md` for detailed design decisions.

---

## 🔬 Code Quality

Low duplication at token level: 152 duplicated lines (3.5%) / 1,260 duplicated tokens (4.9%) across 57 files.

Recent refactor completed:
- extract hooks into `app/hooks/use-home-filters.ts`
- shared rendering moved to `lib/render.ts`
- test cleanup helper at `tests/utils/cleanup.ts`

No further code-quality follow-ups are currently open.

---

## 🔄 Contribution Workflow

1. Run `make test` (or `npm run test:unit && npm run test:e2e`) to verify tests pass.
2. Run `make lint` (or `npm run lint`) and fix any new errors.
3. Commit your changes with a descriptive message.
4. Open a PR against `master`. CI will run lint, tests, and build automatically.
5. After CI success, merge to `master`.

> Note: Playwright E2E tests are currently disabled at the test file level (`test.skip(...)` in `e2e/*.test.ts`). The assertions and selectors are preserved so they can be re-enabled later without rewriting tests.

---

## 🚀 Development Commands

Use the top-level `Makefile` for common tasks.

```bash
make dev       # start dev server
make build     # production build
make test      # unit + e2e
make lint      # eslint
make seed      # seed sample data into SQLite
make drizzle-push # push Drizzle schema changes to SQLite
```