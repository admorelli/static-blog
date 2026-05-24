import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createPost, listPosts, deletePost } from './posts';
import db from '../db/db';
import { posts } from '../db/schema';

beforeAll(() => {
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER
  );`);
});

afterAll(() => {
  // No teardown needed; test DB is isolated per run
});

afterAll(async () => {
  // Clean up again
  const all = await listPosts();
  for (const p of all) {
    await deletePost(p.id);
  }
});

describe('posts CRUD', () => {
  it('should create and list a post', async () => {
    await createPost({
      title: 'Test Post',
      slug: 'test-post',
      content: 'Hello world',
    });
    const posts = await listPosts();
    expect(posts.length).toBe(1);
    const post = posts[0];
    expect(post.title).toBe('Test Post');
    expect(post.slug).toBe('test-post');
    expect(post.content).toBe('Hello world');
  });
});
