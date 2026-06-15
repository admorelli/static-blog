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

/** List all tags */
export async function listAllTags(): Promise<Tag[]> {
  return await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .orderBy(tags.name)
    .execute();
}

/** List tags for a specific post */
export async function listTagsForPost(postId: number): Promise<Tag[]> {
  return await db
    .select({ id: tags.id, name: tags.name })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId))
    .execute();
}

/** Paginated list of posts with optional search and tag filtering */
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
  // Start from posts table
  let query = db.select().from(posts);

  // Build filter condition
  let condition: any = undefined;

  if (search) {
    condition = or(
      like(posts.title, `%${search}%`),
      like(posts.content, `%${search}%`)
    );
  }

  if (tagIds && tagIds.length) {
    console.log('DEBUG: filtering by tagIds', tagIds);
    query = (query as any).innerJoin(postTags, eq(postTags.postId, posts.id));
    const tagCond = inArray(postTags.tagId, tagIds);
    condition = condition ? and(condition, tagCond) : tagCond;
  }

  if (condition) {
    query = (query as any).where(condition);
  }

  // Execute with pagination (fields already selected)
  const rows = await query
    .orderBy(desc(posts.created_at))
    .offset(offset)
    .limit(limit)
    .execute();

  // Total rows - need separate count query for accurate total
  let countQuery = db.select({ count: count(posts.id) }).from(posts);
  // Apply same joins and conditions for count
  if (tagIds && tagIds.length) {
    countQuery = (countQuery as any).innerJoin(postTags, eq(postTags.postId, posts.id));
  }
  if (condition) {
    (countQuery as any).where(condition);
  }
  const countResult = await countQuery.execute();
  const total = countResult[0]?.count ?? 0;

  return { posts: rows as PostEntity[], total };
}
