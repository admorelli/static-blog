import db from '../db/db';
import { posts, postTags, postsFts } from '../db/schema';
import { eq, desc, or, like } from 'drizzle-orm';

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
  const rows = await db.select().from(posts).orderBy(desc(posts.created_at));
  return rows as Post[];
}

/** Get a single post by its slug */
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const row = await db
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
  const result = await db
    .insert(posts)
    .values({
      title: data.title,
      slug,
      content: data.content,
      created_at: Math.floor(Date.now() / 1000),
    })
    .run();
  const id = Number(result.lastInsertRowid);
  if (data.tags && data.tags.length) {
    await db
      .insert(postTags)
      .values(data.tags.map((tagId) => ({ postId: id, tagId })));
  }
  return id;
}

/** Update an existing post */
export async function updatePost(id: number, data: Partial<Omit<Post, 'id'>>): Promise<void> {
  await db.update(posts).set(data).where(eq(posts.id, id));
}

/** Delete a post */
export async function deletePost(id: number): Promise<void> {
  await db.delete(posts).where(eq(posts.id, id));
}

/** Full-text search using FTS5 */
export async function searchPostsFTS(query: string, limit: number = 10): Promise<Post[]> {
  if (!query.trim()) return [];
  
  try {
    // Use raw SQL for FTS5 MATCH query
    const rows = await db.$client.prepare(`
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
  const rows = await db
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

/** Get all posts in a series ordered by series_order */
export async function getPostsBySeries(seriesName: string): Promise<Post[]> {
  const rows = await db
    .select()
    .from(posts)
    .where(eq(posts.series, seriesName))
    .orderBy(posts.series_order);
  return rows as Post[];
}

/** Get all unique series names */
export async function getAllSeries(): Promise<string[]> {
  const rowsAll = await db
    .select({ series: posts.series })
    .from(posts);
  const series = rowsAll
    .map(r => r.series)
    .filter((s): s is string => s !== null && s !== undefined && s !== '')
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .sort();
  return series;
}

/** Get next post in series */
export async function getNextInSeries(series: string, currentOrder: number): Promise<Post | undefined> {
  const rows = await db
    .select()
    .from(posts)
    .where(eq(posts.series, series))
    .orderBy(posts.series_order);
  const seriesPosts = rows as Post[];
  const next = seriesPosts.find(p => p.series_order !== null && p.series_order > currentOrder);
  return next;
}

/** Get previous post in series */
export async function getPrevInSeries(series: string, currentOrder: number): Promise<Post | undefined> {
  const rows = await db
    .select()
    .from(posts)
    .where(eq(posts.series, series))
    .orderBy(posts.series_order);
  const seriesPosts = rows as Post[];
  const prev = seriesPosts.filter(p => p.series_order !== null && p.series_order < currentOrder).pop();
  return prev;
}
