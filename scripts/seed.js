// eslint-disable-next-line @typescript-eslint/no-require-imports
const db = require('../db/db.ts').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { posts, tags, postTags } = require('../db/schema.ts');

async function main() {
  const existing = await db.select().from(posts).limit(1);
  if (existing.length) {
    console.log('Posts already exist, skipping seed');
    return;
  }
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

main().catch((e) => console.error(e));