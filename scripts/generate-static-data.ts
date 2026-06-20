import db from '../db/db.ts';
import { posts, tags, postTags } from '../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Generating static data...');

  // Ensure database has tables
  try {
    await db.select().from(posts).limit(1).execute();
  } catch (e) {
    console.log('Tables not found, running drizzle push...');
    const { execSync } = await import('child_process');
    execSync('npx drizzle-kit push', { stdio: 'inherit', cwd: __dirname + '/..' });
  }

  // Create FTS5 virtual table and triggers
  try {
    await db.$client.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
        id UNINDEXED, title, content, tokenize='porter unicode61'
      );
    `);
    await db.$client.exec(`
      CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
        INSERT INTO posts_fts(id, title, content) VALUES (new.id, new.title, new.content);
      END;
    `);
    await db.$client.exec(`
      CREATE TRIGGER IF NOT EXISTS posts_fts_update AFTER UPDATE ON posts BEGIN
        UPDATE posts_fts SET title = new.title, content = new.content WHERE id = new.id;
      END;
    `);
    await db.$client.exec(`
      CREATE TRIGGER IF NOT EXISTS posts_fts_delete AFTER DELETE ON posts BEGIN
        DELETE FROM posts_fts WHERE id = old.id;
      END;
    `);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log('FTS5 table already exists or creation failed:', msg);
  }

  // Seed if empty
  const existing = await db.select().from(posts).limit(1).execute();
  if (existing.length === 0) {
    console.log('Database empty, seeding...');
    const now = Math.floor(Date.now() / 1000);
    
    // Create tags
    const tagRows = await db
      .insert(tags)
      .values([{ name: 'tech' }, { name: 'life' }, { name: 'tutorial' }])
      .returning({ id: tags.id, name: tags.name })
      .execute();
      
    const techTag = tagRows.find((t: { name: string }) => t.name === 'tech');
    const lifeTag = tagRows.find((t: { name: string }) => t.name === 'life');
    const tutorialTag = tagRows.find((t: { name: string }) => t.name === 'tutorial');
    
    // Create posts
    const postRows = await db
      .insert(posts)
      .values([
        {
          title: 'Hello World',
          slug: 'hello-world',
          content: '<p>Welcome to my blog built with Next.js, Tailwind and Drizzle ORM.</p>',
          created_at: now,
        },
        {
          title: 'Second Post',
          slug: 'second-post',
          content: '<p>This is another post.</p>',
          created_at: now,
        },
      ])
      .returning({ id: posts.id, slug: posts.slug })
      .execute();
      
    const helloPost = postRows.find((p: { slug: string }) => p.slug === 'hello-world');
    const secondPost = postRows.find((p: { slug: string }) => p.slug === 'second-post');
    
    // Link posts to tags
    if (helloPost && techTag) {
      await db.insert(postTags).values([{ postId: helloPost.id, tagId: techTag.id }]).execute();
    }
    if (secondPost && lifeTag) {
      await db.insert(postTags).values([{ postId: secondPost.id, tagId: lifeTag.id }]).execute();
    }
    if (secondPost && tutorialTag) {
      await db.insert(postTags).values([{ postId: secondPost.id, tagId: tutorialTag.id }]).execute();
    }
    
    console.log('Seeded posts with tags');
  }

  // Create FTS5 virtual table and triggers
  try {
    await db.$client.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
        id UNINDEXED, title, content, tokenize='porter unicode61'
      );
    `);
    await db.$client.exec(`
      CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
        INSERT INTO posts_fts(id, title, content) VALUES (new.id, new.title, new.content);
      END;
    `);
    await db.$client.exec(`
      CREATE TRIGGER IF NOT EXISTS posts_fts_update AFTER UPDATE ON posts BEGIN
        UPDATE posts_fts SET title = new.title, content = new.content WHERE id = new.id;
      END;
    `);
    await db.$client.exec(`
      CREATE TRIGGER IF NOT EXISTS posts_fts_delete AFTER DELETE ON posts BEGIN
        DELETE FROM posts_fts WHERE id = old.id;
      END;
    `);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log('FTS5 table already exists or creation failed:', msg);
  }

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
  const allTags = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .orderBy(tags.name)
    .execute();

  // Generate main index
  const indexData = {
    posts: allPosts,
    total: allPosts.length,
    generatedAt: new Date().toISOString(),
  };

  // Write files
  const outDir = path.join(process.cwd(), 'public', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'posts-index.json'), JSON.stringify(indexData, null, 2));
  fs.writeFileSync(path.join(outDir, 'tags.json'), JSON.stringify(allTags, null, 2));
  fs.writeFileSync(path.join(outDir, 'post-tags.json'), JSON.stringify(allPostTags, null, 2));

  console.log(`Generated posts-index.json with ${allPosts.length} posts`);
  console.log(`Generated tags.json with ${allTags.length} tags`);
  console.log(`Generated post-tags.json with ${allPostTags.length} relationships`);
  
  // Generate TypeScript module for static import
  const postsModulePath = path.join(process.cwd(), 'lib', 'static-posts-generated.ts');
  const postsModuleContent = `// Auto-generated by generate-static-data.ts - DO NOT EDIT MANUALLY
export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
  series: string | null;
  series_order: number | null;
}

export const POSTS_DATA = ${JSON.stringify(allPosts, null, 2)} as const;

export function getAllPosts() {
  return POSTS_DATA;
}

export function getPostBySlug(slug: string) {
  return POSTS_DATA.find((p) => p.slug === slug);
}
`;
  fs.writeFileSync(postsModulePath, postsModuleContent);
  console.log(`Generated static-posts-generated.ts with ${allPosts.length} posts`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});