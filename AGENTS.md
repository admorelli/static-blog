# AGENTS.md — Blog Tech (Next.js + SQLite → GitHub Pages)

**Goal:** Static blog that reads posts from a local SQLite DB, renders HTML pages, and publishes via GitHub Actions. No runtime server — just `npm run build:static` → push → live on Pages.

**Core stack:** Next.js (App Router) + Tailwind + shadcn/ui + Drizzle ORM + better-sqlite3 + GitHub Actions CI/CD. *See `/milestones/Index.md` for the active plan.*

---

### 🚀 Quick‑Start (paste & go)
```bash
npm run dev        # local dev mode — forms + SQLite live
npm run build:static  # static HTML → GitHub Pages
# then:
git add . && git commit -m "M02 CRD UI" && git push
```
---

### 🛠️ Code & Workflow Conventions
- **Reusability:** shadcn/ui components (`Card`, `TagSelect`, `Button`) for all UI atoms.
- **Naming:** PascalCase (components), camelCase (utils), SCREAMING_SNAKE_CASE (DB constants).
- **Persistence:** `db.sqlite` is committed to the repo so dev ↔ build consistency holds. If the project grows, migrate to SQLite‑in‑memory or PostgreSQL via Docker CI.
- **CRUD encapsulation:** Encapsulate SQL logic in DAOs/services; avoid duplicating CRUD patterns across files.

---

### 🗣️ Safety
Do not leak `db.sqlite` contents, personal user data, or private credentials. Destructive actions (e.g., `drop database`, `rm -rf .git`) require explicit confirmation — prefer `trash` over `rm` for recoverability.
