import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import db from '../db/db';
import { posts, tags, postTags } from '../db/schema';
import { createPost, updatePost, deletePost, getPostBySlug } from '../lib/posts';
import { listAllTags, listTagsForPost, listPostsPaginated } from '../lib/tags';

// Helper to reset DB before each test suite
async function setupDatabase() {
  // Create tables
  db.$client.exec(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT 0
  );`);
  db.$client.exec(`CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);`);
  db.$client.exec(`CREATE TABLE IF NOT EXISTS post_tags (post_id INTEGER NOT NULL REFERENCES posts(id), tag_id INTEGER NOT NULL REFERENCES tags(id));`);
}

async function resetDatabase() {
  // Delete in order to respect foreign keys
  await db.run('DELETE FROM post_tags');
  await db.run('DELETE FROM posts');
  await db.run('DELETE FROM tags');
}

describe('Posts library API', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    // Final cleanup
    await resetDatabase();
  });

  it('creates a post and returns its id', async () => {
    const id = await createPost({ title: 'Hello', content: 'World', tags: [] });
    expect(typeof id).toBe('number');
    const post = await getPostBySlug('hello');
    expect(post?.title).toBe('Hello');
  });

  it('updates a post title', async () => {
    const id = await createPost({ title: 'Old', content: 'Text', tags: [] });
    await updatePost(id, { title: 'New' });
    const post = await getPostBySlug('old');
    expect(post?.title).toBe('New');
  });

  it('deletes a post', async () => {
    const id = await createPost({ title: 'Temp', content: 'Tmp', tags: [] });
    await deletePost(id);
    const post = await getPostBySlug('temp');
    expect(post).toBeUndefined();
  });
});