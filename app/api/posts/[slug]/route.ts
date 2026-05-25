import { NextResponse, type NextRequest } from 'next/server';
import db from '@/db/db';
import { posts, tags, postTags } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const postRows = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      content: posts.content,
      created_at: posts.created_at,
    })
    .from(posts)
    .where(eq(posts.slug, slug))
    .execute();
  if (!postRows.length) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  const post = postRows[0];
  const tagRows = await db
    .select({ id: tags.id, name: tags.name })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, post.id))
    .execute();
  const postWithTags = { ...post, tags: tagRows };
  return NextResponse.json(postWithTags);
}
