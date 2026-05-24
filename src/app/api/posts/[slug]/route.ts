import { NextResponse } from 'next/server';
import { getPostBySlug } from '@/lib/posts';
import { listTagsForPost } from '@/lib/tags';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  const postTags = await listTagsForPost(post.id);
  return NextResponse.json({ ...post, tags: postTags });
}