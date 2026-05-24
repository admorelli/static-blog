import db from '@/db/db';
import { posts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export type Post = {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
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
export async function createPost(data: {
  title: string;
  slug: string;
  content: string;
}): Promise<void> {
  await db.insert(posts).values({
    title: data.title,
    slug: data.slug,
    content: data.content,
  });
}

/** Update an existing post */
export async function updatePost(id: number, data: Partial<Omit<Post, 'id'>>): Promise<void> {
  await db.update(posts).set(data).where(eq(posts.id, id));
}

/** Delete a post */
export async function deletePost(id: number): Promise<void> {
  await db.delete(posts).where(eq(posts.id, id));
}
