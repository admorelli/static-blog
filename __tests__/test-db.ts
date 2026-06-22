// Test database helper - uses the global test database initialized in setup.ts
import { posts, tags, postTags } from '../db/schema';
import { eq, desc, like, or, and, inArray } from 'drizzle-orm';

// Get the test database from global setup
function getTestDb() {
  // @ts-expect-error global test database for vitest
  return global.__TEST_DB__;
}

const testDb = getTestDb();

// --- Posts functions (mirroring lib/posts.ts) ---

export type Post = {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
  series: string | null;
  series_order: number | null;
};

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

export type Tag = {
  id: number;
  name: string;
};

export async function listAllTags(): Promise<Tag[]> {
  const rows = await testDb.select().from(tags).orderBy(tags.name);
  return rows as Tag[];
}

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
      like(posts.content, `%${options.search}%`)
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

/** Full-text search using FTS5 (mirrors lib/posts.ts) */
export async function searchPostsFTS(query: string, limit: number = 10): Promise<Post[]> {
  if (!query.trim()) return [];

  try {
    // Use raw SQL for FTS5 MATCH query
    const rows = await testDb.$client.prepare(`
      SELECT p.id, p.title, p.slug, p.content, p.created_at
      FROM posts p
      INNER JOIN posts_fts f ON p.id = f.id
      WHERE posts_fts MATCH ?
      LIMIT ?
    `).all(query, limit);
    return rows as Post[];
  } catch (e) {
    // FTS5 might fail if table doesn't exist or query is invalid
    console.warn('FTS5 search failed, falling back to LIKE search:', e);
    return searchPostsFallback(query, limit);
  }
}

/** Fallback search using LIKE (used when FTS5 is unavailable) */
async function searchPostsFallback(query: string, limit: number = 10): Promise<Post[]> {
  const searchTerm = `%${query}%`;
  const rows = await testDb
    .select()
    .from(posts)
    .where(
      or(
        like(posts.title, searchTerm),
        like(posts.content, searchTerm)
      )
    )
    .orderBy(desc(posts.created_at))
    .limit(limit);
  return rows as Post[];
}

// --- Series functions (mirroring lib/posts.ts) ---

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
    .filter((s: string, i: number, arr: string[]) => arr.indexOf(s) === i)
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