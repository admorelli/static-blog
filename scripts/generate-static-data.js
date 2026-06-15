const db = require('../db/db.ts').default;
const { posts, tags, postTags } = require('../db/schema.ts');
const { eq, desc } = require('drizzle-orm');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Generating static data...');

  // Ensure database has tables
  try {
    await db.select().from(posts).limit(1).execute();
  } catch (e) {
    console.log('Tables not found, running drizzle push...');
    const { execSync } = require('child_process');
    execSync('npx drizzle-kit push', { stdio: 'inherit', cwd: __dirname + '/..' });
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
      
    const techTag = tagRows.find(t => t.name === 'tech');
    const lifeTag = tagRows.find(t => t.name === 'life');
    const tutorialTag = tagRows.find(t => t.name === 'tutorial');
    
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
      
    const helloPost = postRows.find(p => p.slug === 'hello-world');
    const secondPost = postRows.find(p => p.slug === 'second-post');
    
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});