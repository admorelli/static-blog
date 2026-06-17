// Test database helper - uses the global test database initialized in setup.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import betterSqlite3 from 'better-sqlite3';
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
  const result = await testDb
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
    const ids = postIds.map(p => p.postId);
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

// Export schema for direct access if needed
export { posts, tags, postTags };

export default testDb;