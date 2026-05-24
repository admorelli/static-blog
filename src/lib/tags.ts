import db from '../db/db';
import { tags, postTags } from '../db/schema';
import { desc, eq, and, or, like, inArray, exists, select } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';

export type Tag = {
  id: number;
  name: string;
};

export async function listAllTags(): Promise<Tag[]> {
  return db.select().from(tags).orderBy(tags.name) as unknown as Tag[];
}

export async function listTagsForPost(postId: number): Promise<Tag[]> {
  return db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId))
    .execute() as unknown as Tag[];
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
}): Promise<{ posts: any[]; total: number }>
{
  const query = db.select().from(posts);
  if (search) {
    query.where(
      or(
        like(posts.title, `%${search}%`),
        like(posts.content, `%${search}%`)
      )
    );
  }
  if (tagIds && tagIds.length) {
    query.where(
      exists(
        select()
          .from(postTags)
          .where(
            and(eq(postTags.postId, posts.id), eq(postTags.tagId, inArray(postTags.tagId, tagIds)))
          )
      )
    );
  }
  // Get total count
  const total = (await query.clone().count('count')).count as number;
  // Apply pagination
  const rows = await query
    .orderBy(desc(posts.created_at))
    .offset(offset)
    .limit(limit)
    .execute();
  return { posts: rows as any[], total };
}
