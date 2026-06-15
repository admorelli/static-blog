import db from '../db/db';
import { tags, postTags, posts } from '../db/schema';
import { count, like, inArray, eq, or, and } from 'drizzle-orm';
import { desc } from 'drizzle-orm';

export type Tag = {
  id: number;
  name: string;
};

export type PostEntity = {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
};

export async function listAllTags(): Promise<Tag[]> {
  return await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .orderBy(tags.name)
    .execute();
}

export async function listTagsForPost(postId: number): Promise<Tag[]> {
  return await db
    .select({ id: tags.id, name: tags.name })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId))
    .execute();
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
}): Promise<{ posts: PostEntity[]; total: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = db.select().from(posts);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let condition: any = undefined;

  if (search) {
    condition = or(
      like(posts.title, `%${search}%`),
      like(posts.content, `%${search}%`)
    );
  }

  if (tagIds && tagIds.length) {
    console.log('DEBUG: filtering by tagIds', tagIds);
    query = query.innerJoin(postTags, eq(postTags.postId, posts.id));
    const tagCond = inArray(postTags.tagId, tagIds);
    condition = condition ? and(condition, tagCond) : tagCond;
  }

  if (condition) {
    query = query.where(condition);
  }

  const rows = await query
    .orderBy(desc(posts.created_at))
    .offset(offset)
    .limit(limit)
    .execute();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let countQuery: any = db.select({ count: count(posts.id) }).from(posts);
  if (tagIds && tagIds.length) {
    countQuery = countQuery.innerJoin(postTags, eq(postTags.postId, posts.id));
  }
  if (condition) {
    countQuery = countQuery.where(condition);
  }
  const countResult = await countQuery.execute();
  const total = countResult[0]?.count ?? 0;

  return { posts: rows as PostEntity[], total };
}