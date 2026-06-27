import db from '../db/db.ts';
import { posts, tags, postTags } from '../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

async function loadPostImages(slug: string) {
  const imgDir = path.join(process.cwd(), 'public', 'posts', slug, 'img');
  if (!fs.existsSync(imgDir) || !fs.statSync(imgDir).isDirectory()) {
    return [];
  }

  const ids = fs.readdirSync(imgDir).filter((id) => fs.statSync(path.join(imgDir, id)).isDirectory());

  return ids
    .map((id) => {
      const manifestPath = path.join(imgDir, id, 'manifest.json');
      if (!fs.existsSync(manifestPath)) return null;
      try {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch {
        return null;
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function buildExcerpt(rawContent: string, maxChars = 500): string {
  const { content: markdownBody } = matter(rawContent);
  const html = marked.parse(markdownBody || rawContent, { async: false }) as string;

  if (html.length <= maxChars) return html;

  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
  const selected: string[] = [];
  let length = 0;

  for (const [, body] of paragraphs) {
    const paragraph = `<p>${body}</p>`;
    const projected = length + paragraph.length;

    if (projected > maxChars) break;

    selected.push(paragraph);
    length = projected;
  }

  if (!selected.length) {
    const cut = html.slice(0, maxChars);
    const lastStart = cut.lastIndexOf('<');
    const lastEnd = cut.lastIndexOf('>');
    const safeCut = lastStart > lastEnd ? cut.slice(0, lastStart) : cut;
    return safeCut + '...';
  }

  if (length < html.length) selected.push('...');

  return selected.join('');
}

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

  const postsWithImages = await Promise.all(
    allPosts.map(async (post) => ({
      ...post,
      excerpt: buildExcerpt(post.content),
      images: await loadPostImages(post.slug),
    }))
  );

  // Generate main index
  const indexData = {
    posts: postsWithImages,
    total: postsWithImages.length,
    generatedAt: new Date().toISOString(),
  };

  // Write files
  const outDir = path.join(process.cwd(), 'public', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'posts-index.json'), JSON.stringify(indexData, null, 2));
  fs.writeFileSync(path.join(outDir, 'tags.json'), JSON.stringify(allTags, null, 2));
  fs.writeFileSync(path.join(outDir, 'post-tags.json'), JSON.stringify(allPostTags, null, 2));

  console.log(`Generated posts-index.json with ${postsWithImages.length} posts`);
  console.log(`Generated tags.json with ${allTags.length} tags`);
  console.log(`Generated post-tags.json with ${allPostTags.length} relationships`);

  // Generate TypeScript module for static import
  const postsModulePath = path.join(process.cwd(), 'lib', 'static-posts-generated.ts');
  const postsModuleContent = `// Auto-generated by generate-static-data.ts - DO NOT EDIT MANUALLY
export interface Post {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  created_at: number;
  images: Array<{
    original: string;
    src: string;
    srcset: string;
    sizes: string;
    blurDataUri: string;
    width: number | null;
    height: number | null;
  }>;

}

export const POSTS_DATA = ${JSON.stringify(postsWithImages, null, 2)} as const;

export function getAllPosts() {
  return POSTS_DATA;
}

export function getPostBySlug(slug: string) {
  return POSTS_DATA.find((p) => p.slug === slug);
}
`;
  fs.writeFileSync(postsModulePath, postsModuleContent);
  console.log(`Generated static-posts-generated.ts with ${postsWithImages.length} posts`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
