# Development Plan — static_blog

**Generated:** 2026-06-20
**Branch:** feat/p0-authoring-previews-images
**Status:** Build and tests pass; image fixtures fixed

---

## ✅ Done (P0 — Core)

| Task | Status | Notes |
|-------|--------|-------|
| Markdown authoring (CLI) | ✅ Implemented | `cli/commands/posts/create-from-markdown.ts` parses frontmatter + markdown |
| Homepage post previews | ✅ Implemented | Paragraph-boundary truncation in `app/page-client.tsx` |
| Image CLI copy/embed | ✅ Implemented | `cli/commands/images/add.ts` copies image + appends markdown |
| Image optimization script | ✅ Script exists | `scripts/optimize-images.ts` generates blur placeholders and derivatives |
| Optimizer wired into build | ✅ Wired | `npm run build` runs `optimize:images` first |

## 🟣 In Progress / Blocked

| Task | Status | Notes |
|-------|--------|-------|
| Image optimization viability | ✅ Fixed | PNG fixtures in `public/images/posts/**` replaced with valid binary images; `scripts/optimize-images.ts` now generates blur placeholders without `libpng read error` |
| Image pipeline coverage | ❌ Missing | No E2E test proving `<img srcset>` generation from markdown on post pages |

## ⚠️ Known Gaps To Resume Next

1. Decide exact build-time image strategy (CLI produces PNG/JPG; `optimize-images.ts` should read binaries and write `<img srcset>` markdown)
2. Add E2E coverage for homepage previews + post detail image rendering
3. Clean branch before merge: remove `.tmp-monitor-merge.js`, `app/posts/[slug]/page.tsx.rebase-backup`

---

### Resumption Checklist

- [ ] Validate image fixtures are binary decodable (`sharp` can read them)
- [ ] Run `node scripts/optimize-images.ts` manually and verify output files appear
- [ ] Confirm build still runs end-to-end after fixture replacement
- [ ] Add Playwright test: markdown image becomes optimized `<img>` in DOM
- [ ] Finalize merge from `feat/p0-authoring-previews-images` into `master`

---

## Quick References (unchanged)

* Schema — `db/schema.ts`
* Posts API — `lib/posts.ts`
* Static Generation — `scripts/generate-static-data.js`
* Feed/Sitemap — `scripts/generate-feed.js`, `next-sitemap.config.js`
* CLI — `cli/blog.js`
* Tests — `__tests__/` (unit), `e2e/` (e2e)
