// Test database helper - uses the global test database initialized in setup.ts
import { posts, tags, postTags } from '../db/schema';
import { eq, desc, like, or, and, inArray } from 'drizzle-orm';
import type { Post } from '../lib/posts';
import type { Tag } from '../lib/tags';

// Get the test database from global setup
function getTestDb() {
  // @ts-expect-error global test database for vitest
  return global.__TEST_DB__;
}

const testDb = getTestDb();

// Re-export canonical types from production modules so tests stay aligned.
export type { Post } from '../lib/posts';
export type { Tag } from '../lib/tags';

// --- Posts functions (mirroring lib/posts.ts) ---

/** Get all posts ordered by newest first */
export async function listPosts(): Promise<Post[]> {
  const rows = await testDb.select().from(posts).orderBy(desc(posts.created_at));
  return rows as Post[];
}

/** Get a single post by its slug */
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const row = await testDb
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1)
    .get();
  return row as Post | undefined;
}

/** Create a new post */
function simpleSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function createPost(data: {
  title: string;
  slug?: string;
  content: string;
  tags?: number[];
}): Promise<number> {
  const slug = data.slug ?? simpleSlug(data.title);
  const [inserted] = await testDb
    .insert(posts)
    .values({
      title: data.title,
      slug,
      content: data.content,
      created_at: Math.floor(Date.now() / 1000),
    })
    .returning({ id: posts.id });
  const id = inserted.id;
  if (data.tags && data.tags.length) {
    await testDb
      .insert(postTags)
      .values(data.tags.map((tagId) => ({ postId: id, tagId })));
  }
  return id;
}

/** Update an existing post */
export async function updatePost(id: number, data: Partial<Omit<Post, 'id'>>): Promise<void> {
  await testDb.update(posts).set(data).where(eq(posts.id, id));
}

/** Delete a post */
export async function deletePost(id: number): Promise<void> {
  await testDb.delete(posts).where(eq(posts.id, id));
}

// --- Tags functions (mirroring lib/tags.ts) ---

/** Get all tags ordered by name */
export async function listAllTags(): Promise<Tag[]> {
  const rows = await testDb.select().from(tags).orderBy(tags.name);
  return rows as Tag[];
}

/** Get tags for a post */
export async function listTagsForPost(postId: number): Promise<Tag[]> {
  const rows = await testDb
    .select({ id: tags.id, name: tags.name })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId));
  return rows as Tag[];
}

export async function listPostsPaginated(options: {
  offset: number;
  limit: number;
  search?: string;
  tags?: number[];
}): Promise<{ posts: Post[]; total: number }> {
  let query = testDb.select().from(posts).orderBy(desc(posts.created_at));

  let condition;
  if (options.search) {
    condition = or(
      like(posts.title, `%${options.search}%`),
      like(posts.content, `%${options.search}%`),
    );
  }

  if (options.tags && options.tags.length > 0) {
    const postIds = await testDb
      .select({ postId: postTags.postId })
      .from(postTags)
      .where(inArray(postTags.tagId, options.tags))
      .execute();
    const ids = postIds.map((p: { postId: number }) => p.postId);
    if (ids.length === 0) {
      return { posts: [], total: 0 };
    }
    condition = condition ? and(condition, inArray(posts.id, ids)) : inArray(posts.id, ids);
  }

  if (condition) {
    query = query.where(condition);
  }

  const allRows = await query.execute();
  const total = allRows.length;
  const paginatedRows = allRows.slice(options.offset, options.offset + options.limit);

  return {
    posts: paginatedRows as Post[],
    total,
  };
}

/** Full-text search using FTS5 */
export async function searchPostsFTS(query: string, limit: number = 10): Promise<Post[]> {
  if (!query.trim()) return [];

  try {
    const rows = await testDb.$client.prepare(`
      SELECT p.id, p.title, p.slug, p.content, p.created_at
      FROM posts p
      INNER JOIN posts_fts f ON p.id = f.id
      WHERE posts_fts MATCH ?
      LIMIT ?
    `).all(query, limit);
    return rows as Post[];
  } catch (e) {
    console.warn('FTS5 search failed, falling back to LIKE search:', e);
    return searchPostsFallback(query, limit);
  }
}

/** Fallback search using LIKE */
async function searchPostsFallback(query: string, limit: number = 10): Promise<Post[]> {
  const searchTerm = `%${query}%`;
  const rows = await testDb
    .select()
    .from(posts)
    .where(
      or(
        like(posts.title, searchTerm),
        like(posts.content, searchTerm),
      ),
    )
    .orderBy(desc(posts.created_at))
    .limit(limit);
  return rows as Post[];
}

// --- Series functions ---

/** Get all posts in a series ordered by series_order */
export async function getPostsBySeries(seriesName: string): Promise<Post[]> {
  const rows = await testDb
    .select()
    .from(posts)
    .where(eq(posts.series, seriesName))
    .orderBy(posts.series_order);
  return rows as Post[];
}

/** Get all unique series names */
export async function getAllSeries(): Promise<string[]> {
  const rowsAll = await testDb
    .select({ series: posts.series })
    .from(posts);
  const series = rowsAll
    .map((r: { series: string | null }) => r.series)
    .filter((s: string | null): s is string => s !== null && s !== undefined && s !== '')
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .sort();
  return series;
}

/** Get next post in series */
export async function getNextInSeries(series: string, currentOrder: number): Promise<Post | undefined> {
  const rows = await testDb
    .select()
    .from(posts)
    .where(eq(posts.series, series))
    .orderBy(posts.series_order);
  const seriesPosts = rows as Post[];
  const next = seriesPosts.find((p: Post) => p.series_order !== null && p.series_order > currentOrder);
  return next;
}

/** Get previous post in series */
export async function getPrevInSeries(series: string, currentOrder: number): Promise<Post | undefined> {
  const rows = await testDb
    .select()
    .from(posts)
    .where(eq(posts.series, series))
    .orderBy(posts.series_order);
  const seriesPosts = rows as Post[];
  const prev = seriesPosts.filter((p: Post) => p.series_order !== null && p.series_order < currentOrder).pop();
  return prev;
}

// Export schema for direct access if needed
export { posts, tags, postTags };

export default testDb;