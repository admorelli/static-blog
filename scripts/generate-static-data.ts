import db from '../db/db.ts';
import { posts, tags, postTags } from '../db/schema.ts';
import { eq, desc, like, or, inArray, and, count } from 'drizzle-orm';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface PostEntity {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
}

interface PaginatedResult {
  posts: PostEntity[];
  total: number;
}

async function generateStaticData() {
  console.log('Generating static data...');

  // Generate all posts for static params
  const allPosts = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.created_at))
    .execute();

  // Generate all post-tag relationships
  const allPostTags = await db
    .select({ postId: postTags.postId, tagId: postTags.tagId })
    .from(postTags)
    .execute();

  // Generate tag list
  const allTags = await db.select({ id: tags.id, name: tags.name }).from(tags).orderBy(tags.name).execute();

  // Generate main index
  const indexData = {
    posts: allPosts as PostEntity[],
    total: allPosts.length,
    generatedAt: new Date().toISOString(),
  };

  // Write files
  const outDir = join(process.cwd(), 'public', 'data');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'posts-index.json'), JSON.stringify(indexData, null, 2));
  writeFileSync(join(outDir, 'tags.json'), JSON.stringify(allTags, null, 2));
  writeFileSync(join(outDir, 'post-tags.json'), JSON.stringify(allPostTags, null, 2));

  console.log(`Generated posts-index.json with ${allPosts.length} posts`);
  console.log(`Generated tags.json with ${allTags.length} tags`);
  console.log(`Generated post-tags.json with ${allPostTags.length} relationships`);
}

generateStaticData().catch((e) => {
  console.error(e);
  process.exit(1);
});