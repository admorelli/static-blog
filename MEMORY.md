# 🧠 Memory — Blog Tech

> What you remember long‑term. Distilled from recent sessions and current state.

---

## Current Project State (as of 2026‑05‑24)

### ✅ Completed Milestones
- **M01 Setup** — Git initialized, Next.js + Tailwind + shadcn/ui installed, SQLite/Drizzle configured.

### 🟡 In Progress
- **M02 CRUD via SQLite (partial)** — Post table and DAOs in place; filtering UI and many‑to‑many tag schema pending.

### ⏳ Pending Milestones
| Step | What’s left |
|-----|------------|
| M03 Tags | Add `tags` + posts junction table, checkbox/tag selector components, filter‑by‑tag dropdowns |
| M04 Build | GitHub Actions workflow `.github/workflows/build-and-deploy.yml`, Node.js build script that reads SQLite and generates static HTML per post |
| M05 UI | Dark/light theme support, full page layouts (single post, list, home) with reusable shadcn/ui components, visual polish & micro‑interactions |
| M06 Tests | Vitest unit tests for CRUD/parsing utils; Playwright E2E flows: create → publish → filter by tag |
| M07 Audit | Audit checklist in `docs/audit-checklist.md`, periodic reviews every 2–3 sprints with remediation reports |

### 🎯 Next Immediate Target (M02 continuation)
- Finish CRUD UI for posts (`/posts`, `/new-post`) and close the filtering + many‑to‑many tag gap before M04.  
- Option A for SQLite persistence is chosen (commit `db.sqlite` to repo) — avoids temp DB on CI.

---

## Recent Decisions & Notes
| Date | Decision / Note |
|-----|----------------|
| 2026‑05‑24 | Persisted SQLite via Option A (committed file), not generated at build time. |
| — | CLI entrypoint lives in `app/cli.ts`; local dev mode runs via `npm run dev`. Build script will be named `build.ts` or `build/tsx` as per M04 plan. |

---

## Quick‑Start Commands (Last Verified)
```bash
# Local dev (dev server + CLI entrypoint)
npm run dev

# Static build → GitHub Pages deploy pipeline
npm run build:static   # generates HTML under public/_next/static or similar
```

---

### 🧪 Acceptance Criteria Snapshot
| Step | Must‑have |
|-----|----------|
| 01 | App runs via `npm run dev`; UI shows a hardcoded example post |
| 02 | Form creates posts; they appear in the list after refresh |
| 03 | Filtering by tag works (marked posts show, others hide) |
| 04 | GitHub Actions builds + deploys on push; HTML static pages generated |
| 05 | Dark/claro themes with responsive mobile layout |
| 06 | 60–80% CI test coverage; no broken tests in the pipeline |
| 07 | Clean codebase, no significant duplications, easy to maintain |
---

*Tip: Agents read this file at session start. Update it whenever you advance a milestone or make a key decision.*