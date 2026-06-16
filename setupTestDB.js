import db from './db/db';
import { tags as tagsSchema, posts as postsSchema, postTags as postTagsSchema } from './db/schema';

export async function resetDatabase() {
  // Clean tables respecting FK order
  await db.run('DELETE FROM post_tags');
  await db.run('DELETE FROM posts');
  await db.run('DELETE FROM tags');

  // Seed exactly 3 tags
  const tagRows = await db
    .insert(tagsSchema)
    .values([
      { name: 'life' },
      { name: 'science' },
      { name: 'tech' },
    ])
    .returning({ id: tagsSchema.id })
    .execute();
  const [lifeTag, scienceTag, techTag] = tagRows;

  // Seed 2 posts
  const postRows = await db
    .insert(postsSchema)
    .values([
      { title: 'Life Post', slug: 'life-post', content: 'About life', created_at: 1 },
      { title: 'Science Post', slug: 'science-post', content: 'Scientific content', created_at: 2 },
      { title: 'Tech Post', slug: 'tech-post', content: 'Tech content', created_at: 3 },
    ])
    .returning({ id: postsSchema.id })
    .execute();
  const [lifePost, sciencePost, techPost] = postRows;

  await db
    .insert(postTagsSchema)
    .values([
      { postId: lifePost.id, tagId: lifeTag.id },
      { postId: sciencePost.id, tagId: scienceTag.id },
      { postId: techPost.id, tagId: techTag.id },
    ])
    .execute();
}

// Run before each test suite
beforeEach(async () => {
  await resetDatabase();
});