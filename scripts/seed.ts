import db from '../db/db.ts';
import { posts } from '../db/schema.ts';

async function main() {
  const existing = await db.select().from(posts).limit(1);
  if (existing.length) {
    console.log('Posts already exist, skipping seed');
    return;
  }
  const now = Math.floor(Date.now() / 1000);
  await db.insert(posts).values([
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
  ]);
  console.log('Seeded posts');
}

main().catch((e) => console.error(e));
