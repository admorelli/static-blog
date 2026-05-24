# Project Development Plan

This file contains an up‑to‑date overview of the current project layout, architecture, and the incremental development plan extracted from the legacy `agents.md` (now removed). It serves as a single source of truth for contributors.

---

## 📁 Current File Structure
```bash
/.github/
  ├── workflows/
│   └── build-and-deploy.yml   # GitHub Actions pipeline
/contributing.md
/docs/
  └── architecture.md  # Architectural decisions
/client/ (next app)
  ├── app/
  │   ├── layout.tsx
  │   ├── page.tsx
  │   └── global.css
  ├── lib/
  │   └── db.ts   # Drizzle ORM setup
  ├── src/
  │   ├── db/       # SQLite schema & migrations
  │   ├── lib/      # Utilities & API helpers
  │   ├── scripts/  # Support scripts (build, data fixtures)
  │   └── app/      # Next 13 app router pages & components
  ├── next.config.ts
  ├── tsconfig.json
  ├── package.json
  └── ...
```

## ⚙️ Architecture Overview
* **Next.js 13 app router** – Server‑first rendering with static generation.
* **SQLite + Drizzle ORM** – Local persistent store for post & tag data. SQLite file (`db.sqlite`) resides in the repo for CI consistency.
* **shadcn/ui + Tailwind** – Rapid UI component building and dark/light theme support.
* **GitHub Actions** – Build → static site generation → deploy to GitHub Pages.
* **Testing** – Vitest for unit tests, Playwright for e2e.

Refer to `docs/architecture.md` for detailed design decisions and diagrammatic representation.

## 🚀 Development Plan (current state & next steps)

All primary commands are now exposed through a `Makefile` for quick execution. Use `make <task>` (e.g., `make device`, `make test`) or the underlying npm scripts as shown in `README.md`.
1. **Setup (M01)** – Scaffolded a Next.js 13 app with Tailwind, shadcn/ui, SQLite & Drizzle used in `src/db/`. ✨
2. **CRUD (M02)** – Data layer (`src/lib/posts.ts`) and SQLite schema (`src/db/schema.ts`) are in place, **API routes** (`src/app/api/posts/route.ts`) and **posts list page** (`src/app/posts/page.tsx`) are now implemented.
3. **UI (M03)** – New homepage (`/`) now includes:
   * Search field for title/content.
   * Tag selector with toggles; navigating unmarked tags filters posts.
   * Infinite scroll that loads 10‑post batches respecting the current search/query.
     /api/posts/search provides paginated results.
   * Tag list fetched from `/api/tags`.
   * The posts list component is reused on the `/posts` page.
   Next steps: post‑detail page and create form.
4. **Tags & Filters (M03)** – Not yet implemented.
5. **Pipeline (M04)** – The repository contains a placeholder `.github/workflows/build-and-deploy.yml` but the process is not yet wired.
6. **Testing (M06)** – No tests exist yet.
7. **Audit & Refactor (M07)** – Pending.

> **Next Steps** – Implement the post detail page (`/posts/[slug]`), add a create‑post form, then wire the CI pipeline and add unit/E2E tests.

---

### Quick References

* **Keep plan in sync** – After completing any development task, update the `AGENTS.md` milestones section to reflect the new state.

* **Schema** – `src/db/schema.ts`
* **API** – `pages/api/posts.ts`
* **Workbench** – `scripts/seed.ts` for sample data.
* **Docs** – `docs/architecture.md`, `docs/audit-checklist.md`.
}
