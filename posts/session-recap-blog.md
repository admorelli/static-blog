---
title: "Session Recap: From Broken CI to TypeScript CLI - Complete P0/P1 Implementation"
date: "2025-06-18"
tags: ["typescript", "nextjs", "sqlite", "drizzle", "ci-cd", "cli", "typescript", "post"]
---

# Session Recap: From Broken CI to TypeScript CLI - Complete P0/P1 Implementation

Today's session was an intensive journey from debugging a failing CI pipeline to completing all P0 and P1 milestones, including converting the entire CLI to TypeScript. Here's the full story.

## The Starting Point

We began with a CI pipeline that had multiple failures:
- **TypeScript errors** in CLI scripts trying to `require()` `.ts` files directly
- **Missing native module rebuilds** for `better-sqlite3` in GitHub Actions
- **Type errors** throughout the CLI codebase
- **Lint errors** from untyped CLI code

## What We Accomplished

### P0: Core Content Experience ✅
- **Homepage post previews** - 20 line excerpts with "Read more" links
- **Markdown authoring + frontmatter** - Write posts in `.md`, CLI parses frontmatter, converts to HTML
- **Image support** - `blog add-image <slug> <path>` copies to `/public/images/posts/<slug>/`, generates markdown

### P1: Discovery & SEO ✅
- **Full-Text Search (SQLite FTS5)** - Virtual table with triggers, `searchPostsFTS()` with raw SQL MATCH
- **SEO: Open Graph + Twitter Cards + JSON-LD** - `generateMetadata()` + BlogPosting schema in `<script type="application/ld+json">`
- **Image Optimization Pipeline (Sharp)** - `scripts/optimize-images.ts` generates WebP/AVIF at 400/800/1200w + blur placeholders

### Database Protection ✅
Tests now use in-memory SQLite (`:memory:`) via Vitest `setup.ts`, never touching production `db.sqlite`

### CLI TypeScript Conversion ✅
The biggest win: converted `cli/blog.js` → `cli/blog.ts` with:
- Full TypeScript types (`CliArgs`, `CliFlags` interfaces)
- Index signature for dynamic `args[key]` access
- Proper non-null assertions (`!`) after validation
- Separate string/number parsing variables
- Index signature for `CliArgs`: `[key: string]: string | boolean | number | undefined`
- Bin entry in package.json for `blog` command
- Excluded from Next.js build (`tsconfig.json`) and ESLint

## Technical Wins

### CI/CD Pipeline Fixed
```yaml
# Fixed: Use npx tsx instead of bare tsx
run: npx tsx ./scripts/generate-static-data.ts

# Added: Native module rebuild
run: npm rebuild better-sqlite3

# Fixed: TypeScript build exclusion
# tsconfig.json: "exclude": ["cli", "scripts"]
```

### FTS5 Search Implementation
```sql
CREATE VIRTUAL TABLE posts_fts USING fts5(
  id UNINDEXED, title, content, tokenize='porter unicode61'
);
```
With triggers for INSERT/UPDATE/DELETE sync, and search via raw SQL:
```sql
SELECT p.* FROM posts p INNER JOIN posts_fts f ON p.id = f.id WHERE posts_fts MATCH ?
```

### SEO Implementation
- `generateMetadata()` with Open Graph, Twitter Cards, article meta
- JSON-LD BlogPosting schema injected via `<script type="application/ld+json">`
- Frontmatter `description` field for SEO descriptions

### Image Optimization Pipeline
`scripts/optimize-images.ts` using Sharp:
- WebP + AVIF at 400/800/1200w
- Blur placeholders (base64)
- `npm run optimize:images` command

## Testing & Quality
| Check | Status |
|-------|--------|
| Typecheck | ✅ 0 errors |
| Lint | ✅ 0 errors (22 warnings) |
| Unit Tests | ✅ 80/80 pass |
| E2E Tests | ✅ 3/3 pass |
| Build | ✅ Success (13 routes, 8 posts) |
| CI/CD | ✅ All checks pass |

## PRs Created & Merged

| PR | Title | Status |
|----|-------|--------|
| #4 | feat: Convert CLI to TypeScript with proper types | ✅ Merged |
| #3 | feat: Implement P1 improvements (FTS5, SEO, Image Optim) | ✅ Merged |

## Skills Created for Future Prevention

Created 6 skills to prevent these error patterns:
1. **typescript-strict-patterns** - TypeScript strict mode fixes
2. **ci-cd-typescript-node** - CI/CD for TypeScript/Node projects
3. **drizzle-orm-patterns** - Drizzle ORM TypeScript patterns
4. **project-config-eslint-typescript** - ESLint/TS/Build config
5. **cli-typescript-conversion** - CLI TypeScript conversion checklist
5. **ci-cd-debugging** - Local CI debugging with `act`

## What's Next (P2)

Ready to start on engagement & polish:
1. **Giscus Comments** - GitHub Discussions integration
2. **Reading Time + Table of Contents**
3. **Mobile Nav Drawer**
4. **Skeleton Loaders + Empty States**
5. **Post Series / Collections**

---

The project now has a solid foundation: fully typed TypeScript codebase, working CI/CD, SEO-ready static blog with full-text search and image optimization. Time to make it beautiful and engaging! 🚀