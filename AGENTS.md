# Project Development Plan

This file contains an up‑to‑date overview of the current project layout, architecture, and the incremental development plan. It serves as a single source of truth for contributors.

---

## 📁 Current File Structure
```
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home page (server component)
│   ├── page-client.tsx    # Home client (search, tag pills, infinite scroll)
│   ├── layout.tsx         # Root layout + providers
│   ├── header.tsx         # Navigation header with theme toggle
│   ├── theme-provider.tsx # Dark/light theme context
│   ├── theme-toggle.tsx   # Theme toggle button
│   ├── providers.tsx      # React Query + Theme providers
│   ├── globals.css        # Tailwind v4 + CSS custom properties
│   ├── posts/
│   │   ├── page.tsx       # Posts list (SSG)
│   │   └── [slug]/
│   │       └── page.tsx   # Post detail (SSG)
├── lib/                   # Utilities & API helpers
│   ├── posts.ts           # Posts CRUD + queries
│   ├── tags.ts            # Tags queries + pagination
│   └── static-posts-generated.ts # Auto-generated static data
├── db/                    # SQLite + Drizzle
│   ├── db.ts              # Drizzle SQLite connection
│   └── schema.ts          # Posts, tags, post_tags tables
├── scripts/               # Build/generation scripts
│   ├── generate-static-data.js  # Generates JSON + TS module
│   ├── generate-feed.js         # Generates RSS/Atom feeds
│   └── generate-sitemap.js      # Sitemap generation
├── cli/                   # CLI tools
│   └── blog.js            # Inquirer-based post/tag management
├── public/data/           # Generated JSON files for SSG
├── out/                   # Static export output
├── __tests__/             # Unit tests (Vitest, 80 tests)
└── e2e/                   # E2E tests (Playwright, 3 tests)
├── .github/
│   └── workflows/
│       └── build-and-deploy.yml   # GitHub Actions pipeline
├── next.config.ts
├── tsconfig.json
├── package.json
├── Makefile               # Common commands
├── drizzle.config.ts
└── eslint.config.mjs
```

---

## ⚙️ Architecture Overview

* **Next.js 15 App Router** – Server-first rendering with static export (`output: 'export'`).
* **SQLite + Drizzle ORM** – Local persistent store for post & tag data. SQLite file (`db.sqlite`) resides in the repo for CI consistency.
* **Tailwind CSS v4** – CSS-first config with `@theme inline` and CSS custom properties for theming.
* **TanStack Query** – Client-side data fetching, caching, and infinite scroll.
* **GitHub Actions** – Build → static site generation → deploy to GitHub Pages.
* **Testing** – Vitest for unit tests (80 tests), Playwright for e2e (3 tests).

Refer to `docs/architecture.md` for detailed design decisions and diagrammatic representation.

---

## 🚀 Development Plan (current state & next steps)

All primary commands are now exposed through a `Makefile` for quick execution. Use `make <task>` (e.g., `make dev`, `make test`) or the underlying npm scripts as shown in `README.md`.

1. **Setup (M01)** – Scaffolded a Next.js 13 app with Tailwind, shadcn/ui, SQLite & Drizzle used in `db/`. ✨
2. **CRUD (M02)** – Data layer (`lib/posts.ts`) and SQLite schema (`db/schema.ts`) are in place, **API routes** and **posts list page** (`app/posts/page.tsx`) are implemented.
3. **UI (M03)** – New homepage (`/`) includes:
   * Search field for title/content.
   * Tag selector with togglable pills (add/remove at will).
   * Infinite scroll loading 10‑post batches respecting the current search/query.
   * Tag list fetched from `/data/tags.json`.
   * Posts list component reused on the `/posts` page.
4. **Post Detail (M04)** – Implemented `/posts/[slug]` page and `/post/[slug]` page with SSG via `generateStaticParams` returning post content and tags.
5. **CLI Tool (M05)** – Full Inquirer-based CLI for post/tag management, static generation, and build. (Web-based `/create` page removed per design decision).
6. **Pipeline (M06)** – CI workflow wired: lint → typecheck → test → build → deploy to GitHub Pages.
7. **Testing (M07)** – 80 unit tests passing (41 regression + 39 existing) + 3 E2E tests.
8. **Theme & Accessibility (M08)** – CSS custom properties for both light/dark themes, semantic color classes, accessible tag pills with `aria-pressed`.

---

### Next Steps (Roadmap)

| Priority | Task | Status |
|----------|------|--------|
| **P0** | Markdown Authoring + Frontmatter (CLI-based) | 🎯 Next |
| **P0** | Homepage Post Previews (~20 lines + "Read more") | 🎯 Next |
| **P0** | Image Support (local + markdown + CLI upload) | 🎯 Next |
| **P1** | Full-Text Search (SQLite FTS5) | Planned |
| **P1** | SEO: Open Graph + Twitter Cards + JSON-LD | Planned |
| **P1** | Image Optimization Pipeline (WebP, responsive, blur) | Planned |
| **P2** | CLI Tool Review (tests, error handling, Markdown authoring commands) | 🎯 Next |
| **P2** | Comments via Giscus (GitHub Discussions) | Planned |
| **P2** | Reading Time + Table of Contents | Planned |
| **P2** | Mobile Nav Drawer + Skeleton Loaders + Empty States | Planned |
| **P2** | Post Series / Collections (ordered, next/prev nav) | Planned |
| **P3** | Newsletter Integration | Backlog |
| **P3** | Privacy-Friendly Analytics (Plausible/Umami) | Backlog |

> **Completed**: RSS/Sitemap generation ✅, Error/loading boundaries ✅, Tag autocomplete on create page ❌ (removed), Dark mode ✅

---

### Quick References

* **Keep plan in sync** – After completing any development task, update the `AGENTS.md` milestones section to reflect the new state.

* **Schema** – `db/schema.ts`
* **Posts API** – `lib/posts.ts`
* **Tags API** – `lib/tags.ts`
* **Static Generation** – `scripts/generate-static-data.js`
* **Feed/Sitemap** – `scripts/generate-feed.js`, `next-sitemap.config.js`
* **CLI** – `cli/blog.js`
* **Workbench** – `scripts/seed.ts` for sample data
* **Tests** – `__tests__/` (unit), `e2e/` (e2e)
* **Docs** – `docs/architecture.md`