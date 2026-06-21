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
│   ├── providers.tsx      # React Query + Theme providers
│   ├── globals.css        # Tailwind v4 + CSS custom properties
│   ├── search/
│   │   ├── page.tsx       # Search page (server)
│   │   └── page-client.tsx # Search client (client-side filtering of posts-index.json)
│   ├── posts/
│   │   ├── page.tsx       # Posts list (SSG)
│   │   └── [slug]/
│   │       └── page.tsx   # Post detail (SSG)
│   └── series/
│       ├── page.tsx       # Series list
│       └── [slug]/
│           └── page.tsx   # Series detail (SSG)
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
├── cli/                   # TypeScript CLI (registry + command modules)
│   ├── index.ts           # Entrypoint: `npm run blog` or `npx tsx cli/index.ts`
│   ├── commands/          # Subcommands grouped by domain
│   │   ├── posts/         # list, create, create-from-markdown, update, delete
│   │   ├── tags/          # list, create, delete, tag-post, untag-post
│   │   ├── images/        # add (deterministic copy + markdown embed)
│   │   └── series/        # list, create, add, reorder
│   └── utils/             # Shared CLI helpers (args, db, help, inquirer, registry, types)
├── public/data/           # Generated JSON files for SSG
├── out/                   # Static export output
├── __tests__/             # Unit tests (Vitest, 80+ tests)
└── e2e/                   # E2E tests (Playwright, 3+ tests)
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
* **Testing** – Vitest for unit tests, Playwright for e2e.

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
7. **Testing (M07)** – Unit/E2E suites in place, with passing unit test baseline maintained.
8. **Theme & Accessibility (M08)** – CSS custom properties for both light/dark themes, semantic color classes, accessible tag pills with `aria-pressed`.

---

### Next Steps (Roadmap)

| Priority | Task | Status |
|----------|------|--------|
| **P0** | Markdown Authoring + Frontmatter (CLI-based) | ✅ Implemented |
| **P0** | Homepage Post Previews (~20 lines + "Read more") | ✅ Implemented |
|| **P0** | Image Support (local + markdown + CLI upload) | ✅ Implemented |
|| **P0** | Image Optimization Pipeline (WebP, responsive, blur) | ✅ Done |
|| **P1** | Database Protection (isolate test DB from production) | ✅ Done |
|| **P1** | Full-Text Search (SQLite FTS5) | ✅ Done |
|| **P1** | Search UI Integration | ✅ Done |
|| **P1** | SEO: Open Graph + Twitter Cards + JSON-LD | ✅ Done |
| **P2** | CLI Tool Review (tests, error handling, Markdown authoring commands) | ✅ Done |
| **P2** | Comments via Giscus (GitHub Discussions) | ✅ Done |
| **P2** | Reading Time + Table of Contents | ✅ Done |
| **P2** | Mobile Nav Drawer + Skeleton Loaders + Empty States | ✅ Done |
| **P2** | Post Series / Collections (ordered, next/prev nav) | ✅ Done |
| **P2** | Newsletter Integration | ✅ Done |
| **P3** | Privacy-Friendly Analytics (Plausible/Umami) | Backlog |
| **P4** | Dependency Audit & Updates (13 vulnerabilities) | Planned |
| **P4** | Code Warning Cleanup (26 ESLint warnings) | Planned |

---

### Quick References

* **Keep plan in sync** – After completing any development task, update the `AGENTS.md` milestones section to reflect the new state.

* **Schema** – `db/schema.ts`
* **Posts API** – `lib/posts.ts`
* **Tags API** – `lib/tags.ts`
* **Static Generation** – `scripts/generate-static-data.ts`
* **Feed/Sitemap** – `scripts/generate-feed.ts`, `next-sitemap.config.js`
* **CLI** – `cli/index.ts` + `cli/commands/` modules (`posts`, `tags`, `images`, `series`)
* **Workbench** – `scripts/seed.ts` for sample data
* **Tests** – `__tests__/` (unit), `e2e/` (e2e)
* **Docs** – `docs/architecture.md`
