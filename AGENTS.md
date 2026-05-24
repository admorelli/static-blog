# AGENTS.md — Blog Tech (Next.js + SQLite → GitHub Pages)

Welcome! This workspace builds a **static blog** powered by Next.js, SQLite (via Drizzle ORM), and an automated build pipeline that deploys to GitHub Pages. Read on for quick context, project structure, the development plan, and how we work.

---

## 🏗️ Quick Project Overview & Current Status

### Goal
Static site generator that reads posts from a local SQLite DB (`db.sqlite`), renders them as HTML pages, and publishes via GitHub Actions. No runtime server needed — just `npm run build:static` → push to repo → live on Pages.

**Core stack:** Next.js (App Router) + Tailwind + shadcn/ui + Drizzle ORM + better-sqlite3 + GitHub Actions CI/CD.

### Current Progress (as of 2026–05–24)
- ✅ **M01 Setup** — Git initialized, Next.js + Tailwind + shadcn/ui installed, SQLite/Drizzle configured.
- 🟡 **M02 CRUD via SQLite (partial)** — Post table and DAOs in place; filtering UI and many‑to‑many tag schema pending.

*See `/milestones/Index.md` for the full up‑to‑date plan.*

---

## 📁 Project Structure

```
static-blog/
├── .github/workflows/      # build-and-deploy.yml (CI/CD)
├── app/                  # Next.js pages, layouts, hooks, providers
│   ├── components/      # shadcn-based UI atoms/molecules
│   └── ...              # /posts, /new-post, single post layout, etc.
├── db/                   # Data layer & DB schema (PostgreSQL-compatible types)
├── milestones/          # Up-to-date development plan ✅
├── app/
│   ├── cli.ts           # CLI entrypoint for local dev mode
│   └── lib/             # Utilities, parsers, CRUD helpers
├── db.sqlite            # Local SQLite file (committed to repo)
├── package.json        # Scripts: dev, build:static, test:unit/test:e2e
├── tsconfig.json       # Type config
└── schema/             # SQL migration files & type definitions
```

---

## 🗺️ The Development Plan (Current)

The **active plan** lives in `/milestones/Index.md` and its children. It is milestone-based (M01→M07) with per-step actions, acceptance criteria, and minimal "compile → test" steps after each block.  

| Milestone | File                        | What it Covers |
|---------|----------------------------|---------------|
| 01       | `M01_setup.md`               | Git init, Next.js + Tailwind + shadcn/ui, SQLite setup |
| 02       | `M02_crud.md`               | Posts table + CRUD API (DAOs) + UI forms for `/posts`, `/new-post` |
| 03       | `M03_tags.md`               | Many-to-many tags, filter-by-tag dropdowns |
| 04       | `M04_build.md`              | GitHub Actions workflow + Node.js build script (`build.ts`) |
| 05       | `M05_ui_theme.md`           | Dark/light theme, page layouts, visual polish |
| 06       | `M06_tests.md`              | Vitest unit tests + Playwright E2E flows |
| 07       | `M07_audit.md`              | Audit checklist & periodic refactoring reviews |

👉 **Use this path** whenever asked for "the plan" or "what's next": `/milestones/Index.md` → `/milestones/M0*_`. The older `TASKS.md` is deprecated and no longer accurate.  

---

## 🧪 Acceptance Criteria (Quick Reference)

| Step | Must-Have |
|-----|----------|
| 01 | App runs via `npm run dev`; UI shows a hardcoded example post |
| 02 | Form creates posts; they appear in the list after refresh |
| 03 | Filtering by tag works (marked posts show, others hide) |
| 04 | GitHub Actions builds + deploys on push; HTML static pages generated |
| 05 | Dark/claro themes with responsive mobile layout |
| 06 | 60–80% CI test coverage; no broken tests in the pipeline |
| 07 | Clean codebase, no significant duplications, easy to maintain |

---

## 🛠️ Code & Workflow Conventions

- **Reusability:** shadcn/ui components (`Card`, `TagSelect`, `Button`) for all UI atoms.  
- **Naming:** PascalCase for components; camelCase for utilities; SCREAMING_SNAKE_CASE for DB constants/schema.
- **Persistence Strategy:** `db.sqlite` is committed to the repo so dev ↔ build consistency holds (Option A in Technical Notes). If the project grows, migrate to SQLite-in-memory or PostgreSQL via Docker CI.  
- **CRUD encapsulation:** Encapsulate SQL logic in DAOs/services; avoid duplicating CRUD patterns across files.

---

## 🚀 Common Workflows for Agents

### Local Dev Mode (Pre-Build)
```bash
npm run dev              # Next.js server + CLI entrypoint at localhost:3000
# Create posts via form → they persist in db.sqlite
```

### Build & Deploy to GitHub Pages
```bash
git add .gitignore db.sqlite  # ensure SQLite is committed (Option A)
pm run build:static      # generates HTML under public/_next/static or similar
# Push to gh-pages branch triggers workflow → static pages live
```

### Testing
```bash
npm run test:unit        # Vitest for CRUD/parsing utils
npm run test:e2e        # Playwright flows: create → publish → filter by tag
```

---

## ⚡ Quick‑Start (Paste & Go)

```bash
npm run dev      # Local dev mode — forms + SQLite live
npm run build:static  # Static HTML → GitHub Pages
git status       # Check changes before commit
```

*Tip: Paste these exact snippets into your shell when starting a new session.*

---

## 🗣️ Communication & Safety

- **Group chats / shared contexts:** Do not leak `db.sqlite` contents, personal user data, or private credentials. Treat the SQLite as a local artifact unless explicitly exported via an API.
- **Destructive actions** (e.g., `drop database`, `rm -rf .git`) require explicit confirmation. Prefer `trash` over `rm` for recoverability.  

---

## 📚 Related Docs

- Architecture snapshot: `/ARCHITECTURE.md`
- Technical notes on SQLite persistence & build pipeline: `/milestones/TechnicalNotes.md`
- Acceptance criteria per step: `/milestones/Criteria.md`

---

Make this your starting point, then customize with project-specific rules as you discover patterns that work. Happy building! 🚀