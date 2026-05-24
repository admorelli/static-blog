import { NextResponse } from 'next/server';
import db from '@/db/db';
import { posts, tags, postTags } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function POST(req: Request) {
  const { title, slug, content, tags: tagNames } = await req.json();
  if (!title || !slug || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const tx = await db.transaction(async (tx) => {
    const postRes = await tx
      .insert(posts)
      .values({ title, slug, content, created_at: Math.floor(Date.now() / 1000) })
      .returning({ id: posts.id });
    const postId = postRes[0].id;
    const existingTags = await tx.select({ id: tags.id, name: tags.name }).from(tags).where(inArray(tags.name, tagNames)).execute();
    const existingTagMap = Object.fromEntries(existingTags.map((t) => [t.name, t.id]));
    const newTagNames = tagNames.filter((n: string) => !existingTagMap[n]);
    let createdTagIds: number[] = [];
    if (newTagNames.length) {
      const inserted = await tx
        .insert(tags)
        .values(newTagNames.map((n) => ({ name: n })))
        .returning({ id: tags.id });
      createdTagIds = inserted.map((t) => t.id);
    }
    const allTagIds = [...Object.values(existingTagMap), ...createdTagIds];
    if (allTagIds.length) {
      await tx.insert(postTags).values(allTagIds.map((tid) => ({ postId, tagId: tid }))).execute();
    }
    return postId;
  });
  return NextResponse.json({ success: true, postId: tx });
}
