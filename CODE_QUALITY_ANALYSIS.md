# Code Quality & Complexity Analysis
Generated: 2026-06-21

## Executive Summary

| Metric | Value | Notes |
|--------|-------|-------|
| Files analyzed (app + lib + db + cli) | 57 | tsx & ts |
| Total lines | 4,292 | |
| Clones found (jscpd, 50+ tokens) | 16 | |
| Duplicated lines | 152 (3.5%) | |
| Duplicated tokens | 1,260 (4.9%) | |

Status: Low duplication at token level, but **structural duplication** is significant — especially between production `lib/` and test `__tests__/test-db.ts`.

---

## 1. Structural Duplication

### 1.1 `lib/posts.ts` vs `__tests__/test-db.ts`
`test-db.ts` re-implements ~80% of `lib/posts.ts`:
- Same `simpleSlug` function
- Same `Post` type
- Same `listPosts`, `getPostBySlug`, `createPost`, `updatePost`, `deletePost`
- Same `searchPostsFTS`, `searchPostsFallback`, `getPostsBySeries`, `getAllSeries`, `getNextInSeries`, `getPrevInSeries`

**Impact**: Bug fixes or schema changes must be applied in two places.

### 1.2 `lib/tags.ts` vs `__tests__/test-db.ts`
- Same `Tag` type
- Same `listAllTags`, `listTagsForPost`, `listPostsPaginated` logic
- CLI `cli/commands/posts/create-from-markdown.ts` repeats raw tag upsert logic

### 1.3 Database cleanup in tests
Pattern `DELETE FROM post_tags; DELETE FROM posts; DELETE FROM tags;` appears ~25 times across:
- `__tests__/posts.test.ts` (10+ beforeAll blocks)
- `__tests__/api-routes.test.ts`
- `__tests__/edge-cases.test.ts`
- `__tests__/regression.test.ts`

### 1.4 Markdown parsing
- `scripts/generate-static-data.ts` and `cli/commands/posts/create-from-markdown.ts` both parse frontmatter + convert markdown → HTML.

---

## 2. Separation of Concerns

### 2.1 `test-db.ts` mixes concerns
Currently bundles:
- Database provider (wrapping `global.__TEST_DB__`)
- Full CRUD API
- Search (FTS5 + fallback)
- Series navigation
- Tag operations

A cleaner split:
- `tests/utils/test-db.ts` — DB accessor only + cleanup helpers
- Production logic imported from `lib/` (not mirrored)

### 2.2 `cli/commands/posts/create-from-markdown.ts` mixes concerns
- Frontmatter validation
- Slug normalization
- Tag normalization
- Markdown → HTML conversion
- Database persistence

Should be: CLI command → thin orchestrator → shared `lib/post-authoring.ts` module.

### 2.3 `lib/tags.ts` uses escape-hatch types
Uses `any` for query builders:
```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let query: any = db.select().from(posts);
let condition: any = undefined;
```
`lib/posts.ts` equivalent (`test-db.ts`) does not need `any`.

### 2.4 `app/page-client.tsx` (278 lines)
Handles:
- Search state
- Tag filtering
- Infinite scroll
- Post rendering
- Header/theme interactions

Can be modularized: `usePostSearch`, `useTagFilter`, `PostCard`, `InfinitePostList`.

---

## 3. Complexity Hotspots

| File | Symbol | Lines | Cyclomatic Complexity | Notes |
|------|--------|-------|----------------------|-------|
| `lib/tags.ts` | `listPostsPaginated` | 36-88 | ~7 | Multiple conditional branches, raw SQL-like joins |
| `__tests__/test-db.ts` | `listPostsPaginated` | 106-147 | ~7 | Same logic duplicated |
| `__tests__/test-db.ts` | `getAllSeries` | 199-209 | ~4 | Multi-step filter/sort |
| `__tests__/edge-cases.test.ts` | `it('should handle...')` | ~50 | ~6 | Many direct SQL steps inline |
| `app/page-client.tsx` | main component | 0-278 | ~6 | Multiple state interleavings |

---

## 4. Reuse Opportunities

### 4.1 Create `lib/post-authoring.ts`
Shared utilities for markdown → post creation:
- `parseFrontmatter(content)` → validated frontmatter
- `normalizeSlug(raw, fallback)`
- `normalizeTagNames(raw)`
- `normalizeDateInput(raw)`
- `markdownToHtml(content)`
- `upsertTags(db, tagNames)` → returns tag IDs
- `createPostWithTags(db, postData, tagNames)`

Used by:
- `cli/commands/posts/create-from-markdown.ts`
- `scripts/generate-static-data.ts` (future)

### 4.2 Eliminate `test-db.ts` CRUD duplication
Test DB should import production functions, not mirror them:
```ts
import { listPosts, getPostBySlug, createPost, updatePost, deletePost } from '../lib/posts';
import { listAllTags, listTagsForPost, listPostsPaginated } from '../lib/tags';
import { searchPostsFTS, getPostsBySeries, getAllSeries, getNextInSeries, getPrevInSeries } from '../lib/posts';
```

### 4.3 Add `tests/utils/cleanup.ts`
```ts
export async function clearTestDb(testDb: Database) {
  await testDb.$client.exec('DELETE FROM post_tags');
  await testDb.$client.exec('DELETE FROM posts');
  await testDb.$client.exec('DELETE FROM tags');
}
```
Replace all inline cleanup blocks.

### 4.4 Unify `listPostsPaginated`
`lib/tags.ts` uses drizzle query builder; `test-db.ts` uses raw SQL-like slice. Move to `lib/posts.ts` and `lib/tags.ts` should import it when appropriate, or keep a single canonical implementation.

---

## 5. Recommendation Priority

| Priority | Action | Impact |
|----------|--------|--------|
| P0 | Remove CRUD duplication in `test-db.ts` | Eliminates mirror code, single source of truth |
| P0 | Add `tests/utils/cleanup.ts` | Removes 25+ repeated DELETE blocks |
| P1 | Create `lib/post-authoring.ts` | Reuse between CLI & build scripts |
| P1 | Unify pagination query builder | Remove `any` types, consistent API |
| P2 | Extract hooks from `page-client.tsx` | Easier testing, smaller functions |
| P2 | Extract post/HTML processing to `lib/render.ts` | Share between `app/posts/[slug]/page.tsx` and `enhance-images.ts` |

---

## Next Steps

1. Implement P0 items (test-db.ts refactor + cleanup.ts)
2. Run test suite + lint to verify zero regression
3. Implement P1 items (post-authoring + pagination unification)
4. Re-run jscpd to measure improvement
