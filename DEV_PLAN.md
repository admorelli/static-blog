# Development Plan — static_blog

## Still To Do

1. Dependency audit & updates
2. ESLint/code warning cleanup

---

## Quick References

- Schema — `db/schema.ts`
- Posts API — `lib/posts.ts`
- Tags API — `lib/tags.ts`
- Home hooks — `app/hooks/use-home-filters.ts`
- Static Generation — `scripts/generate-static-data.ts`
- Feed/Sitemap — `scripts/generate-feed.js`, `next-sitemap.config.js`
- CLI — `cli/index.ts` + `cli/commands/` modules (`posts`, `tags`, `images`, `series`, `newsletter`)
- Tests — `__tests__/` (unit), `e2e/` (e2e)
- Docs — `docs/architecture.md`