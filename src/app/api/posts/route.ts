import { NextResponse } from 'next/server';
import { listPosts, createPost } from '@/lib/posts';

// GET /api/posts – list all posts
export async function GET() {
  const posts = await listPosts();
  return NextResponse.json(posts);
}

// POST /api/posts – create a new post (JSON body)
export async function POST(req: Request) {
  const { title, slug, content } = await req.json();
  if (!title || !slug || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  await createPost({ title, slug, content });
  return NextResponse.json({ success: true }, { status: 201 });
}
