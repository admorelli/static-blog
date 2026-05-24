import db from '../db/db';
import { tags, postTags, posts } from '../db/schema';
import { desc, eq, and, or, like, inArray, exists, select } from 'drizzle-orm';

export type Tag = {
  id: number;
  name: string;
};

export async function listAllTags(): Promise<Tag[]> {
  const rows = await db.select({ id: tags.id, name: tags.name }).from(tags).orderBy(tags.name).execute();
  return rows as Tag[];
}

export async function listTagsForPost(postId: number): Promise<Tag[]> {
  const rows = await db
    .select({ id: tags.id, name: tags.name })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId))
    .execute();
  return rows as Tag[];
}

export async function listPostsPaginated({
  offset,
  limit,
  search,
  tags: tagIds,
}: {
  offset: number;
  limit: number;
  search?: string;
  tags?: number[];
}): Promise<{ posts: Awaited<ReturnType<typeof db.select>>; total: number }> {
  let query = db.select({
    id: posts.id,
    title: posts.title,
    slug: posts.slug,
    content: posts.content,
    created_at: posts.created_at,
  }).from(posts);

  if (search) {
    query = query.where(
      or(
        like(posts.title, `%${search}%`),
        like(posts.content, `%${search}%`)
      )
    );
  }
  if (tagIds && tagIds.length) {
    query = query.where(
      exists(
        select()
          .from(postTags)
          .where(and(eq(postTags.postId, posts.id), inArray(postTags.tagId, tagIds)))
      )
    );
  }
  const totalRes = await query.clone().count('count').execute();
  const total = (totalRes[0] as any).count as number;
  const rows = await query
    .orderBy(desc(posts.created_at))
    .offset(offset)
    .limit(limit)
    .execute();
  return { posts: rows, total };
}