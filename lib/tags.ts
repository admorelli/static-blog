import db from '../db/db';
import { tags, postTags, posts, type Post } from '../db/schema';
import { count, like, inArray, eq, or, and } from 'drizzle-orm';
import { desc } from 'drizzle-orm';

export type Tag = {
  id: number;
  name: string;
};

export type PostEntity = Pick<Post, 'id' | 'title' | 'slug' | 'content' | 'created_at'>;

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
  let query = db.select().from(posts);
  const condition = buildPostCondition({ search, tagIds });

  if (condition) {
    query = query.where(condition);
  }

  const rows = await query
    .orderBy(desc(posts.created_at))
    .offset(offset)
    .limit(limit)
    .execute();

  let countQuery = db.select({ count: count(posts.id) }).from(posts);
  if (tagIds && tagIds.length) {
    countQuery = countQuery.innerJoin(postTags, eq(postTags.postId, posts.id));
  }
  if (condition) {
    countQuery = countQuery.where(condition);
  }
  const countResult = await countQuery.execute();
  const total = Number(countResult[0]?.count ?? 0);

  return { posts: rows as PostEntity[], total };
}

function buildPostCondition(input: {
  search?: string;
  tagIds?: number[];
}) {
  const conditions: Array<ReturnType<typeof and> | ReturnType<typeof or>> = [];

  if (input.search) {
    conditions.push(
      or(
        like(posts.title, `%${input.search}%`),
        like(posts.content, `%${input.search}%`),
      ),
    );
  }

  if (input.tagIds && input.tagIds.length) {
    conditions.push(inArray(postTags.tagId, input.tagIds));
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  if (conditions.length > 1) {
    return and(...conditions);
  }

  return undefined;
}
