# Development Plan — static_blog

**Generated:** 2026-06-21
**Branch:** feat/privacy-analytics
**Status:** Clean build & tests; privacy analytics implemented

---

## ✅ Done (P0 — Core)

| Task | Status | Notes |
|------|--------|-------|
| Markdown authoring (CLI) | ✅ Done | `cli/commands/posts/create-from-markdown.ts` parses frontmatter + markdown |
| Homepage post previews | ✅ Done | Paragraph-boundary truncation in `app/page-client.tsx` |
| Image CLI copy/embed + optimization at creation | ✅ Done | `cli/commands/images/add.ts` copies image, runs sharp, writes manifest |
| Image layout | ✅ Done | `public/posts/<slug>/img/<id>/manifest.json` with variants + blur |
| Image pipeline E2E | ✅ Done | `e2e/homepage.test.ts` + `e2e/image-support.test.ts` verify `<picture>` rendering |
| Build no longer runs optimizer | ✅ Done | `optimize:images` removed from `build` script |

## ✅ Done (P1)

| Task | Status | Notes |
|------|--------|-------|
| Database protection in tests | ✅ Done | Tests use `global.__TEST_DB__` (`:memory:`) via `__tests__/setup.ts` |
| Full-text search backend | ✅ Done | FTS5 virtual table + triggers in `scripts/generate-static-data.ts` + `lib/posts.ts` (`searchPostsFTS`) |
| Search UI integration | ✅ Done | `/search` page + header nav + E2E (`e2e/search.test.ts`) |

## 🟣 Done (P2)

| Task | Status | Notes |
|------|--------|-------|
| CLI tool review (images) | ✅ Done | `cli/commands/images/add.ts` + `cli/commands/posts/create-from-markdown.ts` updated + tests |
| Giscus comments | ✅ Done | `app/components/GiscusComments.tsx` mounted on post pages |
| Reading time | ✅ Done | `calculateReadingTime()` in `app/posts/[slug]/page.tsx` |
| TOC | ✅ Done | `app/components/TableOfContents.tsx` with scroll spy |
| Skeleton loaders + empty states | ✅ Done | `app/components/SkeletonLoaders.tsx` wired in client UI |
| Post series / collections | ✅ Done | Next/prev series nav in `app/posts/[slug]/page.tsx` |
| Newsletter integration | ✅ Done | `app/newsletter/page.tsx` + `cli/commands/newsletter/*` |
| CLI E2E tests + hardening | ✅ Done | Post/tag/series/image/newsletter CLI commands exercised via E2E |
| Privacy-friendly analytics | ✅ Done | `app/analytics.tsx` with Plausible/Umami support + DNT respect |

## Still To Do

1. Dependency audit & updates
2. ESLint/code warning cleanup

---

### Resumption Checklist

- [x] Move image optimization to post creation
- [x] Use slug-based image layout (`/posts/<slug>/img/<id>/`)
- [x] Wire FTS5 search to UI
- [x] Newsletter integration (page + CLI commands)
- [x] Privacy-friendly analytics (Plausible/Umami)
- [ ] Dependency audit & updates
- [ ] ESLint/code warning cleanup

---

## Quick References (unchanged)

* Schema — `db/schema.ts`
* Posts API — `lib/posts.ts`
* Tags API — `lib/tags.ts`
* Static Generation — `scripts/generate-static-data.ts`
* Feed/Sitemap — `scripts/generate-feed.js`, `next-sitemap.config.js`
* CLI — `cli/index.ts` + `cli/commands/`
* Tests — `__tests__/` (unit), `e2e/` (e2e)
